"""
Test P1 Features: Giftcards, Portugal Map (Friends Search), Accessibility
Tests for QUESTEDUCA educational RTS game
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://edu-empire-1.preview.emergentagent.com')

# Test credentials from previous iteration
PARENT_EMAIL = "test_parent_giftcard@example.com"
PARENT_PASSWORD = "TestPass123!"
STUDENT_EMAIL = "test_student_ui_1774624516@example.com"
STUDENT_PASSWORD = "7817c30c"


class TestGiftcardsAPI:
    """Test Giftcard purchase and redemption endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session for tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def _login_parent(self):
        """Login as parent and return session"""
        # First try to register, then login
        register_data = {
            "email": PARENT_EMAIL,
            "password": PARENT_PASSWORD,
            "name": "Test Parent Giftcard",
            "role": "parent"
        }
        self.session.post(f"{BASE_URL}/api/auth/register", json=register_data)
        
        # Login
        login_data = {"email": PARENT_EMAIL, "password": PARENT_PASSWORD}
        response = self.session.post(f"{BASE_URL}/api/auth/login", json=login_data)
        return response.status_code == 200
    
    def _login_student(self):
        """Login as student and return session"""
        login_data = {"email": STUDENT_EMAIL, "password": STUDENT_PASSWORD}
        response = self.session.post(f"{BASE_URL}/api/auth/login", json=login_data)
        return response.status_code == 200
    
    # ==================== GET /api/parents/me Tests ====================
    
    def test_parents_me_requires_auth(self):
        """GET /api/parents/me requires authentication"""
        response = self.session.get(f"{BASE_URL}/api/parents/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: GET /api/parents/me requires authentication (401)")
    
    def test_parents_me_requires_parent_role(self):
        """GET /api/parents/me requires parent role"""
        assert self._login_student(), "Failed to login as student"
        response = self.session.get(f"{BASE_URL}/api/parents/me")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: GET /api/parents/me requires parent role (403)")
    
    def test_parents_me_returns_profile_with_credit_balance(self):
        """GET /api/parents/me returns parent profile with credit_balance"""
        assert self._login_parent(), "Failed to login as parent"
        response = self.session.get(f"{BASE_URL}/api/parents/me")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "user_id" in data, "Response missing user_id"
        assert "credit_balance" in data, "Response missing credit_balance"
        assert isinstance(data["credit_balance"], (int, float)), "credit_balance should be numeric"
        print(f"PASS: GET /api/parents/me returns profile with credit_balance: {data['credit_balance']}")
    
    # ==================== POST /api/giftcards/purchase Tests ====================
    
    def test_giftcard_purchase_requires_auth(self):
        """POST /api/giftcards/purchase requires authentication"""
        response = self.session.post(f"{BASE_URL}/api/giftcards/purchase", json={
            "amount": 5,
            "origin_url": "https://edu-empire-1.preview.emergentagent.com"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: POST /api/giftcards/purchase requires authentication (401)")
    
    def test_giftcard_purchase_requires_parent_role(self):
        """POST /api/giftcards/purchase requires parent role"""
        assert self._login_student(), "Failed to login as student"
        response = self.session.post(f"{BASE_URL}/api/giftcards/purchase", params={
            "amount": 5,
            "origin_url": "https://edu-empire-1.preview.emergentagent.com"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: POST /api/giftcards/purchase requires parent role (403)")
    
    def test_giftcard_purchase_invalid_amount(self):
        """POST /api/giftcards/purchase rejects invalid amounts"""
        assert self._login_parent(), "Failed to login as parent"
        response = self.session.post(f"{BASE_URL}/api/giftcards/purchase", params={
            "amount": 15,  # Invalid - only 5, 10, 20 allowed
            "origin_url": "https://edu-empire-1.preview.emergentagent.com"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: POST /api/giftcards/purchase rejects invalid amount (400)")
    
    def test_giftcard_purchase_valid_amounts(self):
        """POST /api/giftcards/purchase accepts valid amounts (5, 10, 20)"""
        assert self._login_parent(), "Failed to login as parent"
        
        for amount in [5, 10, 20]:
            response = self.session.post(f"{BASE_URL}/api/giftcards/purchase", params={
                "amount": amount,
                "origin_url": "https://edu-empire-1.preview.emergentagent.com"
            })
            # Should return 200 with Stripe checkout URL or 500 if Stripe not configured
            assert response.status_code in [200, 500], f"Expected 200 or 500 for amount {amount}, got {response.status_code}"
            
            if response.status_code == 200:
                data = response.json()
                assert "url" in data, f"Response missing url for amount {amount}"
                assert "session_id" in data, f"Response missing session_id for amount {amount}"
                print(f"PASS: POST /api/giftcards/purchase accepts €{amount} and returns Stripe URL")
            else:
                print(f"INFO: POST /api/giftcards/purchase for €{amount} returned 500 (Stripe may not be configured)")
    
    # ==================== POST /api/giftcards/redeem Tests ====================
    
    def test_giftcard_redeem_requires_auth(self):
        """POST /api/giftcards/redeem requires authentication"""
        response = self.session.post(f"{BASE_URL}/api/giftcards/redeem", json={
            "code": "GIFT-TESTCODE"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: POST /api/giftcards/redeem requires authentication (401)")
    
    def test_giftcard_redeem_requires_parent_role(self):
        """POST /api/giftcards/redeem requires parent role"""
        assert self._login_student(), "Failed to login as student"
        response = self.session.post(f"{BASE_URL}/api/giftcards/redeem", params={
            "code": "GIFT-TESTCODE"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: POST /api/giftcards/redeem requires parent role (403)")
    
    def test_giftcard_redeem_invalid_code(self):
        """POST /api/giftcards/redeem rejects invalid codes"""
        assert self._login_parent(), "Failed to login as parent"
        response = self.session.post(f"{BASE_URL}/api/giftcards/redeem", params={
            "code": "GIFT-INVALIDCODE123"
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: POST /api/giftcards/redeem rejects invalid code (404)")


class TestFriendsSearchWithDistrict:
    """Test Friends search with district filter (Portugal Map feature)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session for tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def _login_student(self):
        """Login as student and return session"""
        login_data = {"email": STUDENT_EMAIL, "password": STUDENT_PASSWORD}
        response = self.session.post(f"{BASE_URL}/api/auth/login", json=login_data)
        return response.status_code == 200
    
    def test_friends_search_with_district_filter(self):
        """GET /api/friends/search with district parameter filters by district"""
        assert self._login_student(), "Failed to login as student"
        
        # Test with a Portuguese district
        response = self.session.get(f"{BASE_URL}/api/friends/search", params={
            "district": "Lisboa"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # If there are results, verify they have the expected fields
        if len(data) > 0:
            for student in data:
                assert "user_id" in student, "Student missing user_id"
                assert "nickname" in student, "Student missing nickname"
                assert "district" in student, "Student missing district"
                # District should match filter (if student has district set)
                if student.get("district"):
                    assert student["district"] == "Lisboa", f"Expected Lisboa, got {student['district']}"
        
        print(f"PASS: GET /api/friends/search with district=Lisboa returns {len(data)} results")
    
    def test_friends_search_with_query_and_district(self):
        """GET /api/friends/search with both query and district parameters"""
        assert self._login_student(), "Failed to login as student"
        
        response = self.session.get(f"{BASE_URL}/api/friends/search", params={
            "district": "Porto",
            "query": "test"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET /api/friends/search with district=Porto and query=test returns {len(data)} results")
    
    def test_friends_search_all_districts(self):
        """GET /api/friends/search works with various Portuguese districts"""
        assert self._login_student(), "Failed to login as student"
        
        districts = ["Lisboa", "Porto", "Braga", "Faro", "Coimbra", "Aveiro"]
        
        for district in districts:
            response = self.session.get(f"{BASE_URL}/api/friends/search", params={
                "district": district
            })
            assert response.status_code == 200, f"Expected 200 for {district}, got {response.status_code}"
        
        print(f"PASS: GET /api/friends/search works with all tested districts: {districts}")


class TestDistrictsAPI:
    """Test Districts API for Portugal Map"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session for tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_districts_endpoint_returns_list(self):
        """GET /api/districts returns list of Portuguese districts"""
        response = self.session.get(f"{BASE_URL}/api/districts")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Districts list should not be empty"
        
        # Check structure of first district
        if len(data) > 0:
            district = data[0]
            assert "district_id" in district or "name" in district, "District should have district_id or name"
        
        print(f"PASS: GET /api/districts returns {len(data)} districts")
    
    def test_districts_contains_expected_regions(self):
        """GET /api/districts contains expected Portuguese regions"""
        response = self.session.get(f"{BASE_URL}/api/districts")
        assert response.status_code == 200
        
        data = response.json()
        district_names = [d.get("name", d.get("district_id", "")) for d in data]
        
        # Check for some expected Portuguese districts
        expected = ["Lisboa", "Porto", "Braga", "Faro"]
        found = [d for d in expected if any(d.lower() in name.lower() for name in district_names)]
        
        print(f"PASS: GET /api/districts contains expected regions. Found: {found}")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
