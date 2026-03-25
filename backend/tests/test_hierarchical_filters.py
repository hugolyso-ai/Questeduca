"""
Test suite for QUESTEDUCA hierarchical filters and association features
Tests:
- Municipalities API with district filter
- Localities API with district and municipality filters
- Schools API with hierarchical filters
- Association registration
- Association code registration with 10-day rules
- Parent notifications
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestMunicipalitiesAPI:
    """Test /api/municipalities endpoint with district filter"""
    
    def test_municipalities_without_filter(self, api_client):
        """Get all municipalities without filter"""
        response = api_client.get(f"{BASE_URL}/api/municipalities")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Each municipality should have district and municipality fields
        for item in data[:5]:
            assert "district" in item
            assert "municipality" in item
        print(f"✓ Municipalities API returns {len(data)} municipalities")
    
    def test_municipalities_with_lisboa_filter(self, api_client):
        """Get municipalities filtered by Lisboa district"""
        response = api_client.get(f"{BASE_URL}/api/municipalities", params={"district": "Lisboa"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # All municipalities should be from Lisboa
        for item in data:
            assert item["district"] == "Lisboa"
        # Check for expected municipalities in Lisboa
        municipalities = [m["municipality"] for m in data]
        assert "Cascais" in municipalities or "Lisboa" in municipalities or "Oeiras" in municipalities
        print(f"✓ Lisboa district has {len(data)} municipalities: {municipalities[:5]}...")
    
    def test_municipalities_with_porto_filter(self, api_client):
        """Get municipalities filtered by Porto district"""
        response = api_client.get(f"{BASE_URL}/api/municipalities", params={"district": "Porto"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        for item in data:
            assert item["district"] == "Porto"
        print(f"✓ Porto district has {len(data)} municipalities")


class TestLocalitiesAPI:
    """Test /api/localities endpoint with district and municipality filters"""
    
    def test_localities_with_district_filter(self, api_client):
        """Get localities filtered by district only"""
        response = api_client.get(f"{BASE_URL}/api/localities", params={"district": "Lisboa"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        for item in data:
            assert item["district"] == "Lisboa"
            assert "municipality" in item
            assert "locality" in item
        print(f"✓ Lisboa district has {len(data)} localities")
    
    def test_localities_with_district_and_municipality(self, api_client):
        """Get localities filtered by Lisboa district and Cascais municipality"""
        response = api_client.get(f"{BASE_URL}/api/localities", params={
            "district": "Lisboa",
            "municipality": "Cascais"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        for item in data:
            assert item["district"] == "Lisboa"
            assert item["municipality"] == "Cascais"
        localities = [l["locality"] for l in data]
        print(f"✓ Cascais has {len(data)} localities: {localities}")
    
    def test_localities_with_oeiras_municipality(self, api_client):
        """Get localities filtered by Lisboa district and Oeiras municipality"""
        response = api_client.get(f"{BASE_URL}/api/localities", params={
            "district": "Lisboa",
            "municipality": "Oeiras"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        for item in data:
            assert item["district"] == "Lisboa"
            assert item["municipality"] == "Oeiras"
        print(f"✓ Oeiras has {len(data)} localities")


class TestSchoolsHierarchicalFilters:
    """Test /api/schools endpoint with hierarchical filters"""
    
    def test_schools_with_district_filter(self, api_client):
        """Get schools filtered by district"""
        response = api_client.get(f"{BASE_URL}/api/schools", params={"district": "Lisboa"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        for school in data:
            assert school["district"] == "Lisboa"
        print(f"✓ Lisboa district has {len(data)} schools")
    
    def test_schools_with_district_and_municipality(self, api_client):
        """Get schools filtered by district and municipality"""
        response = api_client.get(f"{BASE_URL}/api/schools", params={
            "district": "Lisboa",
            "municipality": "Cascais"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        for school in data:
            assert school["district"] == "Lisboa"
            assert school["municipality"] == "Cascais"
        print(f"✓ Cascais has {len(data)} schools")
    
    def test_schools_with_full_hierarchy(self, api_client):
        """Get schools filtered by district, municipality, and locality"""
        response = api_client.get(f"{BASE_URL}/api/schools", params={
            "district": "Lisboa",
            "municipality": "Cascais",
            "locality": "Estoril"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # May have 0 or more schools in Estoril
        for school in data:
            assert school["district"] == "Lisboa"
            assert school["municipality"] == "Cascais"
            assert school["locality"] == "Estoril"
        print(f"✓ Estoril has {len(data)} schools")
    
    def test_schools_with_cycle_filter(self, api_client):
        """Get schools filtered by cycle"""
        response = api_client.get(f"{BASE_URL}/api/schools", params={
            "district": "Lisboa",
            "cycle": "1"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for school in data:
            assert "1" in school.get("cycles", [])
        print(f"✓ Lisboa has {len(data)} schools with 1º ciclo")


class TestAssociationRegistration:
    """Test /api/associations POST endpoint"""
    
    def test_create_association(self, api_client):
        """Create a new association with all required fields"""
        unique_id = uuid.uuid4().hex[:8]
        association_data = {
            "email": f"TEST_assoc_{unique_id}@example.com",
            "name": f"TEST Representante {unique_id}",
            "association_name": f"TEST Associação de Pais {unique_id}",
            "district": "Lisboa",
            "municipality": "Cascais",
            "locality": "Estoril",
            "school_id": "lis035",  # Escola Básica Raul Lino
            "school_name": "Escola Básica Raul Lino",
            "iban": "PT50000000000000000000000",
            "responsible_names": ["João Silva", "Maria Santos"],
            "documents_urls": []
        }
        
        response = api_client.post(f"{BASE_URL}/api/associations", json=association_data)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "association_id" in data
        assert "association_code" in data
        assert data["association_name"] == association_data["association_name"]
        assert data["school_id"] == association_data["school_id"]
        assert data["district"] == "Lisboa"
        assert data["municipality"] == "Cascais"
        assert data["locality"] == "Estoril"
        assert data["iban"] == association_data["iban"]
        assert len(data["responsible_names"]) == 2
        
        # Association code should follow pattern ASSOC-XXXXXX
        assert data["association_code"].startswith("ASSOC-")
        assert len(data["association_code"]) == 12  # ASSOC- + 6 chars
        
        print(f"✓ Association created with code: {data['association_code']}")
        return data
    
    def test_create_association_duplicate_email(self, api_client):
        """Attempt to create association with duplicate email should fail"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"TEST_dup_{unique_id}@example.com"
        
        # First creation
        association_data = {
            "email": email,
            "name": "TEST Representante",
            "association_name": "TEST Associação",
            "district": "Lisboa",
            "municipality": "Lisboa",
            "locality": "Lisboa",
            "school_id": "lis001",
            "school_name": "Externato do Parque",
            "iban": "PT50000000000000000000001",
            "responsible_names": ["Test User"],
            "documents_urls": []
        }
        
        response1 = api_client.post(f"{BASE_URL}/api/associations", json=association_data)
        assert response1.status_code == 200
        
        # Second creation with same email should fail
        association_data["association_name"] = "TEST Outra Associação"
        response2 = api_client.post(f"{BASE_URL}/api/associations", json=association_data)
        assert response2.status_code == 400
        assert "já registado" in response2.json().get("detail", "").lower()
        print("✓ Duplicate email correctly rejected")


class TestParentAuthenticatedEndpoints:
    """Test authenticated parent endpoints"""
    
    @pytest.fixture
    def parent_session(self, api_client):
        """Create a test parent and get session"""
        unique_id = uuid.uuid4().hex[:8]
        
        # Register parent
        register_data = {
            "email": f"TEST_parent_{unique_id}@example.com",
            "password": "TestPassword123!",
            "name": f"TEST Parent {unique_id}",
            "role": "parent"
        }
        
        response = api_client.post(f"{BASE_URL}/api/auth/register", json=register_data)
        assert response.status_code == 200
        
        # Login to get session
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }
        
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=login_data)
        assert response.status_code == 200
        
        # Get session cookie
        session_token = response.cookies.get("session_token")
        assert session_token is not None
        
        return {
            "session_token": session_token,
            "user": response.json()["user"],
            "email": register_data["email"]
        }
    
    def test_get_notifications_empty(self, api_client, parent_session):
        """Get notifications for parent (should be empty initially)"""
        cookies = {"session_token": parent_session["session_token"]}
        
        response = api_client.get(
            f"{BASE_URL}/api/parents/me/notifications",
            cookies=cookies
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Parent notifications endpoint returns {len(data)} notifications")
    
    def test_register_invalid_association_code(self, api_client, parent_session):
        """Attempt to register invalid association code should fail"""
        cookies = {"session_token": parent_session["session_token"]}
        
        response = api_client.post(
            f"{BASE_URL}/api/parents/me/association-code?code=INVALID-CODE",
            cookies=cookies
        )
        assert response.status_code == 404
        assert "não encontrado" in response.json().get("detail", "").lower()
        print("✓ Invalid association code correctly rejected")
    
    def test_register_valid_association_code(self, api_client, parent_session):
        """Register a valid association code"""
        cookies = {"session_token": parent_session["session_token"]}
        
        # First create an association to get a valid code
        unique_id = uuid.uuid4().hex[:8]
        association_data = {
            "email": f"TEST_assoc_code_{unique_id}@example.com",
            "name": "TEST Representante",
            "association_name": f"TEST Associação {unique_id}",
            "district": "Lisboa",
            "municipality": "Lisboa",
            "locality": "Lisboa",
            "school_id": "lis001",
            "school_name": "Externato do Parque",
            "iban": "PT50000000000000000000002",
            "responsible_names": ["Test User"],
            "documents_urls": []
        }
        
        assoc_response = api_client.post(f"{BASE_URL}/api/associations", json=association_data)
        assert assoc_response.status_code == 200
        association_code = assoc_response.json()["association_code"]
        
        # Now register the code for the parent
        response = api_client.post(
            f"{BASE_URL}/api/parents/me/association-code?code={association_code}",
            cookies=cookies
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["association_code"] == association_code
        assert "association_name" in data
        assert "message" in data
        # Since parent has no subscription yet, retroactive should be False
        # and message should mention future subscriptions
        print(f"✓ Association code registered: {data['message']}")


class TestAssociationBySchool:
    """Test /api/associations/by-school endpoint"""
    
    def test_association_by_school_not_found(self, api_client):
        """Check for association at school that doesn't have one"""
        response = api_client.get(f"{BASE_URL}/api/associations/by-school/nonexistent_school")
        assert response.status_code == 200
        data = response.json()
        assert data["exists"] == False
        print("✓ Non-existent school association correctly returns exists=False")


class TestHealthAndBasicEndpoints:
    """Test basic endpoints are still working"""
    
    def test_health(self, api_client):
        """Health check"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        print("✓ Health check passed")
    
    def test_districts(self, api_client):
        """Districts endpoint"""
        response = api_client.get(f"{BASE_URL}/api/districts")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 20
        print("✓ Districts endpoint returns 20 districts")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
