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
    
    # Check if user has a password (Google users don't)
    if 'password' not in user_doc or not user_doc['password']:
        raise HTTPException(status_code=401, detail="Esta conta foi criada com Google. Use o botão 'Entrar com Google'.")
    
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

@api_router.post("/auth/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    response: Response,
    current_user: User = Depends(get_current_user_dep)
):
    """Change password for current user"""
    user_doc = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    
    if not await verify_password(old_password, user_doc['password']):
        raise HTTPException(status_code=400, detail="Password atual incorreto")
    
    new_hashed = await hash_password(new_password)
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {
            "$set": {
                "password": new_hashed,
                "must_change_password": False
            }
        }
    )
    
    return {"message": "Password alterado com sucesso"}

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
    
    # Handle optional fields that might be None from MongoDB
    if student.get('parent_id') is None:
        student['parent_id'] = None  # Keep as None for Optional field
    if student.get('municipality') is None:
        student['municipality'] = None
    if student.get('locality') is None:
        student['locality'] = None
    if student.get('school_id') is None:
        student['school_id'] = None
    
    return StudentProfile(**student)

@api_router.get("/parents/me")
async def get_my_parent_profile(
    current_user: User = Depends(get_current_user_dep)
):
    """Get current parent profile"""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Apenas para pais")
    
    parent = await db.parents.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not parent:
        # Create default profile
        parent = {
            "user_id": current_user.user_id,
            "children_ids": [],
            "credit_balance": 0,
            "subscription_type": "free",
            "premium_active": False
        }
        await db.parents.insert_one(parent)
    
    # Ensure credit_balance exists
    if "credit_balance" not in parent:
        parent["credit_balance"] = 0
    
    return parent

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
    subjects = SUBJECTS_BY_YEAR.get(school_year, [])
    return subjects

# ==================== GAME STATE ROUTES ====================

@api_router.get("/game/state")
async def get_game_state(
    current_user: User = Depends(get_current_user_dep)
):
    """Get the current game state for the student"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    # Try to get existing game state
    game_state = await db.game_states.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not game_state:
        # Create initial game state with expanded RTS features
        game_state = {
            "user_id": current_user.user_id,
            "coins": 100,
            "diamonds": 5,
            "xp": 0,
            "level": 1,
            # Resources for building
            "resources": {
                "wood": 50,
                "stone": 30,
                "iron": 10,
                "food": 100
            },
            # Buildings with positions on isometric grid
            "buildings": {
                "town_hall": {"level": 1, "x": 5, "y": 5, "producing": False},
                "house": {"level": 0, "x": 3, "y": 5, "producing": False},
                "school": {"level": 0, "x": 7, "y": 5, "producing": False},
                "library": {"level": 0, "x": 5, "y": 3, "producing": False},
                "market": {"level": 0, "x": 5, "y": 7, "producing": False},
                "farm": {"level": 0, "x": 3, "y": 3, "producing": False},
                "lumber_mill": {"level": 0, "x": 7, "y": 3, "producing": False},
                "quarry": {"level": 0, "x": 3, "y": 7, "producing": False},
                "mine": {"level": 0, "x": 7, "y": 7, "producing": False},
                "barracks": {"level": 0, "x": 9, "y": 5, "producing": False},
                "wall": {"level": 0, "x": 1, "y": 5, "producing": False},
                "garden": {"level": 0, "x": 5, "y": 9, "producing": False}
            },
            # City stats
            "population": 10,
            "max_population": 20,
            "defense_power": 5,
            "attack_power": 0,
            # Production timers (ISO timestamps when production completes)
            "production_timers": {},
            "quizzes_today": 0,
            "last_quiz_date": None,
            "last_resource_collection": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.game_states.insert_one(game_state)
        # Remove MongoDB _id field added by insert_one
        game_state.pop("_id", None)
    else:
        # Migrate old game states to new format
        if "resources" not in game_state:
            game_state["resources"] = {"wood": 50, "stone": 30, "iron": 10, "food": 100}
        if "population" not in game_state:
            game_state["population"] = 10
            game_state["max_population"] = 20
            game_state["defense_power"] = 5
            game_state["attack_power"] = 0
        # Convert old buildings format to new format
        if isinstance(game_state.get("buildings", {}).get("town_hall"), int):
            old_buildings = game_state["buildings"]
            game_state["buildings"] = {
                "town_hall": {"level": old_buildings.get("town_hall", 1), "x": 5, "y": 5, "producing": False},
                "house": {"level": old_buildings.get("house", 0), "x": 3, "y": 5, "producing": False},
                "school": {"level": old_buildings.get("school", 0), "x": 7, "y": 5, "producing": False},
                "library": {"level": old_buildings.get("library", 0), "x": 5, "y": 3, "producing": False},
                "market": {"level": old_buildings.get("market", 0), "x": 5, "y": 7, "producing": False},
                "farm": {"level": 0, "x": 3, "y": 3, "producing": False},
                "lumber_mill": {"level": 0, "x": 7, "y": 3, "producing": False},
                "quarry": {"level": 0, "x": 3, "y": 7, "producing": False},
                "mine": {"level": 0, "x": 7, "y": 7, "producing": False},
                "barracks": {"level": 0, "x": 9, "y": 5, "producing": False},
                "wall": {"level": 0, "x": 1, "y": 5, "producing": False},
                "garden": {"level": old_buildings.get("garden", 0), "x": 5, "y": 9, "producing": False}
            }
            # Update in DB
            await db.game_states.update_one(
                {"user_id": current_user.user_id},
                {"$set": {
                    "resources": game_state["resources"],
                    "buildings": game_state["buildings"],
                    "population": 10,
                    "max_population": 20,
                    "defense_power": 5,
                    "attack_power": 0
                }}
            )
    
    return game_state

@api_router.post("/game/upgrade")
async def upgrade_building(
    building_id: str,
    cost: int,
    current_user: User = Depends(get_current_user_dep)
):
    """Upgrade a building in the player's city"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    # Building costs configuration
    BUILDING_COSTS = {
        "town_hall": {"coins": 100, "wood": 50, "stone": 50, "iron": 20},
        "house": {"coins": 30, "wood": 20, "stone": 10, "iron": 0},
        "school": {"coins": 80, "wood": 30, "stone": 30, "iron": 10},
        "library": {"coins": 60, "wood": 40, "stone": 20, "iron": 5},
        "market": {"coins": 50, "wood": 25, "stone": 25, "iron": 5},
        "farm": {"coins": 20, "wood": 15, "stone": 5, "iron": 0},
        "lumber_mill": {"coins": 25, "wood": 10, "stone": 10, "iron": 5},
        "quarry": {"coins": 30, "wood": 10, "stone": 5, "iron": 10},
        "mine": {"coins": 40, "wood": 15, "stone": 15, "iron": 5},
        "barracks": {"coins": 100, "wood": 40, "stone": 50, "iron": 30},
        "wall": {"coins": 50, "wood": 20, "stone": 60, "iron": 15},
        "garden": {"coins": 15, "wood": 10, "stone": 5, "iron": 0}
    }
    
    # Get current game state
    game_state = await db.game_states.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not game_state:
        raise HTTPException(status_code=404, detail="Estado do jogo não encontrado")
    
    # Get building info
    building = game_state.get("buildings", {}).get(building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Edifício não encontrado")
    
    current_level = building.get("level", 0) if isinstance(building, dict) else building
    if current_level >= 5:
        raise HTTPException(status_code=400, detail="Nível máximo atingido")
    
    # Calculate costs (multiply by level + 1)
    base_costs = BUILDING_COSTS.get(building_id, {"coins": 50, "wood": 20, "stone": 20, "iron": 10})
    level_multiplier = current_level + 1
    required_coins = base_costs["coins"] * level_multiplier
    required_wood = base_costs.get("wood", 0) * level_multiplier
    required_stone = base_costs.get("stone", 0) * level_multiplier
    required_iron = base_costs.get("iron", 0) * level_multiplier
    
    # Check resources
    resources = game_state.get("resources", {"wood": 0, "stone": 0, "iron": 0, "food": 0})
    
    # Use provided cost or calculated cost
    actual_coin_cost = cost if cost > 0 else required_coins
    
    if game_state.get("coins", 0) < actual_coin_cost:
        raise HTTPException(status_code=400, detail=f"Moedas insuficientes. Precisas de {actual_coin_cost}")
    if resources.get("wood", 0) < required_wood:
        raise HTTPException(status_code=400, detail=f"Madeira insuficiente. Precisas de {required_wood}")
    if resources.get("stone", 0) < required_stone:
        raise HTTPException(status_code=400, detail=f"Pedra insuficiente. Precisas de {required_stone}")
    if resources.get("iron", 0) < required_iron:
        raise HTTPException(status_code=400, detail=f"Ferro insuficiente. Precisas de {required_iron}")
    
    # Update game state
    new_level = current_level + 1
    
    # Calculate stat bonuses
    stat_updates = {}
    if building_id == "house":
        stat_updates["max_population"] = game_state.get("max_population", 20) + 10
    elif building_id == "barracks":
        stat_updates["attack_power"] = game_state.get("attack_power", 0) + 5
    elif building_id == "wall":
        stat_updates["defense_power"] = game_state.get("defense_power", 5) + 10
    
    update_query = {
        "$inc": {
            "coins": -actual_coin_cost,
            "resources.wood": -required_wood,
            "resources.stone": -required_stone,
            "resources.iron": -required_iron
        },
        "$set": {
            f"buildings.{building_id}.level": new_level,
            **{k: v for k, v in stat_updates.items()}
        }
    }
    
    await db.game_states.update_one(
        {"user_id": current_user.user_id},
        update_query
    )
    
    return {
        "success": True, 
        "new_level": new_level,
        "costs_paid": {
            "coins": actual_coin_cost,
            "wood": required_wood,
            "stone": required_stone,
            "iron": required_iron
        }
    }

@api_router.post("/game/add-resources")
async def add_resources(
    coins: int = 0,
    diamonds: int = 0,
    xp: int = 0,
    current_user: User = Depends(get_current_user_dep)
):
    """Add resources to player (used after quiz completion)"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    update_data = {}
    if coins > 0:
        update_data["coins"] = coins
    if diamonds > 0:
        update_data["diamonds"] = diamonds
    if xp > 0:
        update_data["xp"] = xp
    
    if update_data:
        await db.game_states.update_one(
            {"user_id": current_user.user_id},
            {"$inc": update_data}
        )
    
    return {"success": True}

@api_router.post("/game/start-production")
async def start_production(
    building_id: str,
    current_user: User = Depends(get_current_user_dep)
):
    """Start resource production in a building"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    # Production buildings and their outputs
    PRODUCTION_CONFIG = {
        "farm": {"resource": "food", "amount": 20, "time_minutes": 30},
        "lumber_mill": {"resource": "wood", "amount": 15, "time_minutes": 45},
        "quarry": {"resource": "stone", "amount": 10, "time_minutes": 60},
        "mine": {"resource": "iron", "amount": 5, "time_minutes": 90},
        "market": {"resource": "coins", "amount": 25, "time_minutes": 60}
    }
    
    if building_id not in PRODUCTION_CONFIG:
        raise HTTPException(status_code=400, detail="Este edifício não produz recursos")
    
    game_state = await db.game_states.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not game_state:
        raise HTTPException(status_code=404, detail="Estado do jogo não encontrado")
    
    building = game_state.get("buildings", {}).get(building_id)
    if not building or (isinstance(building, dict) and building.get("level", 0) == 0):
        raise HTTPException(status_code=400, detail="Edifício não construído")
    
    # Check if already producing
    if isinstance(building, dict) and building.get("producing"):
        raise HTTPException(status_code=400, detail="Este edifício já está a produzir")
    
    # Start production
    config = PRODUCTION_CONFIG[building_id]
    building_level = building.get("level", 1) if isinstance(building, dict) else 1
    completion_time = datetime.now(timezone.utc) + timedelta(minutes=config["time_minutes"] / building_level)
    
    await db.game_states.update_one(
        {"user_id": current_user.user_id},
        {
            "$set": {
                f"buildings.{building_id}.producing": True,
                f"production_timers.{building_id}": completion_time.isoformat()
            }
        }
    )
    
    return {
        "success": True,
        "building_id": building_id,
        "resource": config["resource"],
        "amount": config["amount"] * building_level,
        "completion_time": completion_time.isoformat()
    }

@api_router.post("/game/collect-production")
async def collect_production(
    building_id: str,
    current_user: User = Depends(get_current_user_dep)
):
    """Collect produced resources from a building"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    PRODUCTION_CONFIG = {
        "farm": {"resource": "food", "amount": 20},
        "lumber_mill": {"resource": "wood", "amount": 15},
        "quarry": {"resource": "stone", "amount": 10},
        "mine": {"resource": "iron", "amount": 5},
        "market": {"resource": "coins", "amount": 25}
    }
    
    if building_id not in PRODUCTION_CONFIG:
        raise HTTPException(status_code=400, detail="Este edifício não produz recursos")
    
    game_state = await db.game_states.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not game_state:
        raise HTTPException(status_code=404, detail="Estado do jogo não encontrado")
    
    # Check production timer
    production_timers = game_state.get("production_timers", {})
    timer = production_timers.get(building_id)
    
    if not timer:
        raise HTTPException(status_code=400, detail="Nenhuma produção em curso")
    
    completion_time = datetime.fromisoformat(timer.replace('Z', '+00:00'))
    if datetime.now(timezone.utc) < completion_time:
        remaining = (completion_time - datetime.now(timezone.utc)).total_seconds()
        raise HTTPException(status_code=400, detail=f"Produção ainda não terminou. Faltam {int(remaining/60)} minutos")
    
    # Calculate production amount based on building level
    building = game_state.get("buildings", {}).get(building_id, {})
    building_level = building.get("level", 1) if isinstance(building, dict) else 1
    config = PRODUCTION_CONFIG[building_id]
    amount = config["amount"] * building_level
    
    # Update game state
    if config["resource"] == "coins":
        update_query = {"$inc": {"coins": amount}}
    else:
        update_query = {"$inc": {f"resources.{config['resource']}": amount}}
    
    update_query["$set"] = {
        f"buildings.{building_id}.producing": False
    }
    update_query["$unset"] = {f"production_timers.{building_id}": ""}
    
    await db.game_states.update_one(
        {"user_id": current_user.user_id},
        update_query
    )
    
    return {
        "success": True,
        "resource": config["resource"],
        "amount": amount
    }

@api_router.get("/game/building-info")
async def get_building_info():
    """Get information about all buildings and their costs"""
    buildings = {
        "town_hall": {
            "name": "Câmara Municipal",
            "description": "Centro da cidade. Desbloqueia novos edifícios.",
            "icon": "🏛️",
            "max_level": 5,
            "base_cost": {"coins": 100, "wood": 50, "stone": 50, "iron": 20},
            "produces": None
        },
        "house": {
            "name": "Casa",
            "description": "Aumenta a população máxima (+10 por nível).",
            "icon": "🏠",
            "max_level": 5,
            "base_cost": {"coins": 30, "wood": 20, "stone": 10, "iron": 0},
            "produces": None,
            "bonus": "population"
        },
        "school": {
            "name": "Escola",
            "description": "Melhora o XP ganho nos quizzes (+10% por nível).",
            "icon": "🏫",
            "max_level": 5,
            "base_cost": {"coins": 80, "wood": 30, "stone": 30, "iron": 10},
            "produces": None,
            "bonus": "xp_boost"
        },
        "library": {
            "name": "Biblioteca",
            "description": "Aumenta as moedas ganhas (+5 por nível).",
            "icon": "📚",
            "max_level": 5,
            "base_cost": {"coins": 60, "wood": 40, "stone": 20, "iron": 5},
            "produces": None,
            "bonus": "coin_boost"
        },
        "market": {
            "name": "Mercado",
            "description": "Produz moedas ao longo do tempo.",
            "icon": "🏪",
            "max_level": 5,
            "base_cost": {"coins": 50, "wood": 25, "stone": 25, "iron": 5},
            "produces": {"resource": "coins", "amount": 25, "time_minutes": 60}
        },
        "farm": {
            "name": "Quinta",
            "description": "Produz comida para a população.",
            "icon": "🌾",
            "max_level": 5,
            "base_cost": {"coins": 20, "wood": 15, "stone": 5, "iron": 0},
            "produces": {"resource": "food", "amount": 20, "time_minutes": 30}
        },
        "lumber_mill": {
            "name": "Serração",
            "description": "Produz madeira para construções.",
            "icon": "🪵",
            "max_level": 5,
            "base_cost": {"coins": 25, "wood": 10, "stone": 10, "iron": 5},
            "produces": {"resource": "wood", "amount": 15, "time_minutes": 45}
        },
        "quarry": {
            "name": "Pedreira",
            "description": "Produz pedra para construções.",
            "icon": "🪨",
            "max_level": 5,
            "base_cost": {"coins": 30, "wood": 10, "stone": 5, "iron": 10},
            "produces": {"resource": "stone", "amount": 10, "time_minutes": 60}
        },
        "mine": {
            "name": "Mina",
            "description": "Produz ferro para construções avançadas.",
            "icon": "⛏️",
            "max_level": 5,
            "base_cost": {"coins": 40, "wood": 15, "stone": 15, "iron": 5},
            "produces": {"resource": "iron", "amount": 5, "time_minutes": 90}
        },
        "barracks": {
            "name": "Quartel",
            "description": "Aumenta o poder de ataque (+5 por nível).",
            "icon": "⚔️",
            "max_level": 5,
            "base_cost": {"coins": 100, "wood": 40, "stone": 50, "iron": 30},
            "produces": None,
            "bonus": "attack"
        },
        "wall": {
            "name": "Muralha",
            "description": "Aumenta a defesa da cidade (+10 por nível).",
            "icon": "🏰",
            "max_level": 5,
            "base_cost": {"coins": 50, "wood": 20, "stone": 60, "iron": 15},
            "produces": None,
            "bonus": "defense"
        },
        "garden": {
            "name": "Jardim",
            "description": "Aumenta a felicidade e produz bónus aleatórios.",
            "icon": "🌳",
            "max_level": 5,
            "base_cost": {"coins": 15, "wood": 10, "stone": 5, "iron": 0},
            "produces": None
        }
    }
    
    return buildings

# ==================== QUIZ ROUTES ====================

@api_router.get("/quiz/generate")
async def generate_quiz(
    school_year: str,
    subject: str,
    count: int = 5,
    current_user: User = Depends(get_current_user_dep)
):
    """Generate a quiz with questions from the LLM"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    # Limit count
    count = min(count, 10)
    
    # Generate questions using Claude
    questions = await question_gen.generate_questions(
        school_year=school_year,
        subject=subject,
        count=count,
        difficulty=1  # Start with easy questions
    )
    
    if not questions:
        raise HTTPException(status_code=500, detail="Erro ao gerar perguntas")
    
    # Calculate potential rewards
    total_coins = sum(q.get('coins_reward', 10) for q in questions)
    total_xp = sum(q.get('xp_reward', 5) for q in questions)
    
    return {
        "quiz_id": f"quiz_{uuid.uuid4().hex[:12]}",
        "school_year": school_year,
        "subject": subject,
        "total_questions": len(questions),
        "max_coins": total_coins,
        "max_xp": total_xp,
        "questions": questions,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

@api_router.post("/quiz/submit")
async def submit_quiz_answer(
    quiz_id: str,
    question_id: str,
    answer_index: int,
    current_user: User = Depends(get_current_user_dep)
):
    """Submit an answer to a quiz question"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    # This is handled client-side for now, but we can log answers for analytics
    answer_record = {
        "answer_id": f"ans_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.user_id,
        "quiz_id": quiz_id,
        "question_id": question_id,
        "answer_index": answer_index,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.quiz_answers.insert_one(answer_record)
    
    return {"success": True}

# ==================== RANKING ROUTES ====================

@api_router.get("/rankings/school/{school_id}")
async def get_school_ranking(
    school_id: str,
    limit: int = 10,
    current_user: User = Depends(get_current_user_dep)
):
    """Get ranking for a specific school"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    # Get all students from this school with their game states
    pipeline = [
        {"$match": {"school_id": school_id}},
        {"$lookup": {
            "from": "game_states",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "game_state"
        }},
        {"$unwind": {"path": "$game_state", "preserveNullAndEmptyArrays": True}},
        {"$lookup": {
            "from": "quiz_answers",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "answers"
        }},
        {"$project": {
            "_id": 0,
            "user_id": 1,
            "nickname": 1,
            "school_name": 1,
            "district": 1,
            "xp": {"$ifNull": ["$game_state.xp", 0]},
            "level": {"$ifNull": ["$game_state.level", 1]},
            "buildings": {"$ifNull": ["$game_state.buildings", {}]},
            "answers_count": {"$size": "$answers"}
        }},
        {"$sort": {"xp": -1}},
        {"$limit": limit}
    ]
    
    students = await db.students.aggregate(pipeline).to_list(limit)
    
    # Calculate rankings and find user position
    entries = []
    user_position = None
    
    for i, student in enumerate(students):
        # Calculate total building level for settlement
        buildings = student.get("buildings", {})
        total_level = sum(buildings.values()) if isinstance(buildings, dict) else 0
        
        if total_level >= 50:
            settlement = "metropolis"
        elif total_level >= 25:
            settlement = "city"
        elif total_level >= 10:
            settlement = "town"
        else:
            settlement = "village"
        
        entry = {
            "rank": i + 1,
            "user_id": student["user_id"],
            "nickname": student.get("nickname", "Anónimo"),
            "school_name": student.get("school_name", ""),
            "district": student.get("district", ""),
            "xp": student.get("xp", 0),
            "level": student.get("level", 1),
            "quizzes_completed": student.get("answers_count", 0) // 5,  # Approximate
            "accuracy_rate": 0,  # Would need more data
            "settlement_level": settlement
        }
        entries.append(entry)
        
        if student["user_id"] == current_user.user_id:
            user_position = i + 1
    
    return {
        "ranking_type": "school",
        "filter_value": school_id,
        "entries": entries,
        "user_position": user_position,
        "total_players": len(entries)
    }

@api_router.get("/rankings/district/{district}")
async def get_district_ranking(
    district: str,
    limit: int = 10,
    current_user: User = Depends(get_current_user_dep)
):
    """Get ranking for a specific district"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    pipeline = [
        {"$match": {"district": district}},
        {"$lookup": {
            "from": "game_states",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "game_state"
        }},
        {"$unwind": {"path": "$game_state", "preserveNullAndEmptyArrays": True}},
        {"$project": {
            "_id": 0,
            "user_id": 1,
            "nickname": 1,
            "school_name": 1,
            "district": 1,
            "xp": {"$ifNull": ["$game_state.xp", 0]},
            "level": {"$ifNull": ["$game_state.level", 1]},
            "buildings": {"$ifNull": ["$game_state.buildings", {}]}
        }},
        {"$sort": {"xp": -1}},
        {"$limit": limit}
    ]
    
    students = await db.students.aggregate(pipeline).to_list(limit)
    
    entries = []
    user_position = None
    
    for i, student in enumerate(students):
        buildings = student.get("buildings", {})
        total_level = sum(buildings.values()) if isinstance(buildings, dict) else 0
        
        if total_level >= 50:
            settlement = "metropolis"
        elif total_level >= 25:
            settlement = "city"
        elif total_level >= 10:
            settlement = "town"
        else:
            settlement = "village"
        
        entry = {
            "rank": i + 1,
            "user_id": student["user_id"],
            "nickname": student.get("nickname", "Anónimo"),
            "school_name": student.get("school_name", ""),
            "district": student.get("district", ""),
            "xp": student.get("xp", 0),
            "level": student.get("level", 1),
            "quizzes_completed": 0,
            "accuracy_rate": 0,
            "settlement_level": settlement
        }
        entries.append(entry)
        
        if student["user_id"] == current_user.user_id:
            user_position = i + 1
    
    return {
        "ranking_type": "district",
        "filter_value": district,
        "entries": entries,
        "user_position": user_position,
        "total_players": len(entries)
    }

@api_router.get("/rankings/national")
async def get_national_ranking(
    limit: int = 100,
    current_user: User = Depends(get_current_user_dep)
):
    """Get national ranking (top players in Portugal)"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    pipeline = [
        {"$lookup": {
            "from": "game_states",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "game_state"
        }},
        {"$unwind": {"path": "$game_state", "preserveNullAndEmptyArrays": True}},
        {"$project": {
            "_id": 0,
            "user_id": 1,
            "nickname": 1,
            "school_name": 1,
            "district": 1,
            "xp": {"$ifNull": ["$game_state.xp", 0]},
            "level": {"$ifNull": ["$game_state.level", 1]},
            "buildings": {"$ifNull": ["$game_state.buildings", {}]}
        }},
        {"$sort": {"xp": -1}},
        {"$limit": limit}
    ]
    
    students = await db.students.aggregate(pipeline).to_list(limit)
    
    entries = []
    user_position = None
    
    for i, student in enumerate(students):
        buildings = student.get("buildings", {})
        total_level = sum(buildings.values()) if isinstance(buildings, dict) else 0
        
        if total_level >= 50:
            settlement = "metropolis"
        elif total_level >= 25:
            settlement = "city"
        elif total_level >= 10:
            settlement = "town"
        else:
            settlement = "village"
        
        entry = {
            "rank": i + 1,
            "user_id": student["user_id"],
            "nickname": student.get("nickname", "Anónimo"),
            "school_name": student.get("school_name", ""),
            "district": student.get("district", ""),
            "xp": student.get("xp", 0),
            "level": student.get("level", 1),
            "quizzes_completed": 0,
            "accuracy_rate": 0,
            "settlement_level": settlement
        }
        entries.append(entry)
        
        if student["user_id"] == current_user.user_id:
            user_position = i + 1
    
    # Get total count
    total_count = await db.students.count_documents({})
    
    return {
        "ranking_type": "national",
        "filter_value": None,
        "entries": entries,
        "user_position": user_position,
        "total_players": total_count
    }

# ==================== GIFTCARD ROUTES ====================

GIFTCARD_AMOUNTS = [5.0, 10.0, 20.0]

@api_router.post("/giftcards/purchase")
async def purchase_giftcard(
    amount: float,
    origin_url: str,
    association_code: Optional[str] = None,
    current_user: User = Depends(get_current_user_dep)
):
    """Purchase a giftcard via Stripe"""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Apenas pais podem comprar giftcards")
    
    if amount not in GIFTCARD_AMOUNTS:
        raise HTTPException(status_code=400, detail=f"Valor inválido. Valores aceites: {GIFTCARD_AMOUNTS}")
    
    # Create checkout session for giftcard
    try:
        webhook_url = f"{origin_url}/api/webhook/stripe"
        from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
        
        stripe_checkout = StripeCheckout(
            api_key=os.environ.get('STRIPE_SECRET_KEY'),
            webhook_url=webhook_url
        )
        
        success_url = f"{origin_url}/giftcard/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/giftcard/cancel"
        
        giftcard_id = f"gift_{uuid.uuid4().hex[:12]}"
        
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency="eur",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "type": "giftcard",
                "giftcard_id": giftcard_id,
                "user_id": current_user.user_id,
                "association_code": association_code or ""
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Pre-create giftcard (will be activated after payment)
        giftcard = {
            "giftcard_id": giftcard_id,
            "code": f"GIFT-{uuid.uuid4().hex[:8].upper()}",
            "amount": amount,
            "currency": "eur",
            "created_by": current_user.user_id,
            "redeemed_by": None,
            "redeemed_at": None,
            "status": "pending",  # Will become "active" after payment
            "association_code": association_code,
            "session_id": session.session_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
        }
        
        await db.giftcards.insert_one(giftcard)
        
        return {
            "url": session.url,
            "session_id": session.session_id,
            "giftcard_id": giftcard_id
        }
        
    except Exception as e:
        logger.error(f"Giftcard purchase error: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar compra")

@api_router.get("/giftcards/status/{session_id}")
async def get_giftcard_status(
    session_id: str,
    current_user: User = Depends(get_current_user_dep)
):
    """Get giftcard purchase status and code if paid"""
    giftcard = await db.giftcards.find_one(
        {"session_id": session_id, "created_by": current_user.user_id},
        {"_id": 0}
    )
    
    if not giftcard:
        raise HTTPException(status_code=404, detail="Giftcard não encontrado")
    
    # If still pending, check with Stripe
    if giftcard["status"] == "pending":
        try:
            origin_url = os.environ.get('FRONTEND_URL')
            if not origin_url:
                raise HTTPException(status_code=500, detail="FRONTEND_URL not configured")
            status = await payment_service.get_checkout_status(session_id, origin_url)
            
            if status.payment_status == "paid":
                # Activate giftcard
                await db.giftcards.update_one(
                    {"giftcard_id": giftcard["giftcard_id"]},
                    {"$set": {"status": "active"}}
                )
                giftcard["status"] = "active"
                
                # Process association commission if applicable
                if giftcard.get("association_code"):
                    commission_amount = giftcard["amount"] * 0.10
                    association = await db.associations.find_one(
                        {"association_code": giftcard["association_code"]},
                        {"_id": 0}
                    )
                    
                    if association:
                        commission = {
                            "commission_id": f"com_{uuid.uuid4().hex[:12]}",
                            "association_id": association["association_id"],
                            "amount": commission_amount,
                            "source": "giftcard",
                            "giftcard_id": giftcard["giftcard_id"],
                            "created_at": datetime.now(timezone.utc).isoformat()
                        }
                        await db.commissions.insert_one(commission)
                        
                        await db.associations.update_one(
                            {"association_id": association["association_id"]},
                            {"$inc": {"total_commissions": commission_amount, "pending_payout": commission_amount}}
                        )
        except Exception as e:
            logger.error(f"Error checking giftcard status: {e}")
    
    return {
        "giftcard_id": giftcard["giftcard_id"],
        "code": giftcard["code"] if giftcard["status"] == "active" else None,
        "amount": giftcard["amount"],
        "status": giftcard["status"]
    }

@api_router.post("/giftcards/redeem")
async def redeem_giftcard(
    code: str,
    current_user: User = Depends(get_current_user_dep)
):
    """Redeem a giftcard code"""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Apenas pais podem resgatar giftcards")
    
    giftcard = await db.giftcards.find_one(
        {"code": code.upper(), "status": "active"},
        {"_id": 0}
    )
    
    if not giftcard:
        raise HTTPException(status_code=404, detail="Código inválido ou já utilizado")
    
    # Mark as redeemed
    await db.giftcards.update_one(
        {"giftcard_id": giftcard["giftcard_id"]},
        {
            "$set": {
                "status": "redeemed",
                "redeemed_by": current_user.user_id,
                "redeemed_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Add credit to parent's account
    await db.parents.update_one(
        {"user_id": current_user.user_id},
        {"$inc": {"credit_balance": giftcard["amount"]}}
    )
    
    return {
        "success": True,
        "amount": giftcard["amount"],
        "message": f"€{giftcard['amount']:.2f} adicionados à sua conta!"
    }

@api_router.get("/giftcards/my")
async def get_my_giftcards(
    current_user: User = Depends(get_current_user_dep)
):
    """Get giftcards purchased by the current user"""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Apenas pais")
    
    giftcards = await db.giftcards.find(
        {"created_by": current_user.user_id, "status": {"$in": ["active", "redeemed"]}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return giftcards

# ==================== FRIENDSHIP ROUTES ====================

@api_router.post("/friends/request")
async def send_friend_request(
    to_user_id: str,
    current_user: User = Depends(get_current_user_dep)
):
    """Send a friend request to another student"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas alunos podem enviar pedidos de amizade")
    
    # Check if target user exists and is a student
    target_student = await db.students.find_one({"user_id": to_user_id}, {"_id": 0})
    if not target_student:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    
    # Check if already friends or request pending
    existing = await db.friend_requests.find_one({
        "$or": [
            {"from_user_id": current_user.user_id, "to_user_id": to_user_id},
            {"from_user_id": to_user_id, "to_user_id": current_user.user_id}
        ],
        "status": {"$in": ["pending", "approved"]}
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Pedido já existe ou já são amigos")
    
    # Get current user's student profile
    from_student = await db.students.find_one({"user_id": current_user.user_id}, {"_id": 0})
    
    request = {
        "request_id": f"freq_{uuid.uuid4().hex[:12]}",
        "from_user_id": current_user.user_id,
        "from_nickname": from_student.get("nickname", "Anónimo"),
        "to_user_id": to_user_id,
        "to_nickname": target_student.get("nickname", "Anónimo"),
        "status": "pending",
        "parent_approved": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.friend_requests.insert_one(request)
    
    # Notify parent of the target student
    notification = {
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": target_student.get("parent_id"),
        "type": "friend_request",
        "title": "Pedido de Amizade",
        "message": f"{from_student.get('nickname', 'Um aluno')} quer ser amigo do seu filho {target_student.get('nickname')}",
        "request_id": request["request_id"],
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    
    return {"success": True, "request_id": request["request_id"]}

@api_router.put("/friends/request/{request_id}/approve")
async def approve_friend_request(
    request_id: str,
    current_user: User = Depends(get_current_user_dep)
):
    """Approve a friend request (parent only)"""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Apenas pais podem aprovar pedidos de amizade")
    
    # Get the request
    request = await db.friend_requests.find_one({"request_id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    # Check if parent is authorized (parent of the target student)
    target_student = await db.students.find_one({"user_id": request["to_user_id"]}, {"_id": 0})
    if not target_student or target_student.get("parent_id") != current_user.user_id:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    # Approve the request
    await db.friend_requests.update_one(
        {"request_id": request_id},
        {"$set": {"status": "approved", "parent_approved": True}}
    )
    
    return {"success": True}

@api_router.get("/friends/my")
async def get_my_friends(
    current_user: User = Depends(get_current_user_dep)
):
    """Get list of friends for the current student"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas alunos")
    
    # Get approved friend requests
    requests = await db.friend_requests.find({
        "$or": [
            {"from_user_id": current_user.user_id},
            {"to_user_id": current_user.user_id}
        ],
        "status": "approved"
    }, {"_id": 0}).to_list(100)
    
    # Get friend user IDs
    friend_ids = []
    for req in requests:
        if req["from_user_id"] == current_user.user_id:
            friend_ids.append(req["to_user_id"])
        else:
            friend_ids.append(req["from_user_id"])
    
    # Get friend profiles using aggregation pipeline (optimized)
    if not friend_ids:
        return []
    
    pipeline = [
        {"$match": {"user_id": {"$in": friend_ids}}},
        {"$lookup": {
            "from": "game_states",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "game_state"
        }},
        {"$unwind": {"path": "$game_state", "preserveNullAndEmptyArrays": True}},
        {"$project": {
            "_id": 0,
            "user_id": 1,
            "nickname": 1,
            "school_name": 1,
            "district": 1,
            "level": {"$ifNull": ["$game_state.level", 1]},
            "buildings": {"$ifNull": ["$game_state.buildings", {}]}
        }}
    ]
    
    friends_data = await db.students.aggregate(pipeline).to_list(len(friend_ids))
    
    friends = []
    for f in friends_data:
        buildings = f.get("buildings", {})
        total_level = sum(buildings.values()) if isinstance(buildings, dict) else 0
        
        if total_level >= 50:
            settlement = "metropolis"
        elif total_level >= 25:
            settlement = "city"
        elif total_level >= 10:
            settlement = "town"
        else:
            settlement = "village"
        
        friends.append({
            "user_id": f.get("user_id"),
            "nickname": f.get("nickname", "Anónimo"),
            "school_name": f.get("school_name", ""),
            "district": f.get("district", ""),
            "level": f.get("level", 1),
            "settlement_level": settlement
        })
    
    return friends

@api_router.get("/friends/search")
async def search_potential_friends(
    district: Optional[str] = None,
    school_id: Optional[str] = None,
    query: Optional[str] = None,
    current_user: User = Depends(get_current_user_dep)
):
    """Search for potential friends"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas alunos")
    
    filters = {"user_id": {"$ne": current_user.user_id}}
    
    if district:
        filters["district"] = district
    if school_id:
        filters["school_id"] = school_id
    if query:
        filters["nickname"] = {"$regex": query, "$options": "i"}
    
    # Optimized query using aggregation pipeline
    pipeline = [
        {"$match": filters},
        {"$lookup": {
            "from": "game_states",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "game_state"
        }},
        {"$unwind": {"path": "$game_state", "preserveNullAndEmptyArrays": True}},
        {"$project": {
            "_id": 0,
            "user_id": 1,
            "nickname": 1,
            "school_name": 1,
            "district": 1,
            "level": {"$ifNull": ["$game_state.level", 1]}
        }},
        {"$limit": 20}
    ]
    
    results = await db.students.aggregate(pipeline).to_list(20)
    
    return results

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
        
        # Process different webhook events
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
            
            # Activate subscription if applicable
            transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            if transaction:
                package_id = transaction.get('package_id')
                if package_id:
                    duration_days = 30 if "monthly" in package_id else 365
                    
                    subscription_id = f"sub_{uuid.uuid4().hex[:12]}"
                    sub_dict = {
                        "subscription_id": subscription_id,
                        "user_id": transaction['user_id'],
                        "type": package_id,
                        "start_date": datetime.now(timezone.utc).isoformat(),
                        "end_date": (datetime.now(timezone.utc) + timedelta(days=duration_days)).isoformat(),
                        "association_code": transaction.get('association_code'),
                        "payment_reference": session_id,
                        "status": "active"
                    }
                    
                    await db.subscriptions.insert_one(sub_dict)
                    
                    # Update parent premium status
                    await db.parents.update_one(
                        {"user_id": transaction['user_id']},
                        {
                            "$set": {
                                "subscription_type": package_id,
                                "subscription_expiry": sub_dict['end_date'],
                                "premium_active": True,
                                "first_subscription_date": datetime.now(timezone.utc).isoformat()
                            }
                        },
                        upsert=True
                    )
                    
                    # Process commission if association code was used
                    if transaction.get('association_code'):
                        commission_amount = transaction['amount'] * 0.10
                        association = await db.associations.find_one(
                            {"association_code": transaction['association_code']},
                            {"_id": 0}
                        )
                        
                        if association:
                            commission = {
                                "commission_id": f"com_{uuid.uuid4().hex[:12]}",
                                "association_id": association['association_id'],
                                "amount": commission_amount,
                                "subscription_id": subscription_id,
                                "created_at": datetime.now(timezone.utc).isoformat()
                            }
                            await db.commissions.insert_one(commission)
                            
                            await db.associations.update_one(
                                {"association_id": association['association_id']},
                                {
                                    "$inc": {
                                        "total_commissions": commission_amount,
                                        "pending_payout": commission_amount
                                    }
                                }
                            )
            
            logger.info(f"Webhook: Payment completed for session {session_id}")
        
        elif event.event_type == "invoice.payment_succeeded":
            # Handle subscription renewal
            customer_email = event.metadata.get("customer_email") if hasattr(event, 'metadata') else None
            if customer_email:
                user = await db.users.find_one({"email": customer_email}, {"_id": 0})
                if user:
                    # Extend subscription
                    await db.subscriptions.update_one(
                        {"user_id": user["user_id"], "status": "active"},
                        {
                            "$set": {
                                "end_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                                "updated_at": datetime.now(timezone.utc).isoformat()
                            }
                        }
                    )
                    logger.info(f"Webhook: Subscription renewed for {customer_email}")
        
        elif event.event_type == "customer.subscription.deleted":
            # Handle subscription cancellation
            logger.info("Webhook: Subscription cancelled")
        
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Webhook error")

# ==================== MINI-GAMES ROUTES ====================

@api_router.get("/minigames/quiz-questions")
async def get_minigame_quiz_questions(
    count: int = 5,
    current_user: User = Depends(get_current_user_dep)
):
    """Get random questions for mini-game quiz duel"""
    if current_user.role not in [UserRole.PARENT, UserRole.STUDENT]:
        raise HTTPException(status_code=403, detail="Apenas pais e alunos")
    
    # Try to get questions from database first
    questions = await db.questions.aggregate([
        {"$sample": {"size": count}},
        {"$project": {"_id": 0, "question_text": 1, "options": 1, "correct_answer": 1}}
    ]).to_list(count)
    
    if len(questions) < count:
        # Generate fallback questions
        fallback = [
            {"question_text": "Qual é a capital de Portugal?", "options": ["Lisboa", "Porto", "Braga", "Coimbra"], "correct_answer": 0},
            {"question_text": "Quanto é 7 x 8?", "options": ["54", "56", "58", "62"], "correct_answer": 1},
            {"question_text": "Quem escreveu 'Os Lusíadas'?", "options": ["Fernando Pessoa", "Camões", "Eça de Queirós", "Saramago"], "correct_answer": 1},
            {"question_text": "Qual é o maior planeta do Sistema Solar?", "options": ["Terra", "Marte", "Júpiter", "Saturno"], "correct_answer": 2},
            {"question_text": "Em que ano foi o 25 de Abril?", "options": ["1970", "1972", "1974", "1976"], "correct_answer": 2},
            {"question_text": "Qual é o rio mais longo de Portugal?", "options": ["Tejo", "Douro", "Mondego", "Guadiana"], "correct_answer": 0},
            {"question_text": "Quantos lados tem um hexágono?", "options": ["4", "5", "6", "8"], "correct_answer": 2}
        ]
        import random
        questions = random.sample(fallback, min(count, len(fallback)))
    
    return questions

@api_router.post("/minigames/result")
async def save_minigame_result(
    game_id: str,
    opponent_id: str,
    coins_won: int,
    current_user: User = Depends(get_current_user_dep)
):
    """Save mini-game result"""
    if current_user.role not in [UserRole.PARENT, UserRole.STUDENT]:
        raise HTTPException(status_code=403, detail="Apenas pais e alunos")
    
    result = {
        "result_id": f"mgr_{uuid.uuid4().hex[:12]}",
        "game_id": game_id,
        "player_id": current_user.user_id,
        "opponent_id": opponent_id,
        "coins_won": coins_won,
        "played_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.minigame_results.insert_one(result)
    
    # Add coins to both players
    if current_user.role == UserRole.PARENT:
        # Parent won - add coins to their children
        parent = await db.parents.find_one({"user_id": current_user.user_id}, {"_id": 0})
        if parent and parent.get("children_ids"):
            for child_id in parent["children_ids"]:
                await db.game_states.update_one(
                    {"user_id": child_id},
                    {"$inc": {"coins": 10}},  # Participation reward
                    upsert=True
                )
    else:
        # Student won
        await db.game_states.update_one(
            {"user_id": current_user.user_id},
            {"$inc": {"coins": coins_won}},
            upsert=True
        )
    
    # Check and unlock achievements
    await check_minigame_achievements(current_user.user_id)
    
    return {"success": True, "coins_won": coins_won}

@api_router.get("/minigames/history")
async def get_minigame_history(
    limit: int = 10,
    current_user: User = Depends(get_current_user_dep)
):
    """Get mini-game history"""
    results = await db.minigame_results.find(
        {"$or": [{"player_id": current_user.user_id}, {"opponent_id": current_user.user_id}]},
        {"_id": 0}
    ).sort("played_at", -1).limit(limit).to_list(limit)
    
    return results

# ==================== ACHIEVEMENTS ROUTES ====================

@api_router.get("/achievements/my")
async def get_my_achievements(
    current_user: User = Depends(get_current_user_dep)
):
    """Get current user's achievements and stats"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas alunos")
    
    # Get user's achievement record
    achievements_record = await db.achievements.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not achievements_record:
        achievements_record = {
            "user_id": current_user.user_id,
            "unlocked": [],
            "stats": {
                "quizzesCompleted": 0,
                "perfectQuizzes": 0,
                "longestStreak": 0,
                "currentStreak": 0,
                "totalBuildingLevel": 0,
                "maxLevelBuildings": 0,
                "allBuildingsLevel1": False,
                "settlementLevel": "village",
                "friendsCount": 0,
                "minigamesPlayed": 0,
                "minigamesWon": 0,
                "totalCoinsEarned": 0,
                "totalXp": 0
            }
        }
        await db.achievements.insert_one(achievements_record)
    
    # Enrich with current data
    game_state = await db.game_states.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if game_state:
        buildings = game_state.get("buildings", {})
        total_level = sum(buildings.values()) if isinstance(buildings, dict) else 0
        max_level_buildings = sum(1 for v in buildings.values() if v >= 5) if isinstance(buildings, dict) else 0
        all_level_1 = all(v >= 1 for v in buildings.values()) if isinstance(buildings, dict) and len(buildings) >= 6 else False
        
        if total_level >= 50:
            settlement = "metropolis"
        elif total_level >= 25:
            settlement = "city"
        elif total_level >= 10:
            settlement = "town"
        else:
            settlement = "village"
        
        achievements_record["stats"]["totalBuildingLevel"] = total_level
        achievements_record["stats"]["maxLevelBuildings"] = max_level_buildings
        achievements_record["stats"]["allBuildingsLevel1"] = all_level_1
        achievements_record["stats"]["settlementLevel"] = settlement
        achievements_record["stats"]["totalXp"] = game_state.get("xp", 0)
        achievements_record["stats"]["totalCoinsEarned"] = game_state.get("coins", 0)
    
    # Count friends
    friends_count = await db.friend_requests.count_documents({
        "$or": [
            {"from_user_id": current_user.user_id, "status": "approved"},
            {"to_user_id": current_user.user_id, "status": "approved"}
        ]
    })
    achievements_record["stats"]["friendsCount"] = friends_count
    
    # Count minigames
    minigames_count = await db.minigame_results.count_documents({"player_id": current_user.user_id})
    achievements_record["stats"]["minigamesPlayed"] = minigames_count
    
    return achievements_record

@api_router.post("/achievements/unlock")
async def unlock_achievement(
    achievement_id: str,
    current_user: User = Depends(get_current_user_dep)
):
    """Unlock an achievement and claim rewards"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas alunos")
    
    # Check if already unlocked
    record = await db.achievements.find_one(
        {"user_id": current_user.user_id, "unlocked": achievement_id}
    )
    
    if record:
        raise HTTPException(status_code=400, detail="Conquista já desbloqueada")
    
    # Add to unlocked list
    await db.achievements.update_one(
        {"user_id": current_user.user_id},
        {
            "$push": {"unlocked": achievement_id},
            "$set": {"last_unlocked_at": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )
    
    return {"success": True, "achievement_id": achievement_id}

async def check_minigame_achievements(user_id: str):
    """Check and unlock mini-game related achievements"""
    minigames_count = await db.minigame_results.count_documents({"player_id": user_id})
    minigames_won = await db.minigame_results.count_documents({"player_id": user_id, "coins_won": {"$gte": 30}})
    
    await db.achievements.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "stats.minigamesPlayed": minigames_count,
                "stats.minigamesWon": minigames_won
            }
        },
        upsert=True
    )

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

@api_router.post("/associations/me/payout-request")
async def request_payout(
    current_user: User = Depends(get_current_user_dep)
):
    """Request a payout for accumulated commissions"""
    if current_user.role != UserRole.ASSOCIATION:
        raise HTTPException(status_code=403, detail="Apenas associações")
    
    association = await db.associations.find_one({"user_id": current_user.user_id}, {"_id": 0})
    
    if not association:
        raise HTTPException(status_code=404, detail="Associação não encontrada")
    
    pending = association.get('pending_payout', 0)
    
    if pending < 10:
        raise HTTPException(status_code=400, detail="Valor mínimo para levantamento: €10")
    
    # Create payout request
    payout_request = {
        "payout_id": f"payout_{uuid.uuid4().hex[:12]}",
        "association_id": association['association_id'],
        "amount": pending,
        "iban": association.get('iban'),
        "status": "pending",
        "requested_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.payout_requests.insert_one(payout_request)
    
    # Reset pending payout (in a real scenario, this would happen after actual transfer)
    await db.associations.update_one(
        {"association_id": association['association_id']},
        {"$set": {"pending_payout": 0}}
    )
    
    return {
        "success": True,
        "payout_id": payout_request["payout_id"],
        "amount": pending,
        "message": "Pedido de pagamento registado. Será processado em 5-7 dias úteis."
    }

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

# ==================== GAME ROUTES (Legacy - Buildings Collection) ====================
# Note: The main /game/state endpoint is defined earlier using game_states collection

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
    school_year: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100
):
    """
    Get schools filtered by district, municipality, locality, cycle and/or text search.
    If school_year is provided, it will be converted to the corresponding cycle.
    """
    # Convert school year to cycle if provided
    if school_year and not cycle:
        cycle = get_cycle_from_year(school_year)
    
    # Build query
    query = {}
    
    if district:
        query["district"] = {"$regex": district, "$options": "i"}
    if municipality:
        query["municipality"] = {"$regex": municipality, "$options": "i"}
    if locality:
        query["locality"] = {"$regex": locality, "$options": "i"}
    if cycle:
        query["cycles"] = cycle
    if search:
        # Text search on multiple fields
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"locality": {"$regex": search, "$options": "i"}},
            {"municipality": {"$regex": search, "$options": "i"}}
        ]
    
    schools = await db.schools.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return schools

@api_router.get("/schools/districts")
async def get_school_districts():
    """Get all unique districts"""
    districts = await db.schools.distinct("district")
    return sorted([d for d in districts if d])

@api_router.get("/schools/municipalities")
async def get_school_municipalities(district: Optional[str] = None):
    """Get municipalities, optionally filtered by district"""
    query = {}
    if district:
        query["district"] = {"$regex": district, "$options": "i"}
    municipalities = await db.schools.distinct("municipality", query)
    return sorted([m for m in municipalities if m])

@api_router.get("/schools/localities")
async def get_school_localities(
    district: Optional[str] = None,
    municipality: Optional[str] = None
):
    """Get localities, optionally filtered by district and municipality"""
    query = {}
    if district:
        query["district"] = {"$regex": district, "$options": "i"}
    if municipality:
        query["municipality"] = {"$regex": municipality, "$options": "i"}
    localities = await db.schools.distinct("locality", query)
    return sorted([l for l in localities if l])

# ==================== BASIC ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "QUESTEDUCA API v1.0"}

@api_router.get("/health")
async def health():
    return {"status": "ok"}

# ==================== WEEKLY CHALLENGES ROUTES ====================

@api_router.get("/challenges/weekly")
async def get_weekly_challenges(
    current_user: User = Depends(get_current_user_dep)
):
    """Get weekly challenges for current user"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas alunos")
    
    # Get current week identifier
    now = datetime.now(timezone.utc)
    week_id = f"{now.year}-W{now.isocalendar()[1]}"
    
    # Check if user has challenges for this week
    user_challenges = await db.weekly_challenges.find_one(
        {"user_id": current_user.user_id, "week_id": week_id},
        {"_id": 0}
    )
    
    if not user_challenges:
        # Generate new challenges for this week
        challenges = [
            {
                "challenge_id": f"weekly_quizzes_{week_id}",
                "type": "quizzes_completed",
                "title": "Estudante da Semana",
                "description": "Completa 10 quizzes esta semana",
                "target": 10,
                "current": 0,
                "reward_coins": 100,
                "reward_diamonds": 5,
                "reward_xp": 50,
                "claimed": False
            },
            {
                "challenge_id": f"weekly_perfect_{week_id}",
                "type": "perfect_quizzes",
                "title": "Perfecionista",
                "description": "Acerta todas as perguntas em 3 quizzes",
                "target": 3,
                "current": 0,
                "reward_coins": 150,
                "reward_diamonds": 10,
                "reward_xp": 100,
                "claimed": False
            },
            {
                "challenge_id": f"weekly_xp_{week_id}",
                "type": "xp_earned",
                "title": "Caça XP",
                "description": "Ganha 500 XP esta semana",
                "target": 500,
                "current": 0,
                "reward_coins": 200,
                "reward_diamonds": 0,
                "reward_xp": 0,
                "claimed": False
            },
            {
                "challenge_id": f"weekly_streak_{week_id}",
                "type": "login_streak",
                "title": "Dedicação",
                "description": "Joga 5 dias seguidos",
                "target": 5,
                "current": 0,
                "reward_coins": 75,
                "reward_diamonds": 15,
                "reward_xp": 75,
                "claimed": False
            }
        ]
        
        user_challenges = {
            "user_id": current_user.user_id,
            "week_id": week_id,
            "challenges": challenges,
            "created_at": now.isoformat()
        }
        
        await db.weekly_challenges.insert_one(user_challenges)
    
    # Update challenge progress from real data
    game_state = await db.game_states.find_one({"user_id": current_user.user_id}, {"_id": 0})
    
    for challenge in user_challenges["challenges"]:
        if challenge["type"] == "quizzes_completed" and game_state:
            challenge["current"] = game_state.get("quizzes_today", 0)
        elif challenge["type"] == "xp_earned" and game_state:
            challenge["current"] = game_state.get("xp", 0)
    
    return user_challenges["challenges"]

@api_router.post("/challenges/claim/{challenge_id}")
async def claim_challenge_reward(
    challenge_id: str,
    current_user: User = Depends(get_current_user_dep)
):
    """Claim reward for completed challenge"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas alunos")
    
    now = datetime.now(timezone.utc)
    week_id = f"{now.year}-W{now.isocalendar()[1]}"
    
    # Find user's challenges
    user_challenges = await db.weekly_challenges.find_one(
        {"user_id": current_user.user_id, "week_id": week_id}
    )
    
    if not user_challenges:
        raise HTTPException(status_code=404, detail="Desafios não encontrados")
    
    # Find the specific challenge
    challenge = None
    for c in user_challenges["challenges"]:
        if c["challenge_id"] == challenge_id:
            challenge = c
            break
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    
    if challenge["claimed"]:
        raise HTTPException(status_code=400, detail="Recompensa já resgatada")
    
    if challenge["current"] < challenge["target"]:
        raise HTTPException(status_code=400, detail="Desafio não concluído")
    
    # Mark as claimed
    await db.weekly_challenges.update_one(
        {"user_id": current_user.user_id, "week_id": week_id, "challenges.challenge_id": challenge_id},
        {"$set": {"challenges.$.claimed": True}}
    )
    
    # Give rewards
    await db.game_states.update_one(
        {"user_id": current_user.user_id},
        {
            "$inc": {
                "coins": challenge["reward_coins"],
                "diamonds": challenge["reward_diamonds"],
                "xp": challenge["reward_xp"]
            }
        },
        upsert=True
    )
    
    return {
        "success": True,
        "rewards": {
            "coins": challenge["reward_coins"],
            "diamonds": challenge["reward_diamonds"],
            "xp": challenge["reward_xp"]
        }
    }

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/dashboard")
async def get_admin_dashboard(
    current_user: User = Depends(get_current_user_dep)
):
    """Get admin dashboard stats"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    # Get counts
    total_users = await db.users.count_documents({})
    total_parents = await db.users.count_documents({"role": "parent"})
    total_students = await db.users.count_documents({"role": "student"})
    total_associations = await db.users.count_documents({"role": "association"})
    
    # Active subscriptions
    active_subs = await db.subscriptions.count_documents({"status": "active"})
    
    # Total revenue from transactions
    revenue_pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await db.payment_transactions.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Commission stats
    commission_pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$total_commissions"}, "pending": {"$sum": "$pending_payout"}}}
    ]
    commission_result = await db.associations.aggregate(commission_pipeline).to_list(1)
    total_commissions = commission_result[0]["total"] if commission_result else 0
    pending_payouts = commission_result[0]["pending"] if commission_result else 0
    
    # Questions count
    total_questions = await db.questions.count_documents({})
    
    # Recent registrations (last 7 days)
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_users = await db.users.count_documents({"created_at": {"$gte": week_ago}})
    
    return {
        "users": {
            "total": total_users,
            "parents": total_parents,
            "students": total_students,
            "associations": total_associations,
            "recent_7_days": recent_users
        },
        "subscriptions": {
            "active": active_subs
        },
        "revenue": {
            "total": total_revenue,
            "commissions_paid": total_commissions,
            "pending_payouts": pending_payouts
        },
        "content": {
            "questions": total_questions
        }
    }

@api_router.get("/admin/users")
async def get_all_users(
    page: int = 1,
    limit: int = 20,
    role: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user_dep)
):
    """Get paginated list of all users"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    query = {}
    if role:
        query["role"] = role
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {
        "users": users,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@api_router.put("/admin/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: str,
    current_user: User = Depends(get_current_user_dep)
):
    """Toggle user active status"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    
    new_status = not user.get("is_active", True)
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"is_active": new_status}}
    )
    
    return {"success": True, "is_active": new_status}

@api_router.get("/admin/subscriptions")
async def get_all_subscriptions(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user_dep)
):
    """Get paginated list of subscriptions"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    query = {}
    if status:
        query["status"] = status
    
    skip = (page - 1) * limit
    
    subscriptions = await db.subscriptions.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.subscriptions.count_documents(query)
    
    return {
        "subscriptions": subscriptions,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@api_router.get("/admin/associations")
async def get_all_associations(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user_dep)
):
    """Get paginated list of associations"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    skip = (page - 1) * limit
    
    associations = await db.associations.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.associations.count_documents({})
    
    return {
        "associations": associations,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@api_router.post("/admin/associations/{association_id}/approve-payout")
async def approve_payout(
    association_id: str,
    amount: float,
    current_user: User = Depends(get_current_user_dep)
):
    """Approve payout for association"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    association = await db.associations.find_one({"association_id": association_id})
    if not association:
        raise HTTPException(status_code=404, detail="Associação não encontrada")
    
    if amount > association.get("pending_payout", 0):
        raise HTTPException(status_code=400, detail="Montante excede o saldo pendente")
    
    # Create payout record
    payout = {
        "payout_id": f"payout_{uuid.uuid4().hex[:12]}",
        "association_id": association_id,
        "amount": amount,
        "status": "approved",
        "approved_by": current_user.user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payouts.insert_one(payout)
    
    # Update association pending balance
    await db.associations.update_one(
        {"association_id": association_id},
        {"$inc": {"pending_payout": -amount}}
    )
    
    return {"success": True, "payout_id": payout["payout_id"]}

@api_router.get("/admin/transactions")
async def get_all_transactions(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user_dep)
):
    """Get paginated list of transactions"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    query = {}
    if status:
        query["status"] = status
    
    skip = (page - 1) * limit
    
    transactions = await db.payment_transactions.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    total = await db.payment_transactions.count_documents(query)
    
    return {
        "transactions": transactions,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

# ==================== ADMIN GIFTCARDS MANAGEMENT ====================

@api_router.post("/admin/giftcards/issue")
async def admin_issue_giftcard(
    amount: float,
    quantity: int = 1,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user_dep)
):
    """Admin: Issue giftcards manually (without payment)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    if amount not in [5.0, 10.0, 20.0, 50.0]:
        raise HTTPException(status_code=400, detail="Valor inválido. Valores aceites: 5, 10, 20, 50€")
    
    if quantity < 1 or quantity > 100:
        raise HTTPException(status_code=400, detail="Quantidade deve ser entre 1 e 100")
    
    giftcards = []
    for _ in range(quantity):
        giftcard_id = f"gift_{uuid.uuid4().hex[:12]}"
        code = f"GIFT-{uuid.uuid4().hex[:8].upper()}"
        
        giftcard = {
            "giftcard_id": giftcard_id,
            "code": code,
            "amount": amount,
            "currency": "eur",
            "created_by": current_user.user_id,
            "issued_by_admin": True,
            "redeemed_by": None,
            "redeemed_at": None,
            "status": "active",
            "notes": notes,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
        }
        
        await db.giftcards.insert_one(giftcard)
        giftcards.append({"giftcard_id": giftcard_id, "code": code, "amount": amount})
    
    return {
        "success": True,
        "message": f"{quantity} giftcard(s) de €{amount} emitido(s) com sucesso",
        "giftcards": giftcards
    }

@api_router.get("/admin/giftcards")
async def admin_get_giftcards(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user_dep)
):
    """Admin: Get all giftcards"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    query = {}
    if status:
        query["status"] = status
    
    skip = (page - 1) * limit
    
    giftcards = await db.giftcards.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    total = await db.giftcards.count_documents(query)
    
    # Get stats
    stats = {
        "total": await db.giftcards.count_documents({}),
        "active": await db.giftcards.count_documents({"status": "active"}),
        "redeemed": await db.giftcards.count_documents({"status": "redeemed"}),
        "pending": await db.giftcards.count_documents({"status": "pending"})
    }
    
    # Calculate total value
    value_pipeline = [
        {"$match": {"status": "active"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    value_result = await db.giftcards.aggregate(value_pipeline).to_list(1)
    stats["active_value"] = value_result[0]["total"] if value_result else 0
    
    return {
        "giftcards": giftcards,
        "stats": stats,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@api_router.put("/admin/giftcards/{giftcard_id}/deactivate")
async def admin_deactivate_giftcard(
    giftcard_id: str,
    current_user: User = Depends(get_current_user_dep)
):
    """Admin: Deactivate a giftcard"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    result = await db.giftcards.update_one(
        {"giftcard_id": giftcard_id, "status": "active"},
        {"$set": {"status": "deactivated", "deactivated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Giftcard não encontrado ou já não está ativo")
    
    return {"success": True, "message": "Giftcard desativado"}

# ==================== ADMIN USERS MANAGEMENT ====================

@api_router.put("/admin/users/{user_id}")
async def admin_update_user(
    user_id: str,
    name: Optional[str] = None,
    email: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user_dep)
):
    """Admin: Update user details"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    
    # Build update dict
    update_data = {}
    if name is not None:
        update_data["name"] = name
    if email is not None:
        # Check if email is already in use
        existing = await db.users.find_one({"email": email, "user_id": {"$ne": user_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Email já em uso")
        update_data["email"] = email
    if role is not None and role in ["parent", "student", "association"]:
        update_data["role"] = role
    if is_active is not None:
        update_data["is_active"] = is_active
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"user_id": user_id}, {"$set": update_data})
    
    return {"success": True, "message": "Utilizador atualizado"}

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user_dep)
):
    """Admin: Delete a user (soft delete - deactivates)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    
    if user.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Não pode eliminar administradores")
    
    # Soft delete
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"is_active": False, "deleted_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "message": "Utilizador eliminado"}

@api_router.post("/admin/users/{user_id}/reset-password")
async def admin_reset_password(
    user_id: str,
    new_password: Optional[str] = None,
    current_user: User = Depends(get_current_user_dep)
):
    """Admin: Reset password for any user. If no password provided, generates a random one."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    
    # Generate random password if not provided
    if not new_password:
        import secrets
        import string
        chars = string.ascii_letters + string.digits + "!@#$%"
        new_password = ''.join(secrets.choice(chars) for _ in range(12))
    
    # Hash the new password
    hashed_pw = await hash_password(new_password)
    
    # Update user
    await db.users.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "password": hashed_pw,
                "must_change_password": True,
                "password_reset_at": datetime.now(timezone.utc).isoformat(),
                "password_reset_by": current_user.user_id
            }
        }
    )
    
    # Invalidate all existing sessions for this user
    await db.user_sessions.delete_many({"user_id": user_id})
    
    return {
        "success": True,
        "message": f"Password alterada para o utilizador {user.get('email')}",
        "temp_password": new_password,
        "must_change_password": True
    }

# ==================== ADMIN SUBSCRIPTIONS MANAGEMENT ====================

@api_router.put("/admin/subscriptions/{subscription_id}")
async def admin_update_subscription(
    subscription_id: str,
    status: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user_dep)
):
    """Admin: Update subscription details"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    subscription = await db.subscriptions.find_one({"subscription_id": subscription_id})
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscrição não encontrada")
    
    update_data = {}
    if status is not None and status in ["active", "cancelled", "expired"]:
        update_data["status"] = status
    if end_date is not None:
        update_data["end_date"] = end_date
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        update_data["updated_by"] = current_user.user_id
        await db.subscriptions.update_one({"subscription_id": subscription_id}, {"$set": update_data})
        
        # Also update parent premium status if changing status
        if status:
            await db.parents.update_one(
                {"user_id": subscription["user_id"]},
                {"$set": {
                    "premium_active": status == "active",
                    "subscription_expiry": update_data.get("end_date", subscription.get("end_date"))
                }}
            )
    
    return {"success": True, "message": "Subscrição atualizada"}

@api_router.post("/admin/subscriptions/create")
async def admin_create_subscription(
    user_id: str,
    subscription_type: str,
    duration_days: int = 30,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user_dep)
):
    """Admin: Create a subscription manually (free grant)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    # Verify user exists and is a parent
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    if user.get("role") != "parent":
        raise HTTPException(status_code=400, detail="Subscrições apenas para pais")
    
    valid_types = ["individual_monthly", "individual_annual", "family_monthly", "family_annual"]
    if subscription_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Tipo inválido. Tipos aceites: {valid_types}")
    
    subscription_id = f"sub_{uuid.uuid4().hex[:12]}"
    
    subscription = {
        "subscription_id": subscription_id,
        "user_id": user_id,
        "type": subscription_type,
        "start_date": datetime.now(timezone.utc).isoformat(),
        "end_date": (datetime.now(timezone.utc) + timedelta(days=duration_days)).isoformat(),
        "status": "active",
        "granted_by_admin": True,
        "granted_by": current_user.user_id,
        "notes": notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.subscriptions.insert_one(subscription)
    
    # Update parent premium status
    await db.parents.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "subscription_type": subscription_type,
                "subscription_expiry": subscription["end_date"],
                "premium_active": True
            }
        },
        upsert=True
    )
    
    return {
        "success": True,
        "message": f"Subscrição {subscription_type} criada para {user.get('email')}",
        "subscription_id": subscription_id
    }

# ==================== ADMIN ASSOCIATIONS MANAGEMENT ====================

@api_router.put("/admin/associations/{association_id}")
async def admin_update_association(
    association_id: str,
    association_name: Optional[str] = None,
    school_name: Optional[str] = None,
    iban: Optional[str] = None,
    approved: Optional[bool] = None,
    current_user: User = Depends(get_current_user_dep)
):
    """Admin: Update association details"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    association = await db.associations.find_one({"association_id": association_id})
    if not association:
        raise HTTPException(status_code=404, detail="Associação não encontrada")
    
    update_data = {}
    if association_name is not None:
        update_data["association_name"] = association_name
    if school_name is not None:
        update_data["school_name"] = school_name
    if iban is not None:
        update_data["iban"] = iban
    if approved is not None:
        update_data["approved"] = approved
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.associations.update_one({"association_id": association_id}, {"$set": update_data})
    
    return {"success": True, "message": "Associação atualizada"}

@api_router.delete("/admin/associations/{association_id}")
async def admin_delete_association(
    association_id: str,
    current_user: User = Depends(get_current_user_dep)
):
    """Admin: Delete an association"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    association = await db.associations.find_one({"association_id": association_id})
    if not association:
        raise HTTPException(status_code=404, detail="Associação não encontrada")
    
    # Check for pending payouts
    if association.get("pending_payout", 0) > 0:
        raise HTTPException(status_code=400, detail="Associação tem pagamentos pendentes")
    
    # Delete the association
    await db.associations.delete_one({"association_id": association_id})
    
    # Also deactivate the user account if exists
    if association.get("user_id"):
        await db.users.update_one(
            {"user_id": association["user_id"]},
            {"$set": {"is_active": False}}
        )
    
    return {"success": True, "message": "Associação eliminada"}

# ==================== ADMIN SCHOOLS MANAGEMENT ====================

@api_router.get("/admin/schools")
async def admin_get_schools(
    page: int = 1,
    limit: int = 50,
    district: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user_dep)
):
    """Admin: Get all schools from database"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    query = {}
    if district:
        query["district"] = district
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    skip = (page - 1) * limit
    
    schools = await db.schools.find(query, {"_id": 0}).skip(skip).limit(limit).sort("name", 1).to_list(limit)
    total = await db.schools.count_documents(query)
    
    # Get unique districts for filter
    districts = await db.schools.distinct("district")
    
    return {
        "schools": schools,
        "districts": sorted(districts) if districts else [],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@api_router.post("/admin/schools")
async def admin_create_school(
    name: str,
    district: str,
    municipality: str,
    locality: Optional[str] = None,
    cycle: Optional[str] = None,
    current_user: User = Depends(get_current_user_dep)
):
    """Admin: Create a new school"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    school_id = f"school_{uuid.uuid4().hex[:12]}"
    
    school = {
        "school_id": school_id,
        "name": name,
        "district": district,
        "municipality": municipality,
        "locality": locality,
        "cycle": cycle,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user.user_id
    }
    
    await db.schools.insert_one(school)
    
    return {"success": True, "school_id": school_id, "message": "Escola criada"}

@api_router.put("/admin/schools/{school_id}")
async def admin_update_school(
    school_id: str,
    name: Optional[str] = None,
    district: Optional[str] = None,
    municipality: Optional[str] = None,
    locality: Optional[str] = None,
    cycle: Optional[str] = None,
    current_user: User = Depends(get_current_user_dep)
):
    """Admin: Update school details"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    school = await db.schools.find_one({"school_id": school_id})
    if not school:
        raise HTTPException(status_code=404, detail="Escola não encontrada")
    
    update_data = {}
    if name is not None:
        update_data["name"] = name
    if district is not None:
        update_data["district"] = district
    if municipality is not None:
        update_data["municipality"] = municipality
    if locality is not None:
        update_data["locality"] = locality
    if cycle is not None:
        update_data["cycle"] = cycle
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.schools.update_one({"school_id": school_id}, {"$set": update_data})
    
    return {"success": True, "message": "Escola atualizada"}

@api_router.delete("/admin/schools/{school_id}")
async def admin_delete_school(
    school_id: str,
    current_user: User = Depends(get_current_user_dep)
):
    """Admin: Delete a school"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas admins")
    
    # Check if school has students
    students_count = await db.students.count_documents({"school_id": school_id})
    if students_count > 0:
        raise HTTPException(status_code=400, detail=f"Escola tem {students_count} aluno(s) registados")
    
    result = await db.schools.delete_one({"school_id": school_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Escola não encontrada")
    
    return {"success": True, "message": "Escola eliminada"}

# ==================== LEAGUES ROUTES ====================

@api_router.get("/leagues/current")
async def get_current_league(
    current_user: User = Depends(get_current_user_dep)
):
    """Get current month's league standings"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas alunos")
    
    now = datetime.now(timezone.utc)
    league_id = f"{now.year}-{now.month:02d}"
    
    # Get or create user's league entry
    user_entry = await db.league_entries.find_one({
        "user_id": current_user.user_id,
        "league_id": league_id
    })
    
    if not user_entry:
        # Get user's game state for initial XP
        game_state = await db.game_states.find_one({"user_id": current_user.user_id}, {"_id": 0})
        
        user_entry = {
            "user_id": current_user.user_id,
            "league_id": league_id,
            "xp_start": game_state.get("xp", 0) if game_state else 0,
            "xp_earned": 0,
            "rank": 0,
            "joined_at": now.isoformat()
        }
        await db.league_entries.insert_one(user_entry)
    
    # Get student profile for nickname
    student = await db.students.find_one({"user_id": current_user.user_id}, {"_id": 0})
    
    # Get top 10 in this league
    top_entries = await db.league_entries.aggregate([
        {"$match": {"league_id": league_id}},
        {"$sort": {"xp_earned": -1}},
        {"$limit": 10},
        {"$lookup": {
            "from": "students",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "student_info"
        }},
        {"$unwind": {"path": "$student_info", "preserveNullAndEmptyArrays": True}},
        {"$project": {
            "_id": 0,
            "user_id": 1,
            "xp_earned": 1,
            "nickname": "$student_info.nickname",
            "school_name": "$student_info.school_name"
        }}
    ]).to_list(10)
    
    # Add ranks
    for i, entry in enumerate(top_entries):
        entry["rank"] = i + 1
    
    # Get user's current rank
    user_rank_result = await db.league_entries.aggregate([
        {"$match": {"league_id": league_id}},
        {"$sort": {"xp_earned": -1}},
        {"$group": {"_id": None, "entries": {"$push": "$user_id"}}},
        {"$project": {"rank": {"$indexOfArray": ["$entries", current_user.user_id]}}}
    ]).to_list(1)
    
    user_rank = (user_rank_result[0]["rank"] + 1) if user_rank_result and user_rank_result[0]["rank"] >= 0 else 0
    
    # Calculate days left in month
    import calendar
    _, last_day = calendar.monthrange(now.year, now.month)
    days_left = last_day - now.day
    
    return {
        "league_id": league_id,
        "month_name": now.strftime("%B %Y"),
        "days_left": days_left,
        "user_stats": {
            "rank": user_rank,
            "xp_earned": user_entry.get("xp_earned", 0),
            "nickname": student.get("nickname") if student else "Jogador"
        },
        "top_10": top_entries,
        "rewards": {
            "1st": {"diamonds": 100, "badge": "league_champion"},
            "2nd": {"diamonds": 50, "badge": "league_silver"},
            "3rd": {"diamonds": 25, "badge": "league_bronze"},
            "4th-10th": {"diamonds": 10, "badge": None}
        }
    }

@api_router.post("/leagues/update-xp")
async def update_league_xp(
    xp_gained: int,
    current_user: User = Depends(get_current_user_dep)
):
    """Update user's XP in current league"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Apenas alunos")
    
    now = datetime.now(timezone.utc)
    league_id = f"{now.year}-{now.month:02d}"
    
    await db.league_entries.update_one(
        {"user_id": current_user.user_id, "league_id": league_id},
        {"$inc": {"xp_earned": xp_gained}},
        upsert=True
    )
    
    return {"success": True}

# ==================== NOTIFICATIONS ROUTES ====================

@api_router.get("/notifications/my")
async def get_my_notifications(
    limit: int = 20,
    current_user: User = Depends(get_current_user_dep)
):
    """Get current user's notifications"""
    notifications = await db.notifications.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    unread_count = await db.notifications.count_documents({
        "user_id": current_user.user_id,
        "read": False
    })
    
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user_dep)
):
    """Mark notification as read"""
    result = await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": current_user.user_id},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    return {"success": True}

@api_router.post("/notifications/mark-all-read")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user_dep)
):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": current_user.user_id, "read": False},
        {"$set": {"read": True}}
    )
    
    return {"success": True}

# ==================== P5: REPORT EXPORT & PUSH NOTIFICATIONS ====================

@api_router.get("/reports/student/{student_id}")
async def get_student_report_data(
    student_id: str,
    current_user: User = Depends(get_current_user_dep)
):
    """Get comprehensive student data for PDF report generation"""
    # Verify the parent has access to this student
    if current_user.role == UserRole.PARENT:
        student = await db.students.find_one(
            {"student_id": student_id, "parent_id": current_user.user_id},
            {"_id": 0}
        )
        if not student:
            raise HTTPException(status_code=403, detail="Não tem permissão para ver este aluno")
    elif current_user.role == UserRole.ADMIN:
        student = await db.students.find_one({"student_id": student_id}, {"_id": 0})
        if not student:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
    else:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Get game state
    game_state = await db.game_states.find_one({"user_id": student['user_id']}, {"_id": 0})
    
    # Get quiz history
    quiz_history = await db.quiz_submissions.find(
        {"user_id": student['user_id']}
    ).sort("submitted_at", -1).limit(100).to_list(100)
    
    # Calculate stats per subject
    subjects_stats = {}
    for quiz in quiz_history:
        subject = quiz.get('subject', 'Unknown')
        if subject not in subjects_stats:
            subjects_stats[subject] = {"quizzes": 0, "correct": 0, "total_questions": 0}
        subjects_stats[subject]["quizzes"] += 1
        subjects_stats[subject]["correct"] += quiz.get('correct_answers', 0)
        subjects_stats[subject]["total_questions"] += quiz.get('total_questions', 5)
    
    # Convert to list with accuracy
    subjects_performance = []
    for subject, stats in subjects_stats.items():
        accuracy = round((stats["correct"] / stats["total_questions"]) * 100) if stats["total_questions"] > 0 else 0
        subjects_performance.append({
            "name": subject,
            "quizzes": stats["quizzes"],
            "accuracy": accuracy
        })
    
    # Get achievements
    achievements_doc = await db.achievements.find_one({"user_id": student['user_id']}, {"_id": 0})
    achievements = []
    if achievements_doc:
        achievements = achievements_doc.get('unlocked', [])
    
    # Get ranking position
    ranking = await db.rankings.find_one({"user_id": student['user_id']}, {"_id": 0})
    
    # Calculate total building level
    total_building_level = 0
    settlement_level = "Aldeia"
    if game_state and game_state.get('buildings'):
        total_building_level = sum(game_state['buildings'].values())
        if total_building_level >= 50:
            settlement_level = "Metrópole"
        elif total_building_level >= 25:
            settlement_level = "Cidade"
        elif total_building_level >= 10:
            settlement_level = "Vila"
    
    report_data = {
        "nickname": student.get('nickname', ''),
        "name": student.get('name', ''),
        "school_year": student.get('school_year', 1),
        "school_name": student.get('school_name', ''),
        "xp": game_state.get('xp', 0) if game_state else 0,
        "level": game_state.get('level', 1) if game_state else 1,
        "coins": game_state.get('coins', 0) if game_state else 0,
        "diamonds": game_state.get('diamonds', 0) if game_state else 0,
        "quizzes_completed": len(quiz_history),
        "correct_answers": round(sum(q.get('correct_answers', 0) for q in quiz_history) / max(len(quiz_history), 1) * 20) if quiz_history else 0,
        "streak": game_state.get('streak', 0) if game_state else 0,
        "rank": ranking.get('position', '-') if ranking else '-',
        "settlement_level": settlement_level,
        "total_building_level": total_building_level,
        "subjects_performance": subjects_performance if subjects_performance else [
            {"name": "Matemática", "quizzes": 0, "accuracy": 0},
            {"name": "Português", "quizzes": 0, "accuracy": 0}
        ],
        "achievements": achievements if achievements else ["Aventureiro"],
        "quiz_history": [
            {
                "subject": q.get('subject', 'Unknown'),
                "date": q.get('submitted_at', ''),
                "correct": q.get('correct_answers', 0),
                "total": q.get('total_questions', 5)
            } for q in quiz_history[:20]
        ],
        "report_date": datetime.now(timezone.utc).isoformat()
    }
    
    return report_data

@api_router.post("/push/subscribe")
async def subscribe_to_push(
    request: Request,
    current_user: User = Depends(get_current_user_dep)
):
    """Subscribe to push notifications"""
    data = await request.json()
    
    subscription = {
        "user_id": current_user.user_id,
        "endpoint": data.get('endpoint'),
        "keys": data.get('keys'),
        "subscribed_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert subscription
    await db.push_subscriptions.update_one(
        {"user_id": current_user.user_id},
        {"$set": subscription},
        upsert=True
    )
    
    return {"success": True, "message": "Subscrição de notificações ativada"}

@api_router.delete("/push/unsubscribe")
async def unsubscribe_from_push(
    current_user: User = Depends(get_current_user_dep)
):
    """Unsubscribe from push notifications"""
    await db.push_subscriptions.delete_one({"user_id": current_user.user_id})
    return {"success": True, "message": "Subscrição de notificações desativada"}

@api_router.post("/notifications/send-push")
async def send_push_notification(
    request: Request,
    current_user: User = Depends(get_current_user_dep)
):
    """Send a push notification (admin only or to self)"""
    data = await request.json()
    target_user_id = data.get('user_id', current_user.user_id)
    
    # Only admin can send to others
    if target_user_id != current_user.user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas administradores podem enviar notificações a outros utilizadores")
    
    # Get subscription
    subscription = await db.push_subscriptions.find_one({"user_id": target_user_id}, {"_id": 0})
    if not subscription:
        # Create in-app notification instead
        notification = {
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_id": target_user_id,
            "title": data.get('title', 'QUESTEDUCA'),
            "message": data.get('body', 'Nova notificação'),
            "type": "push",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
        return {"success": True, "method": "in-app", "message": "Notificação in-app enviada"}
    
    # For real push notifications, we'd use web-push here
    # For now, we create an in-app notification as fallback
    notification = {
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": target_user_id,
        "title": data.get('title', 'QUESTEDUCA'),
        "message": data.get('body', 'Nova notificação'),
        "type": "push",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    
    return {"success": True, "method": "push", "message": "Notificação push enviada"}

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
