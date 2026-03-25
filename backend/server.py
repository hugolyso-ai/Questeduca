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
from payment_service import PaymentService, SUBSCRIPTION_PRICES
from schools_data import PORTUGUESE_DISTRICTS, SAMPLE_SCHOOLS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
async def get_me(current_user: User = Depends(lambda r, st=Cookie(None): get_current_user(r, db, st))):
    return current_user

@api_router.post("/auth/logout")
async def logout(
    response: Response,
    current_user: User = Depends(lambda r, st=Cookie(None): get_current_user(r, db, st))
):
    await db.user_sessions.delete_many({"user_id": current_user.user_id})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logout bem-sucedido"}

# ==================== STUDENT ROUTES ====================

@api_router.post("/students", response_model=StudentProfile)
async def create_student(
    data: StudentCreate,
    current_user: User = Depends(lambda r, st=Cookie(None): get_current_user(r, db, st))
):
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Apenas pais podem criar alunos")
    
    student_id = f"student_{uuid.uuid4().hex[:12]}"
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    
    user = User(
        user_id=user_id,
        email=data.email,
        name=data.name,
        role=UserRole.STUDENT,
        created_at=datetime.now(timezone.utc)
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
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
    
    await db.students.insert_one(student.model_dump())
    
    await db.parents.update_one(
        {"user_id": current_user.user_id},
        {"$push": {"children_ids": user_id}}
    )
    
    return student

@api_router.get("/students/me", response_model=StudentProfile)
async def get_my_student_profile(
    current_user: User = Depends(lambda r, st=Cookie(None): get_current_user(r, db, st))
):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    student = await db.students.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    
    return StudentProfile(**student)

@api_router.get("/students/search", response_model=List[StudentProfile])
async def search_students(
    nickname: Optional[str] = None,
    district: Optional[str] = None,
    school_name: Optional[str] = None,
    current_user: User = Depends(lambda r, st=Cookie(None): get_current_user(r, db, st))
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
    current_user: User = Depends(lambda r, st=Cookie(None): get_current_user(r, db, st))
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
    current_user: User = Depends(lambda r, st=Cookie(None): get_current_user(r, db, st))
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
    current_user: User = Depends(lambda r, st=Cookie(None): get_current_user(r, db, st))
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
    return SUBSCRIPTION_PRICES

# ==================== GIFTCARD ROUTES ====================

@api_router.post("/giftcards")
async def create_giftcard(
    subscription_type: SubscriptionType,
    association_code: Optional[str] = None,
    current_user: User = Depends(lambda r, st=Cookie(None): get_current_user(r, db, st))
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
    current_user: User = Depends(lambda r, st=Cookie(None): get_current_user(r, db, st))
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
        school_name=data.school_name,
        iban=data.iban,
        responsible_names=data.responsible_names,
        association_code=association_code,
        documents_urls=data.documents_urls
    )
    
    await db.associations.insert_one(association.model_dump())
    
    return association

@api_router.get("/associations/me/commissions")
async def get_my_commissions(
    current_user: User = Depends(lambda r, st=Cookie(None): get_current_user(r, db, st))
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

# ==================== GAME ROUTES ====================

@api_router.get("/game/state")
async def get_game_state(
    current_user: User = Depends(lambda r, st=Cookie(None): get_current_user(r, db, st))
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
    current_user: User = Depends(lambda r, st=Cookie(None): get_current_user(r, db, st))
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
    current_user: User = Depends(lambda r, st=Cookie(None): get_current_user(r, db, st))
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
    current_user: User = Depends(lambda r, st=Cookie(None): get_current_user(r, db, st))
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
    current_user: User = Depends(lambda r, st=Cookie(None): get_current_user(r, db, st))
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

@api_router.get("/schools")
async def get_schools(district: Optional[str] = None):
    if district:
        schools = [s for s in SAMPLE_SCHOOLS if s['district'] == district]
        return schools
    return SAMPLE_SCHOOLS

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
