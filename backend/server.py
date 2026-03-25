from fastapi import FastAPI, APIRouter, Depends, HTTPException, Response, Cookie, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
import uuid
from typing import List, Optional, Annotated

from models import *
from auth import get_current_user, create_session, hash_password, verify_password, process_google_session
from question_generator import QuestionGenerator, SUBJECTS_BY_YEAR
from payment_service import PaymentService, SUBSCRIPTION_PRICES, SUBSCRIPTION_PACKAGES
from schools_data import (
    PORTUGUESE_DISTRICTS, PORTUGUESE_SCHOOLS, 
    get_schools_by_district_and_cycle, get_cycle_from_year,
    get_unique_municipalities, get_unique_localities, get_schools_by_filters
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Dependency to get current user with proper Request injection
async def get_current_user_dep(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    return await get_current_user(request, db, session_token)

app = FastAPI()
api_router = APIRouter(prefix="/api")

question_gen = QuestionGenerator()
payment_service = PaymentService()

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=User)
async def register(data: RegisterRequest):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email já registado")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_pw = await hash_password(data.password)
    
    user = User(
        user_id=user_id,
        email=data.email,
        name=data.name,
        role=data.role,
        created_at=datetime.now(timezone.utc)
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['password'] = hashed_pw
    
    await db.users.insert_one(user_dict)
    
    if data.role == UserRole.PARENT:
        parent_profile = ParentProfile(user_id=user_id)
        await db.parents.insert_one(parent_profile.model_dump())
    
    return user

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: LoginRequest, response: Response):
    user_doc = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    if not await verify_password(data.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    session_token = await create_session(db, user_doc['user_id'])
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password'})
    
    return TokenResponse(session_token=session_token, user=user)

@api_router.post("/auth/google/session")
async def google_session(session_id: str, response: Response):
    result = await process_google_session(db, session_id)
    
    response.set_cookie(
        key="session_token",
        value=result["session_token"],
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return result

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user_dep)):
    return current_user

@api_router.post("/auth/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user_dep)
):
    await db.user_sessions.delete_many({"user_id": current_user.user_id})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logout bem-sucedido"}

# ==================== STUDENT ROUTES ====================

@api_router.post("/students", response_model=StudentCreateResponse)
async def create_student(
    data: StudentCreate,
    current_user: User = Depends(get_current_user_dep)
):
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Apenas pais podem criar alunos")
    
    # Check if email already exists
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Este email já está registado")
    
    student_id = f"student_{uuid.uuid4().hex[:12]}"
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    
    # Generate a temporary password (first 8 chars of student_id)
    temp_password = student_id[-8:]
    hashed_pw = await hash_password(temp_password)
    
    user = User(
        user_id=user_id,
        email=data.email,
        name=data.name,
        role=UserRole.STUDENT,
        created_at=datetime.now(timezone.utc)
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['password'] = hashed_pw
    await db.users.insert_one(user_dict)
    
    student = StudentProfile(
        user_id=user_id,
        student_id=student_id,
        nickname=data.nickname,
        parent_id=current_user.user_id,
        school_year=data.school_year,
        school_name=data.school_name,
        district=data.district,
        approved_by_parent=True
    )
    
    student_dict = student.model_dump()
    student_dict['temp_password'] = temp_password  # Include temp password in response
    await db.students.insert_one(student.model_dump())
    
    await db.parents.update_one(
        {"user_id": current_user.user_id},
        {"$push": {"children_ids": user_id}}
    )
    
    # Return with temp password so parent can share with child
    return {**student.model_dump(), "temp_password": temp_password}

@api_router.get("/students/me", response_model=StudentProfile)
async def get_my_student_profile(
    current_user: User = Depends(get_current_user_dep)
):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    student = await db.students.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    
    return StudentProfile(**student)

@api_router.get("/parents/me/children")
async def get_my_children(
    current_user: User = Depends(get_current_user_dep)
):
    """Get all children of the current parent"""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Apenas para pais")
    
    # Get parent profile to find children IDs
    parent = await db.parents.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not parent:
        return []
    
    children_ids = parent.get("children_ids", [])
    if not children_ids:
        return []
    
    # Get all students that belong to this parent
    students = await db.students.find(
        {"user_id": {"$in": children_ids}},
        {"_id": 0}
    ).to_list(10)
    
    return students

@api_router.get("/students/search", response_model=List[StudentProfile])
async def search_students(
    nickname: Optional[str] = None,
    district: Optional[str] = None,
    school_name: Optional[str] = None,
    current_user: User = Depends(get_current_user_dep)
):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    query = {"approved_by_parent": True}
    if nickname:
        query["nickname"] = {"$regex": nickname, "$options": "i"}
    if district:
        query["district"] = district
    if school_name:
        query["school_name"] = {"$regex": school_name, "$options": "i"}
    
    students = await db.students.find(query, {"_id": 0}).limit(20).to_list(20)
    return [StudentProfile(**s) for s in students]

# ==================== QUESTION ROUTES ====================

@api_router.post("/questions/generate")
async def generate_questions(
    data: QuestionGenerate,
    current_user: User = Depends(get_current_user_dep)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    questions = await question_gen.generate_questions(
        data.school_year,
        data.subject,
        data.count
    )
    
    for q in questions:
        question_id = f"q_{uuid.uuid4().hex[:12]}"
        question = Question(
            question_id=question_id,
            school_year=data.school_year,
            subject=data.subject,
            question_text=q['question_text'],
            options=q['options'],
            correct_answer=q['correct_answer'],
            difficulty=q.get('difficulty', 1),
            created_at=datetime.now(timezone.utc)
        )
        
        q_dict = question.model_dump()
        q_dict['created_at'] = q_dict['created_at'].isoformat()
        await db.questions.insert_one(q_dict)
    
    return {"message": f"{len(questions)} perguntas geradas", "count": len(questions)}

@api_router.get("/questions/{school_year}/{subject}")
async def get_questions(
    school_year: SchoolYear,
    subject: str,
    limit: int = 10,
    current_user: User = Depends(get_current_user_dep)
):
    questions = await db.questions.find(
        {"school_year": school_year, "subject": subject},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    return questions

@api_router.get("/subjects/{school_year}")
async def get_subjects(school_year: SchoolYear):
    return {"subjects": SUBJECTS_BY_YEAR.get(school_year, [])}

# ==================== SUBSCRIPTION ROUTES ====================

@api_router.post("/subscriptions")
async def create_subscription(
    data: SubscriptionCreate,
    current_user: User = Depends(get_current_user_dep)
):
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Apenas pais podem subscrever")
    
    price = payment_service.get_subscription_price(data.type)
    
    payment_ref = await payment_service.generate_multibanco_reference(price)
    
    subscription_id = f"sub_{uuid.uuid4().hex[:12]}"
    
    duration_days = 30 if "monthly" in data.type.value else 365
    
    subscription = Subscription(
        subscription_id=subscription_id,
        user_id=current_user.user_id,
        type=data.type,
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc) + timedelta(days=duration_days),
        association_code=data.association_code,
        payment_reference=payment_ref['reference']
    )
    
    sub_dict = subscription.model_dump()
    sub_dict['start_date'] = sub_dict['start_date'].isoformat()
    sub_dict['end_date'] = sub_dict['end_date'].isoformat()
    
    await db.subscriptions.insert_one(sub_dict)
    
    await db.parents.update_one(
        {"user_id": current_user.user_id},
        {
            "$set": {
                "subscription_type": data.type,
                "subscription_expiry": sub_dict['end_date']
            }
        }
    )
    
    if data.association_code:
        commission_amount = payment_service.calculate_commission(price)
        association = await db.associations.find_one(
            {"association_code": data.association_code},
            {"_id": 0}
        )
        
        if association:
            commission = Commission(
                commission_id=f"com_{uuid.uuid4().hex[:12]}",
                association_id=association['association_id'],
                amount=commission_amount,
                subscription_id=subscription_id,
                created_at=datetime.now(timezone.utc)
            )
            
            com_dict = commission.model_dump()
            com_dict['created_at'] = com_dict['created_at'].isoformat()
            await db.commissions.insert_one(com_dict)
            
            await db.associations.update_one(
                {"association_id": association['association_id']},
                {
                    "$inc": {
                        "total_commissions": commission_amount,
                        "pending_payout": commission_amount
                    }
                }
            )
    
    return {
        "subscription": subscription,
        "payment_reference": payment_ref
    }

@api_router.get("/subscriptions/prices")
async def get_subscription_prices():
    return {
        "individual_monthly": SUBSCRIPTION_PRICES.get(SubscriptionType.INDIVIDUAL_MONTHLY),
        "individual_annual": SUBSCRIPTION_PRICES.get(SubscriptionType.INDIVIDUAL_ANNUAL),
        "family_monthly": SUBSCRIPTION_PRICES.get(SubscriptionType.FAMILY_MONTHLY),
        "family_annual": SUBSCRIPTION_PRICES.get(SubscriptionType.FAMILY_ANNUAL),
    }

# ==================== STRIPE PAYMENT ROUTES ====================

@api_router.post("/payments/checkout")
async def create_checkout(
    data: CheckoutRequest,
    current_user: User = Depends(get_current_user_dep)
):
    """Create a Stripe checkout session for subscription purchase"""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Apenas pais podem subscrever")
    
    try:
        # Create checkout session (amount is fetched from backend, not frontend)
        result = await payment_service.create_checkout_session(
            package_id=data.package_id,
            origin_url=data.origin_url,
            user_id=current_user.user_id,
            user_email=current_user.email,
            association_code=data.association_code
        )
        
        # Create payment transaction record BEFORE redirecting to Stripe
        transaction = PaymentTransaction(
            transaction_id=f"txn_{uuid.uuid4().hex[:12]}",
            session_id=result['session_id'],
            user_id=current_user.user_id,
            user_email=current_user.email,
            package_id=data.package_id,
            amount=result['amount'],
            currency="eur",
            status="pending",
            payment_status="unpaid",
            association_code=data.association_code,
            created_at=datetime.now(timezone.utc)
        )
        
        txn_dict = transaction.model_dump()
        txn_dict['created_at'] = txn_dict['created_at'].isoformat()
        await db.payment_transactions.insert_one(txn_dict)
        
        return CheckoutResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Checkout error: {e}")
        raise HTTPException(status_code=500, detail="Erro ao criar sessão de pagamento")

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(
    session_id: str,
    request: Request,
    current_user: User = Depends(get_current_user_dep)
):
    """Get the status of a checkout session and update database"""
    origin_url = str(request.base_url).rstrip('/')
    
    try:
        # Get current status from Stripe
        status = await payment_service.get_checkout_status(session_id, origin_url)
        
        # Find the transaction
        transaction = await db.payment_transactions.find_one(
            {"session_id": session_id},
            {"_id": 0}
        )
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transação não encontrada")
        
        # Only process if payment is successful and not already processed
        if status.payment_status == "paid" and transaction.get('payment_status') != "paid":
            # Update transaction status
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "status": "completed",
                        "payment_status": "paid",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            # Activate subscription
            package_id = transaction.get('package_id')
            duration_days = 30 if "monthly" in package_id else 365
            
            subscription_id = f"sub_{uuid.uuid4().hex[:12]}"
            sub_type = SubscriptionType(package_id)
            
            subscription = Subscription(
                subscription_id=subscription_id,
                user_id=transaction['user_id'],
                type=sub_type,
                start_date=datetime.now(timezone.utc),
                end_date=datetime.now(timezone.utc) + timedelta(days=duration_days),
                association_code=transaction.get('association_code'),
                payment_reference=session_id,
                status="active"
            )
            
            sub_dict = subscription.model_dump()
            sub_dict['start_date'] = sub_dict['start_date'].isoformat()
            sub_dict['end_date'] = sub_dict['end_date'].isoformat()
            
            await db.subscriptions.insert_one(sub_dict)
            
            # Update parent premium status
            await db.parents.update_one(
                {"user_id": transaction['user_id']},
                {
                    "$set": {
                        "subscription_type": sub_type,
                        "subscription_expiry": sub_dict['end_date'],
                        "premium_active": True
                    }
                }
            )
            
            # Process commission if association code was used
            if transaction.get('association_code'):
                commission_amount = payment_service.calculate_commission(transaction['amount'])
                association = await db.associations.find_one(
                    {"association_code": transaction['association_code']},
                    {"_id": 0}
                )
                
                if association:
                    commission = Commission(
                        commission_id=f"com_{uuid.uuid4().hex[:12]}",
                        association_id=association['association_id'],
                        amount=commission_amount,
                        subscription_id=subscription_id,
                        created_at=datetime.now(timezone.utc)
                    )
                    
                    com_dict = commission.model_dump()
                    com_dict['created_at'] = com_dict['created_at'].isoformat()
                    await db.commissions.insert_one(com_dict)
                    
                    await db.associations.update_one(
                        {"association_id": association['association_id']},
                        {
                            "$inc": {
                                "total_commissions": commission_amount,
                                "pending_payout": commission_amount
                            }
                        }
                    )
        
        elif status.status == "expired":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "status": "expired",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
        
    except Exception as e:
        logger.error(f"Payment status error: {e}")
        raise HTTPException(status_code=500, detail="Erro ao verificar estado do pagamento")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    origin_url = str(request.base_url).rstrip('/')
    
    try:
        event = await payment_service.handle_webhook(body, signature, origin_url)
        
        # Process the webhook event
        if event.event_type == "checkout.session.completed":
            session_id = event.session_id
            
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "status": "completed",
                        "payment_status": "paid",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            logger.info(f"Webhook: Payment completed for session {session_id}")
        
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Webhook error")

# ==================== GIFTCARD ROUTES ====================

@api_router.post("/giftcards")
async def create_giftcard(
    subscription_type: SubscriptionType,
    association_code: Optional[str] = None,
    current_user: User = Depends(get_current_user_dep)
):
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Apenas pais")
    
    price = payment_service.get_subscription_price(subscription_type)
    code = payment_service.generate_giftcard_code()
    
    giftcard = Giftcard(
        giftcard_id=f"gift_{uuid.uuid4().hex[:12]}",
        code=code,
        type=subscription_type,
        value=price,
        created_at=datetime.now(timezone.utc),
        association_code=association_code
    )
    
    gift_dict = giftcard.model_dump()
    gift_dict['created_at'] = gift_dict['created_at'].isoformat()
    
    await db.giftcards.insert_one(gift_dict)
    
    return giftcard

@api_router.post("/giftcards/redeem/{code}")
async def redeem_giftcard(
    code: str,
    current_user: User = Depends(get_current_user_dep)
):
    giftcard = await db.giftcards.find_one({"code": code, "used": False}, {"_id": 0})
    
    if not giftcard:
        raise HTTPException(status_code=404, detail="Giftcard inválido ou já usado")
    
    await db.giftcards.update_one(
        {"code": code},
        {
            "$set": {
                "used": True,
                "used_by": current_user.user_id,
                "used_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Giftcard resgatado com sucesso", "value": giftcard['value']}

# ==================== ASSOCIATION ROUTES ====================

@api_router.post("/associations", response_model=AssociationProfile)
async def create_association(data: AssociationCreate):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email já registado")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    association_id = f"assoc_{uuid.uuid4().hex[:12]}"
    association_code = f"ASSOC-{uuid.uuid4().hex[:6].upper()}"
    
    user = User(
        user_id=user_id,
        email=data.email,
        name=data.name,
        role=UserRole.ASSOCIATION,
        created_at=datetime.now(timezone.utc)
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    association = AssociationProfile(
        user_id=user_id,
        association_id=association_id,
        association_name=data.association_name,
        school_id=data.school_id,
        school_name=data.school_name,
        district=data.district,
        municipality=data.municipality,
        locality=data.locality,
        iban=data.iban,
        responsible_names=data.responsible_names,
        association_code=association_code,
        documents_urls=data.documents_urls,
        created_at=datetime.now(timezone.utc)
    )
    
    assoc_dict = association.model_dump()
    assoc_dict['created_at'] = assoc_dict['created_at'].isoformat() if assoc_dict['created_at'] else None
    await db.associations.insert_one(assoc_dict)
    
    # Notify parents who have children at this school
    # Find students at this school
    students_at_school = await db.students.find(
        {"school_id": data.school_id},
        {"_id": 0, "parent_id": 1}
    ).to_list(1000)
    
    parent_ids = list(set([s["parent_id"] for s in students_at_school]))
    
    # Create notifications for these parents
    for parent_id in parent_ids:
        notification = {
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_id": parent_id,
            "type": "association_registered",
            "title": "Nova Associação de Pais!",
            "message": f"A Associação de Pais '{data.association_name}' da escola '{data.school_name}' já está no QUESTEDUCA! Peça o código e ajude com 10% da sua próxima subscrição!",
            "association_code": association_code,
            "school_name": data.school_name,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
    
    return association

@api_router.get("/associations/me/commissions")
async def get_my_commissions(
    current_user: User = Depends(get_current_user_dep)
):
    if current_user.role != UserRole.ASSOCIATION:
        raise HTTPException(status_code=403, detail="Apenas associações")
    
    association = await db.associations.find_one({"user_id": current_user.user_id}, {"_id": 0})
    
    if not association:
        raise HTTPException(status_code=404, detail="Associação não encontrada")
    
    commissions = await db.commissions.find(
        {"association_id": association['association_id']},
        {"_id": 0}
    ).to_list(100)
    
    return {
        "total_commissions": association['total_commissions'],
        "pending_payout": association['pending_payout'],
        "commissions": commissions
    }

@api_router.get("/associations/me")
async def get_my_association(
    current_user: User = Depends(get_current_user_dep)
):
    """Get the current association's profile"""
    if current_user.role != UserRole.ASSOCIATION:
        raise HTTPException(status_code=403, detail="Apenas associações")
    
    association = await db.associations.find_one({"user_id": current_user.user_id}, {"_id": 0})
    
    if not association:
        raise HTTPException(status_code=404, detail="Associação não encontrada")
    
    return association

# ==================== ASSOCIATION CODE ROUTES ====================

@api_router.post("/parents/me/association-code")
async def register_association_code(
    code: str,
    current_user: User = Depends(get_current_user_dep)
):
    """
    Register an association code for a parent.
    Rules:
    - If registered within 10 days of first subscription, retroactive commission applies
    - If registered after 10 days, only future payments get commission
    - Code stays permanently linked to the parent for all future payments
    """
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Apenas pais podem registar códigos")
    
    # Validate the association code exists
    association = await db.associations.find_one({"association_code": code.upper()}, {"_id": 0})
    if not association:
        raise HTTPException(status_code=404, detail="Código de associação não encontrado")
    
    # Get parent profile
    parent = await db.parents.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not parent:
        raise HTTPException(status_code=404, detail="Perfil de pai não encontrado")
    
    now = datetime.now(timezone.utc)
    first_sub_date = parent.get("first_subscription_date")
    
    # Determine if retroactive commission applies (within 10 days of first subscription)
    retroactive = False
    if first_sub_date:
        if isinstance(first_sub_date, str):
            first_sub_date = datetime.fromisoformat(first_sub_date.replace('Z', '+00:00'))
        days_since_sub = (now - first_sub_date).days
        retroactive = days_since_sub <= 10
    
    # Update parent profile with the association code
    await db.parents.update_one(
        {"user_id": current_user.user_id},
        {
            "$set": {
                "association_code": code.upper(),
                "association_code_registered_at": now.isoformat()
            }
        }
    )
    
    result = {
        "success": True,
        "association_name": association["association_name"],
        "association_code": code.upper(),
        "retroactive_commission": retroactive,
        "message": ""
    }
    
    if retroactive:
        # Apply retroactive commission to the most recent subscription
        recent_sub = await db.subscriptions.find_one(
            {"user_id": current_user.user_id, "status": "active"},
            {"_id": 0},
            sort=[("start_date", -1)]
        )
        
        if recent_sub and not recent_sub.get("association_code"):
            # Find the corresponding payment
            payment = await db.payment_transactions.find_one(
                {"session_id": recent_sub.get("payment_reference"), "payment_status": "paid"},
                {"_id": 0}
            )
            
            if payment:
                commission_amount = payment["amount"] * 0.10
                
                # Update subscription with association code
                await db.subscriptions.update_one(
                    {"subscription_id": recent_sub["subscription_id"]},
                    {"$set": {"association_code": code.upper()}}
                )
                
                # Create commission record
                commission = Commission(
                    commission_id=f"com_{uuid.uuid4().hex[:12]}",
                    association_id=association['association_id'],
                    amount=commission_amount,
                    subscription_id=recent_sub["subscription_id"],
                    created_at=now
                )
                
                com_dict = commission.model_dump()
                com_dict['created_at'] = com_dict['created_at'].isoformat()
                await db.commissions.insert_one(com_dict)
                
                # Update association totals
                await db.associations.update_one(
                    {"association_id": association['association_id']},
                    {
                        "$inc": {
                            "total_commissions": commission_amount,
                            "pending_payout": commission_amount
                        }
                    }
                )
                
                result["message"] = f"Código registado com sucesso! A comissão de €{commission_amount:.2f} foi aplicada retroativamente à associação."
        else:
            result["message"] = "Código registado! A comissão será aplicada às próximas subscrições."
    else:
        result["message"] = "Código registado! A comissão de 10% será aplicada a partir da próxima subscrição."
    
    return result

@api_router.get("/parents/me/notifications")
async def get_parent_notifications(
    current_user: User = Depends(get_current_user_dep)
):
    """Get notifications for the current parent"""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Apenas pais")
    
    notifications = await db.notifications.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return notifications

@api_router.put("/parents/me/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user_dep)
):
    """Mark a notification as read"""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Apenas pais")
    
    result = await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": current_user.user_id},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    return {"success": True}

@api_router.get("/associations/by-school/{school_id}")
async def get_association_by_school(school_id: str):
    """Check if there's an association registered for a specific school"""
    association = await db.associations.find_one(
        {"school_id": school_id, "approved": True},
        {"_id": 0, "association_code": 0, "iban": 0}  # Don't expose sensitive data
    )
    
    if association:
        return {
            "exists": True,
            "association_name": association["association_name"],
            "school_name": association["school_name"]
        }
    
    return {"exists": False}

# ==================== GAME ROUTES ====================

@api_router.get("/game/state")
async def get_game_state(
    current_user: User = Depends(get_current_user_dep)
):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas alunos")
    
    student = await db.students.find_one({"user_id": current_user.user_id}, {"_id": 0})
    
    if not student:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    
    buildings = await db.buildings.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    return {
        "settlement_level": student['settlement_level'],
        "coins": student['coins'],
        "diamonds": student['diamonds'],
        "level": student['level'],
        "is_premium": student['is_premium'],
        "buildings": buildings
    }

@api_router.post("/game/buildings")
async def create_building(
    data: BuildingCreate,
    current_user: User = Depends(get_current_user_dep)
):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas alunos")
    
    building_id = f"building_{uuid.uuid4().hex[:12]}"
    construction_time = 60
    
    building = Building(
        building_id=building_id,
        user_id=current_user.user_id,
        type=data.type,
        position_x=data.position_x,
        position_y=data.position_y,
        construction_started=datetime.now(timezone.utc),
        construction_ends=datetime.now(timezone.utc) + timedelta(seconds=construction_time)
    )
    
    build_dict = building.model_dump()
    build_dict['construction_started'] = build_dict['construction_started'].isoformat()
    build_dict['construction_ends'] = build_dict['construction_ends'].isoformat()
    
    await db.buildings.insert_one(build_dict)
    
    return building

# ==================== FRIENDSHIP ROUTES ====================

@api_router.post("/friends/request")
async def send_friend_request(
    data: FriendRequestCreate,
    current_user: User = Depends(get_current_user_dep)
):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas alunos")
    
    request_id = f"freq_{uuid.uuid4().hex[:12]}"
    
    friend_request = FriendRequest(
        request_id=request_id,
        from_user_id=current_user.user_id,
        to_user_id=data.to_user_id,
        created_at=datetime.now(timezone.utc)
    )
    
    req_dict = friend_request.model_dump()
    req_dict['created_at'] = req_dict['created_at'].isoformat()
    
    await db.friend_requests.insert_one(req_dict)
    
    return friend_request

@api_router.get("/friends/requests")
async def get_friend_requests(
    current_user: User = Depends(get_current_user_dep)
):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas alunos")
    
    requests = await db.friend_requests.find(
        {"to_user_id": current_user.user_id, "status": "pending"},
        {"_id": 0}
    ).to_list(50)
    
    return requests

@api_router.get("/friends")
async def get_friends(
    current_user: User = Depends(get_current_user_dep)
):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas alunos")
    
    friendships = await db.friendships.find(
        {"$or": [{"user_id_1": current_user.user_id}, {"user_id_2": current_user.user_id}]},
        {"_id": 0}
    ).to_list(100)
    
    return friendships

# ==================== DATA ROUTES ====================

@api_router.get("/districts")
async def get_districts():
    return PORTUGUESE_DISTRICTS

@api_router.get("/municipalities")
async def get_municipalities(district: Optional[str] = None):
    """Get municipalities (concelhos) filtered by district"""
    return get_unique_municipalities(district)

@api_router.get("/localities")
async def get_localities(district: Optional[str] = None, municipality: Optional[str] = None):
    """Get localities (localidades/freguesias) filtered by district and/or municipality"""
    return get_unique_localities(district, municipality)

@api_router.get("/schools")
async def get_schools(
    district: Optional[str] = None, 
    municipality: Optional[str] = None,
    locality: Optional[str] = None,
    cycle: Optional[str] = None, 
    school_year: Optional[str] = None
):
    """
    Get schools filtered by district, municipality, locality and/or cycle.
    If school_year is provided, it will be converted to the corresponding cycle.
    """
    # Convert school year to cycle if provided
    if school_year and not cycle:
        cycle = get_cycle_from_year(school_year)
    
    return get_schools_by_filters(district, municipality, locality, cycle)

# ==================== BASIC ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "QUESTEDUCA API v1.0"}

@api_router.get("/health")
async def health():
    return {"status": "ok"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
