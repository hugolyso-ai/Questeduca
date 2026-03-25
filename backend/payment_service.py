import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from models import SubscriptionType
from dotenv import load_dotenv

load_dotenv()

SUBSCRIPTION_PRICES = {
    SubscriptionType.INDIVIDUAL_MONTHLY: 1.99,
    SubscriptionType.INDIVIDUAL_ANNUAL: 21.49,
    SubscriptionType.FAMILY_MONTHLY: 4.99,
    SubscriptionType.FAMILY_ANNUAL: 53.89,
}

COMMISSION_RATE = 0.10

class PaymentService:
    def __init__(self):
        pass
    
    def get_subscription_price(self, subscription_type: SubscriptionType) -> float:
        return SUBSCRIPTION_PRICES.get(subscription_type, 0.0)
    
    def calculate_commission(self, amount: float) -> float:
        return amount * COMMISSION_RATE
    
    async def generate_multibanco_reference(
        self,
        amount: float,
        entity: str = "12345"
    ) -> dict:
        
        reference = str(uuid.uuid4().int)[:9]
        
        return {
            "entity": entity,
            "reference": reference,
            "amount": amount,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
        }
    
    async def generate_mbway_payment(
        self,
        phone: str,
        amount: float
    ) -> dict:
        
        transaction_id = f"mbway_{uuid.uuid4().hex[:12]}"
        
        return {
            "transaction_id": transaction_id,
            "phone": phone,
            "amount": amount,
            "status": "pending"
        }
    
    def generate_giftcard_code(self) -> str:
        return f"QUEST-{uuid.uuid4().hex[:8].upper()}"