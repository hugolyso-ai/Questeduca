"""
QUESTEDUCA API Tests
Tests for: districts, schools, subscriptions, auth, students, payments
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://edu-empire-1.preview.emergentagent.com')

class TestPublicEndpoints:
    """Test public API endpoints that don't require authentication"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root: {data}")
    
    def test_health_check(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print(f"✓ Health check: {data}")
    
    def test_districts_returns_20(self):
        """Test /api/districts returns 20 Portuguese districts"""
        response = requests.get(f"{BASE_URL}/api/districts")
        assert response.status_code == 200
        data = response.json()
        
        # Should return exactly 20 districts
        assert len(data) == 20, f"Expected 20 districts, got {len(data)}"
        
        # Verify structure of each district
        for district in data:
            assert "district_id" in district
            assert "name" in district
            assert "color" in district
        
        # Verify some known districts exist
        district_names = [d["name"] for d in data]
        assert "Lisboa" in district_names
        assert "Porto" in district_names
        assert "Braga" in district_names
        assert "Faro" in district_names
        assert "Açores" in district_names
        assert "Madeira" in district_names
        
        print(f"✓ Districts: {len(data)} districts returned")
        print(f"  Sample districts: {district_names[:5]}")
    
    def test_schools_returns_list(self):
        """Test /api/schools returns school list"""
        response = requests.get(f"{BASE_URL}/api/schools")
        assert response.status_code == 200
        data = response.json()
        
        # Should return a list of schools
        assert isinstance(data, list)
        assert len(data) > 0, "Expected at least one school"
        
        # Verify structure
        school = data[0]
        assert "school_id" in school
        assert "name" in school
        assert "district" in school
        assert "cycles" in school
        
        print(f"✓ Schools: {len(data)} schools returned")
    
    def test_schools_filter_by_district(self):
        """Test /api/schools with district filter"""
        response = requests.get(f"{BASE_URL}/api/schools", params={"district": "Lisboa"})
        assert response.status_code == 200
        data = response.json()
        
        # All schools should be from Lisboa
        for school in data:
            assert school["district"] == "Lisboa", f"Expected Lisboa, got {school['district']}"
        
        print(f"✓ Schools filtered by Lisboa: {len(data)} schools")
    
    def test_schools_filter_by_cycle(self):
        """Test /api/schools with cycle filter"""
        response = requests.get(f"{BASE_URL}/api/schools", params={"cycle": "1"})
        assert response.status_code == 200
        data = response.json()
        
        # All schools should have cycle 1
        for school in data:
            assert "1" in school.get("cycles", []), f"School {school['name']} doesn't have cycle 1"
        
        print(f"✓ Schools filtered by cycle 1: {len(data)} schools")
    
    def test_schools_filter_by_school_year(self):
        """Test /api/schools with school_year filter (converts to cycle)"""
        # Year 5 should map to cycle 2
        response = requests.get(f"{BASE_URL}/api/schools", params={"school_year": "5"})
        assert response.status_code == 200
        data = response.json()
        
        # All schools should have cycle 2 (5th year is 2º ciclo)
        for school in data:
            assert "2" in school.get("cycles", []), f"School {school['name']} doesn't have cycle 2"
        
        print(f"✓ Schools filtered by year 5 (cycle 2): {len(data)} schools")
    
    def test_schools_filter_by_district_and_year(self):
        """Test /api/schools with both district and school_year filters"""
        response = requests.get(f"{BASE_URL}/api/schools", params={
            "district": "Lisboa",
            "school_year": "5"
        })
        assert response.status_code == 200
        data = response.json()
        
        # All schools should be from Lisboa and have cycle 2
        for school in data:
            assert school["district"] == "Lisboa"
            assert "2" in school.get("cycles", [])
        
        print(f"✓ Schools filtered by Lisboa + year 5: {len(data)} schools")
    
    def test_subscription_prices(self):
        """Test /api/subscriptions/prices returns correct prices"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/prices")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all price types exist
        assert "individual_monthly" in data
        assert "individual_annual" in data
        assert "family_monthly" in data
        assert "family_annual" in data
        
        # Verify correct prices (as per PRD: 1.99€ individual, 4.99€ family)
        assert data["individual_monthly"] == 1.99, f"Expected 1.99, got {data['individual_monthly']}"
        assert data["family_monthly"] == 4.99, f"Expected 4.99, got {data['family_monthly']}"
        
        # Annual should have 10% discount
        expected_individual_annual = round(1.99 * 12 * 0.9, 2)
        expected_family_annual = round(4.99 * 12 * 0.9, 2)
        
        assert abs(data["individual_annual"] - expected_individual_annual) < 0.1
        assert abs(data["family_annual"] - expected_family_annual) < 0.1
        
        print(f"✓ Subscription prices: {data}")
    
    def test_subjects_by_year(self):
        """Test /api/subjects/{school_year} returns subjects"""
        response = requests.get(f"{BASE_URL}/api/subjects/5")
        assert response.status_code == 200
        data = response.json()
        
        assert "subjects" in data
        assert isinstance(data["subjects"], list)
        
        print(f"✓ Subjects for year 5: {data['subjects']}")


class TestAuthFlow:
    """Test authentication flow: register, login, logout"""
    
    @pytest.fixture
    def unique_email(self):
        """Generate unique email for testing"""
        return f"TEST_parent_{uuid.uuid4().hex[:8]}@example.com"
    
    def test_register_parent(self, unique_email):
        """Test parent registration"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPassword123!",
            "name": "Test Parent",
            "role": "parent"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        assert data["email"] == unique_email
        assert data["name"] == "Test Parent"
        assert data["role"] == "parent"
        assert "user_id" in data
        
        print(f"✓ Parent registered: {data['user_id']}")
        return data
    
    def test_register_duplicate_email(self, unique_email):
        """Test that duplicate email registration fails"""
        # First registration
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPassword123!",
            "name": "Test Parent",
            "role": "parent"
        })
        
        # Second registration with same email
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPassword123!",
            "name": "Test Parent 2",
            "role": "parent"
        })
        
        assert response.status_code == 400
        assert "já registado" in response.json().get("detail", "").lower() or "already" in response.json().get("detail", "").lower()
        
        print(f"✓ Duplicate email rejected correctly")
    
    def test_login_success(self, unique_email):
        """Test successful login"""
        # First register
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPassword123!",
            "name": "Test Parent",
            "role": "parent"
        })
        
        # Then login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "TestPassword123!"
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        assert "session_token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        
        # Check cookie is set
        assert "session_token" in response.cookies or "set-cookie" in response.headers
        
        print(f"✓ Login successful, session token received")
        return data
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        print(f"✓ Invalid credentials rejected correctly")
    
    def test_get_me_authenticated(self, unique_email):
        """Test /api/auth/me with valid session"""
        # Register and login
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPassword123!",
            "name": "Test Parent",
            "role": "parent"
        })
        
        session = requests.Session()
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "TestPassword123!"
        })
        
        # Get me
        response = session.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 200, f"Get me failed: {response.text}"
        data = response.json()
        
        assert data["email"] == unique_email
        assert data["role"] == "parent"
        
        print(f"✓ Get me successful: {data['name']}")


class TestParentStudentFlow:
    """Test parent creating student accounts"""
    
    @pytest.fixture
    def authenticated_parent_session(self):
        """Create and login a parent, return session"""
        email = f"TEST_parent_{uuid.uuid4().hex[:8]}@example.com"
        
        # Register
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "TestPassword123!",
            "name": "Test Parent",
            "role": "parent"
        })
        
        # Login with session
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": "TestPassword123!"
        })
        
        return session
    
    def test_create_student(self, authenticated_parent_session):
        """Test parent creating a student account"""
        session = authenticated_parent_session
        
        student_email = f"TEST_student_{uuid.uuid4().hex[:8]}@example.com"
        
        response = session.post(f"{BASE_URL}/api/students", json={
            "email": student_email,
            "name": "Test Student",
            "nickname": "TestKid",
            "school_year": "5",
            "school_name": "Escola Básica de Cascais",
            "district": "Lisboa"
        })
        
        assert response.status_code == 200, f"Create student failed: {response.text}"
        data = response.json()
        
        assert data["nickname"] == "TestKid"
        assert data["school_year"] == "5"
        assert data["district"] == "Lisboa"
        assert "student_id" in data
        assert "temp_password" in data  # Parent should receive temp password
        
        print(f"✓ Student created: {data['student_id']}")
        print(f"  Temp password: {data['temp_password']}")
        return data
    
    def test_get_children(self, authenticated_parent_session):
        """Test parent getting their children list"""
        session = authenticated_parent_session
        
        # First create a student
        student_email = f"TEST_student_{uuid.uuid4().hex[:8]}@example.com"
        session.post(f"{BASE_URL}/api/students", json={
            "email": student_email,
            "name": "Test Student",
            "nickname": "TestKid",
            "school_year": "5",
            "school_name": "Escola Básica de Cascais",
            "district": "Lisboa"
        })
        
        # Get children
        response = session.get(f"{BASE_URL}/api/parents/me/children")
        
        assert response.status_code == 200, f"Get children failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Verify child data
        child = data[0]
        assert "nickname" in child
        assert "school_year" in child
        
        print(f"✓ Children retrieved: {len(data)} children")
    
    def test_create_student_unauthenticated(self):
        """Test that unauthenticated users cannot create students"""
        response = requests.post(f"{BASE_URL}/api/students", json={
            "email": "test@example.com",
            "name": "Test Student",
            "nickname": "TestKid",
            "school_year": "5",
            "school_name": "Test School",
            "district": "Lisboa"
        })
        
        # Should fail with 401 or 422 (no session)
        assert response.status_code in [401, 422], f"Expected auth error, got {response.status_code}"
        print(f"✓ Unauthenticated student creation rejected")


class TestPaymentCheckout:
    """Test payment/checkout endpoints"""
    
    @pytest.fixture
    def authenticated_parent_session(self):
        """Create and login a parent, return session"""
        email = f"TEST_parent_{uuid.uuid4().hex[:8]}@example.com"
        
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "TestPassword123!",
            "name": "Test Parent",
            "role": "parent"
        })
        
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": "TestPassword123!"
        })
        
        return session
    
    def test_checkout_individual_monthly(self, authenticated_parent_session):
        """Test creating checkout session for individual monthly"""
        session = authenticated_parent_session
        
        response = session.post(f"{BASE_URL}/api/payments/checkout", json={
            "package_id": "individual_monthly",
            "origin_url": BASE_URL
        })
        
        assert response.status_code == 200, f"Checkout failed: {response.text}"
        data = response.json()
        
        assert "url" in data
        assert "session_id" in data
        assert data["amount"] == 1.99
        assert data["package_id"] == "individual_monthly"
        
        # URL should be a Stripe checkout URL
        assert "stripe" in data["url"].lower() or "checkout" in data["url"].lower()
        
        print(f"✓ Checkout session created: {data['session_id'][:20]}...")
    
    def test_checkout_family_monthly(self, authenticated_parent_session):
        """Test creating checkout session for family monthly"""
        session = authenticated_parent_session
        
        response = session.post(f"{BASE_URL}/api/payments/checkout", json={
            "package_id": "family_monthly",
            "origin_url": BASE_URL
        })
        
        assert response.status_code == 200, f"Checkout failed: {response.text}"
        data = response.json()
        
        assert data["amount"] == 4.99
        assert data["package_id"] == "family_monthly"
        
        print(f"✓ Family checkout session created")
    
    def test_checkout_with_association_code(self, authenticated_parent_session):
        """Test checkout with association code"""
        session = authenticated_parent_session
        
        response = session.post(f"{BASE_URL}/api/payments/checkout", json={
            "package_id": "individual_monthly",
            "origin_url": BASE_URL,
            "association_code": "ASSOC-TEST123"
        })
        
        assert response.status_code == 200, f"Checkout failed: {response.text}"
        print(f"✓ Checkout with association code accepted")
    
    def test_checkout_invalid_package(self, authenticated_parent_session):
        """Test checkout with invalid package ID"""
        session = authenticated_parent_session
        
        response = session.post(f"{BASE_URL}/api/payments/checkout", json={
            "package_id": "invalid_package",
            "origin_url": BASE_URL
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"✓ Invalid package rejected correctly")
    
    def test_checkout_unauthenticated(self):
        """Test that unauthenticated users cannot checkout"""
        response = requests.post(f"{BASE_URL}/api/payments/checkout", json={
            "package_id": "individual_monthly",
            "origin_url": BASE_URL
        })
        
        assert response.status_code in [401, 422]
        print(f"✓ Unauthenticated checkout rejected")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
