from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid

class UserRole(str, Enum):
    ADMIN = "admin"
    PARENT = "parent"
    STUDENT = "student"
    ASSOCIATION = "association"

class SchoolYear(str, Enum):
    YEAR_1 = "1"
    YEAR_2 = "2"
    YEAR_3 = "3"
    YEAR_4 = "4"
    YEAR_5 = "5"
    YEAR_6 = "6"
    YEAR_7 = "7"
    YEAR_8 = "8"
    YEAR_9 = "9"

class SubscriptionType(str, Enum):
    FREE = "free"
    INDIVIDUAL_MONTHLY = "individual_monthly"
    INDIVIDUAL_ANNUAL = "individual_annual"
    FAMILY_MONTHLY = "family_monthly"
    FAMILY_ANNUAL = "family_annual"

class BuildingType(str, Enum):
    HOUSE = "house"
    FARM = "farm"
    WORKSHOP = "workshop"
    SCHOOL = "school"
    LIBRARY = "library"
    MARKET = "market"
    CASTLE = "castle"

class SettlementLevel(str, Enum):
    VILLAGE = "village"
    TOWN = "town"
    CITY = "city"
    COUNTY = "county"
    DISTRICT = "district"

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole
    picture: Optional[str] = None

class User(UserBase):
    user_id: str
    created_at: datetime
    must_change_password: bool = False
    is_active: bool = True

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

# Parent Models
class ParentProfile(BaseModel):
    user_id: str
    children_ids: List[str] = []
    subscription_type: SubscriptionType = SubscriptionType.FREE
    subscription_expiry: Optional[datetime] = None
    premium_active: bool = False
    association_code: Optional[str] = None
    association_code_registered_at: Optional[datetime] = None  # When the code was registered
    first_subscription_date: Optional[datetime] = None  # When the first subscription was made

# Student Models
class StudentProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    user_id: str
    student_id: str
    nickname: str
    parent_id: Optional[str] = None
    school_year: SchoolYear
    school_id: Optional[str] = None
    school_name: str
    district: str
    municipality: Optional[str] = None
    locality: Optional[str] = None
    approved_by_parent: bool = False
    is_premium: bool = False
    coins: int = 0
    diamonds: int = 0
    level: int = 1
    settlement_level: SettlementLevel = SettlementLevel.VILLAGE
    accessibility_settings: Dict[str, Any] = {}

class StudentCreate(BaseModel):
    email: EmailStr
    name: str
    nickname: str
    school_year: SchoolYear
    school_name: str
    district: str

# Response model for student creation (includes temp_password for parent)
class StudentCreateResponse(StudentProfile):
    temp_password: Optional[str] = None


# Association Models
class AssociationProfile(BaseModel):
    user_id: str
    association_id: str
    association_name: str
    school_id: str
    school_name: str
    district: str
    municipality: str
    locality: str
    iban: str
    responsible_names: List[str]
    association_code: str
    approved: bool = False
    total_commissions: float = 0.0
    pending_payout: float = 0.0
    documents_urls: List[str] = []
    created_at: Optional[datetime] = None

class AssociationCreate(BaseModel):
    email: EmailStr
    name: str
    association_name: str
    district: str
    municipality: str
    locality: str
    school_id: str
    school_name: str
    iban: str
    responsible_names: List[str]
    documents_urls: List[str] = []

# School Models
class School(BaseModel):
    school_id: str
    name: str
    district: str
    municipality: str

# District Models
class District(BaseModel):
    district_id: str
    name: str
    color: str

# Subscription Models
class Subscription(BaseModel):
    subscription_id: str
    user_id: str
    type: SubscriptionType
    start_date: datetime
    end_date: datetime
    auto_renew: bool = False
    association_code: Optional[str] = None
    payment_reference: Optional[str] = None

class SubscriptionCreate(BaseModel):
    type: SubscriptionType
    association_code: Optional[str] = None

# Giftcard Models
class Giftcard(BaseModel):
    giftcard_id: str
    code: str
    type: SubscriptionType
    value: float
    used: bool = False
    used_by: Optional[str] = None
    used_at: Optional[datetime] = None
    created_at: datetime
    association_code: Optional[str] = None

# Commission Models
class Commission(BaseModel):
    commission_id: str
    association_id: str
    amount: float
    subscription_id: Optional[str] = None
    giftcard_id: Optional[str] = None
    created_at: datetime
    paid: bool = False
    paid_at: Optional[datetime] = None

# Question Models
class Question(BaseModel):
    question_id: str
    school_year: SchoolYear
    subject: str
    question_text: str
    options: List[str]
    correct_answer: int
    difficulty: int = 1
    created_at: datetime

class QuestionGenerate(BaseModel):
    school_year: SchoolYear
    subject: str
    count: int = 10

# Game State Models
class GameState(BaseModel):
    user_id: str
    settlement_level: SettlementLevel
    coins: int
    diamonds: int
    level: int
    experience: int
    buildings: List[str] = []
    last_updated: datetime

# Building Models
class Building(BaseModel):
    building_id: str
    user_id: str
    type: BuildingType
    position_x: int
    position_y: int
    level: int = 1
    construction_started: datetime
    construction_ends: datetime
    is_completed: bool = False
    production_rate: float = 1.0

class BuildingCreate(BaseModel):
    type: BuildingType
    position_x: int
    position_y: int

# Friendship Models
class Friendship(BaseModel):
    friendship_id: str
    user_id_1: str
    user_id_2: str
    created_at: datetime

class FriendRequest(BaseModel):
    request_id: str
    from_user_id: str
    to_user_id: str
    status: str = "pending"
    created_at: datetime
    approved_by_parent: bool = False

class FriendRequestCreate(BaseModel):
    to_user_id: str

# Trade Models
class Trade(BaseModel):
    trade_id: str
    from_user_id: str
    to_user_id: str
    offered_coins: int = 0
    offered_diamonds: int = 0
    requested_coins: int = 0
    requested_diamonds: int = 0
    status: str = "pending"
    created_at: datetime

class TradeCreate(BaseModel):
    to_user_id: str
    offered_coins: int = 0
    offered_diamonds: int = 0
    requested_coins: int = 0
    requested_diamonds: int = 0

# Chat Models
class ChatMessage(BaseModel):
    message_id: str
    from_user_id: str
    to_user_id: str
    message: str
    created_at: datetime
    read: bool = False

class ChatMessageCreate(BaseModel):
    to_user_id: str
    message: str

# Mini-game Models
class MiniGame(BaseModel):
    game_id: str
    name: str
    description: str
    premium_only: bool = False
    min_players: int = 1
    max_players: int = 2

class GameScore(BaseModel):
    score_id: str
    user_id: str
    game_id: str
    score: int
    coins_won: int
    diamonds_won: int
    created_at: datetime

# Auth Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole

class TokenResponse(BaseModel):
    session_token: str
    user: User


# Payment Models
class CheckoutRequest(BaseModel):
    package_id: str  # e.g., 'individual_monthly', 'family_annual'
    origin_url: str  # Frontend origin for building success/cancel URLs
    association_code: Optional[str] = None

class CheckoutResponse(BaseModel):
    url: str
    session_id: str
    amount: float
    package_id: str

class PaymentTransaction(BaseModel):
    transaction_id: str
    session_id: str
    user_id: str
    user_email: str
    package_id: str
    amount: float
    currency: str = "eur"
    status: str = "pending"  # pending, completed, failed, expired
    payment_status: str = "unpaid"  # unpaid, paid
    association_code: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


# Ranking Models
class RankingEntry(BaseModel):
    rank: int
    user_id: str
    nickname: str
    school_name: str
    district: str
    xp: int
    level: int
    quizzes_completed: int
    accuracy_rate: float  # 0-100
    settlement_level: str

class RankingResponse(BaseModel):
    ranking_type: str  # school, district, national
    filter_value: Optional[str] = None  # school_id or district name
    entries: List[RankingEntry]
    user_position: Optional[int] = None
    total_players: int

# Giftcard Models
class GiftcardCreate(BaseModel):
    amount: float  # 5, 10, 20
    
class Giftcard(BaseModel):
    giftcard_id: str
    code: str  # GIFT-XXXXXXXX
    amount: float
    currency: str = "eur"
    created_by: str  # user_id of purchaser
    redeemed_by: Optional[str] = None
    redeemed_at: Optional[datetime] = None
    status: str = "active"  # active, redeemed, expired
    association_code: Optional[str] = None  # for commission tracking
    created_at: datetime
    expires_at: datetime

class GiftcardRedeem(BaseModel):
    code: str

# Friendship Models
class FriendRequest(BaseModel):
    request_id: str
    from_user_id: str
    from_nickname: str
    to_user_id: str
    to_nickname: str
    status: str = "pending"  # pending, approved, rejected
    parent_approved: bool = False
    created_at: datetime

class Friend(BaseModel):
    user_id: str
    nickname: str
    school_name: str
    district: str
    level: int
    settlement_level: str

# Accessibility Settings
class AccessibilitySettings(BaseModel):
    dyslexia_font: bool = False
    colorblind_mode: str = "none"  # none, protanopia, deuteranopia, tritanopia
    high_contrast: bool = False
    text_size: str = "medium"  # small, medium, large, xlarge