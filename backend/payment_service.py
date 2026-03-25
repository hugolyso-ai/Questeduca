import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict
from models import SubscriptionType
from dotenv import load_dotenv
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, 
    CheckoutSessionResponse, 
    CheckoutStatusResponse, 
    CheckoutSessionRequest
)

load_dotenv()

# Preços fixos das subscrições (definidos no backend por segurança)
SUBSCRIPTION_PRICES = {
    SubscriptionType.INDIVIDUAL_MONTHLY: 1.99,
    SubscriptionType.INDIVIDUAL_ANNUAL: 21.49,  # 10% desconto: 1.99 * 12 * 0.9
    SubscriptionType.FAMILY_MONTHLY: 4.99,
    SubscriptionType.FAMILY_ANNUAL: 53.89,      # 10% desconto: 4.99 * 12 * 0.9
}

# Mapeamento de IDs de pacotes para tipos de subscrição
SUBSCRIPTION_PACKAGES = {
    "individual_monthly": SubscriptionType.INDIVIDUAL_MONTHLY,
    "individual_annual": SubscriptionType.INDIVIDUAL_ANNUAL,
    "family_monthly": SubscriptionType.FAMILY_MONTHLY,
    "family_annual": SubscriptionType.FAMILY_ANNUAL,
}

COMMISSION_RATE = 0.10  # 10% para associações de pais

class PaymentService:
    def __init__(self, api_key: str = None, webhook_url: str = None):
        self.api_key = api_key or os.environ.get('STRIPE_SECRET_KEY')
        self.webhook_url = webhook_url
        self._stripe_checkout = None
    
    def _get_stripe_checkout(self, webhook_url: str = None) -> StripeCheckout:
        """Initialize Stripe checkout with the appropriate webhook URL"""
        url = webhook_url or self.webhook_url
        return StripeCheckout(api_key=self.api_key, webhook_url=url)
    
    def get_subscription_price(self, subscription_type: SubscriptionType) -> float:
        """Get the price for a subscription type"""
        return SUBSCRIPTION_PRICES.get(subscription_type, 0.0)
    
    def get_package_price(self, package_id: str) -> Optional[float]:
        """Get price by package ID (for security - never accept price from frontend)"""
        sub_type = SUBSCRIPTION_PACKAGES.get(package_id)
        if sub_type:
            return SUBSCRIPTION_PRICES.get(sub_type)
        return None
    
    def calculate_commission(self, amount: float) -> float:
        """Calculate commission for associations (10%)"""
        return amount * COMMISSION_RATE
    
    async def create_checkout_session(
        self,
        package_id: str,
        origin_url: str,
        user_id: str,
        user_email: str,
        association_code: Optional[str] = None
    ) -> Dict:
        """
        Create a Stripe checkout session for a subscription.
        
        Args:
            package_id: ID of the subscription package (e.g., 'individual_monthly')
            origin_url: Frontend origin URL for building success/cancel URLs
            user_id: ID of the user making the purchase
            user_email: Email of the user
            association_code: Optional association code for commission tracking
        
        Returns:
            Dict with checkout URL and session ID
        """
        # Get price from server-side definition (SECURITY: never accept from frontend)
        amount = self.get_package_price(package_id)
        if amount is None:
            raise ValueError(f"Invalid package ID: {package_id}")
        
        # Build webhook URL
        webhook_url = f"{origin_url}/api/webhook/stripe"
        stripe_checkout = self._get_stripe_checkout(webhook_url)
        
        # Build success and cancel URLs dynamically
        success_url = f"{origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/payment/cancel"
        
        # Build metadata for tracking
        metadata = {
            "package_id": package_id,
            "user_id": user_id,
            "user_email": user_email,
            "source": "questeduca_web"
        }
        
        if association_code:
            metadata["association_code"] = association_code
        
        # Create checkout request
        checkout_request = CheckoutSessionRequest(
            amount=float(amount),  # Ensure float format for Stripe
            currency="eur",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata
        )
        
        # Create session with Stripe
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        return {
            "url": session.url,
            "session_id": session.session_id,
            "amount": amount,
            "package_id": package_id
        }
    
    async def get_checkout_status(self, session_id: str, origin_url: str) -> CheckoutStatusResponse:
        """Get the status of a checkout session"""
        webhook_url = f"{origin_url}/api/webhook/stripe"
        stripe_checkout = self._get_stripe_checkout(webhook_url)
        return await stripe_checkout.get_checkout_status(session_id)
    
    async def handle_webhook(self, body: bytes, signature: str, origin_url: str):
        """Handle Stripe webhook events"""
        webhook_url = f"{origin_url}/api/webhook/stripe"
        stripe_checkout = self._get_stripe_checkout(webhook_url)
        return await stripe_checkout.handle_webhook(body, signature)
    
    async def generate_multibanco_reference(
        self,
        amount: float,
        entity: str = "12345"
    ) -> dict:
        """Generate Multibanco reference (placeholder for future implementation)"""
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
        """Generate MB WAY payment (placeholder for future implementation)"""
        transaction_id = f"mbway_{uuid.uuid4().hex[:12]}"
        
        return {
            "transaction_id": transaction_id,
            "phone": phone,
            "amount": amount,
            "status": "pending"
        }
    
    def generate_giftcard_code(self) -> str:
        """Generate a unique giftcard code"""
        return f"QUEST-{uuid.uuid4().hex[:8].upper()}"
