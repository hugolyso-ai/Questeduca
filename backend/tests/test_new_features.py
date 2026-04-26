"""
Test suite for new QUESTEDUCA features:
- Daily Streak system
- Isometric City RTS
- Battle & Social system
- Portugal Map
- Quiz generation via Claude
- Rankings endpoints
- Admin dashboard access
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://edu-empire-1.preview.emergentagent.com').rstrip('/')

# Test credentials from review request
STUDENT_EMAIL = "aluno@teste.pt"
STUDENT_PASSWORD = "Aluno1234*"
ADMIN_EMAIL = "info@serv2all.pt"
ADMIN_PASSWORD = "Quest1234*"


class TestAuthentication:
    """Test authentication flows"""
    
    def test_student_login(self):
        """Test student login with provided credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": STUDENT_EMAIL,
            "password": STUDENT_PASSWORD
        })
        
        if response.status_code == 401:
            # Student might not exist, create it
            print(f"Student login failed (401) - student may not exist yet")
            pytest.skip("Student account not found - needs seeding")
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "session_token" in data
        assert "user" in data
        assert data["user"]["role"] == "student"
        print(f"Student login successful: {data['user']['email']}")
        return data["session_token"]
    
    def test_admin_login(self):
        """Test admin login with provided credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "session_token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        print(f"Admin login successful: {data['user']['email']}")
        return data["session_token"]


class TestStreakSystem:
    """Test Daily Streak endpoints"""
    
    @pytest.fixture
    def student_session(self):
        """Get authenticated student session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": STUDENT_EMAIL,
            "password": STUDENT_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Student account not available")
        return requests.Session(), response.cookies
    
    def test_streak_status_endpoint(self, student_session):
        """Test GET /api/streak/status returns streak data"""
        session, cookies = student_session
        response = session.get(f"{BASE_URL}/api/streak/status", cookies=cookies)
        
        assert response.status_code == 200, f"Streak status failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "current_streak" in data
        assert "longest_streak" in data
        assert "bonus_available" in data
        assert "next_bonus" in data
        assert "streak_active" in data
        
        print(f"Streak status: current={data['current_streak']}, longest={data['longest_streak']}, bonus_available={data['bonus_available']}")
    
    def test_streak_status_requires_auth(self):
        """Test streak status requires authentication"""
        response = requests.get(f"{BASE_URL}/api/streak/status")
        assert response.status_code == 401, "Streak status should require auth"
    
    def test_streak_claim_requires_auth(self):
        """Test streak claim requires authentication"""
        response = requests.post(f"{BASE_URL}/api/streak/claim")
        assert response.status_code == 401, "Streak claim should require auth"


class TestGameState:
    """Test Game State and Isometric City endpoints"""
    
    @pytest.fixture
    def student_session(self):
        """Get authenticated student session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": STUDENT_EMAIL,
            "password": STUDENT_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Student account not available")
        return requests.Session(), response.cookies
    
    def test_game_state_endpoint(self, student_session):
        """Test GET /api/game/state returns full game state"""
        session, cookies = student_session
        response = session.get(f"{BASE_URL}/api/game/state", cookies=cookies)
        
        assert response.status_code == 200, f"Game state failed: {response.text}"
        data = response.json()
        
        # Verify core game state fields
        assert "coins" in data
        assert "diamonds" in data
        assert "xp" in data
        assert "level" in data
        
        # Verify RTS resources
        assert "resources" in data
        resources = data["resources"]
        assert "wood" in resources
        assert "stone" in resources
        assert "iron" in resources
        assert "food" in resources
        
        # Verify buildings structure
        assert "buildings" in data
        buildings = data["buildings"]
        assert "town_hall" in buildings
        
        # Verify city stats
        assert "population" in data
        assert "max_population" in data
        assert "defense_power" in data
        assert "attack_power" in data
        
        print(f"Game state: coins={data['coins']}, diamonds={data['diamonds']}, level={data['level']}")
        print(f"Resources: wood={resources['wood']}, stone={resources['stone']}, iron={resources['iron']}, food={resources['food']}")
        print(f"City stats: pop={data['population']}/{data['max_population']}, defense={data['defense_power']}, attack={data['attack_power']}")
    
    def test_building_info_endpoint(self, student_session):
        """Test GET /api/game/building-info returns building configurations"""
        session, cookies = student_session
        response = session.get(f"{BASE_URL}/api/game/building-info", cookies=cookies)
        
        assert response.status_code == 200, f"Building info failed: {response.text}"
        data = response.json()
        
        # Verify building types exist
        expected_buildings = ["town_hall", "house", "school", "library", "market", "farm", "lumber_mill", "quarry", "mine", "barracks", "wall", "garden"]
        for building in expected_buildings:
            assert building in data, f"Missing building: {building}"
            assert "name" in data[building]
            assert "description" in data[building]
            assert "icon" in data[building]
            assert "max_level" in data[building]
            assert "base_cost" in data[building]
        
        print(f"Building info: {len(data)} buildings configured")


class TestBattleSystem:
    """Test Battle & Social endpoints"""
    
    @pytest.fixture
    def student_session(self):
        """Get authenticated student session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": STUDENT_EMAIL,
            "password": STUDENT_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Student account not available")
        return requests.Session(), response.cookies
    
    def test_raid_history_endpoint(self, student_session):
        """Test GET /api/game/raid-history returns raid history"""
        session, cookies = student_session
        response = session.get(f"{BASE_URL}/api/game/raid-history", cookies=cookies)
        
        assert response.status_code == 200, f"Raid history failed: {response.text}"
        data = response.json()
        
        # Should return a list (may be empty)
        assert isinstance(data, list)
        print(f"Raid history: {len(data)} raids found")
    
    def test_visit_permissions_endpoint(self, student_session):
        """Test GET /api/game/visit-permissions returns visit permissions"""
        session, cookies = student_session
        response = session.get(f"{BASE_URL}/api/game/visit-permissions", cookies=cookies)
        
        assert response.status_code == 200, f"Visit permissions failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "sent" in data
        assert "received" in data
        assert isinstance(data["sent"], list)
        assert isinstance(data["received"], list)
        
        print(f"Visit permissions: {len(data['sent'])} sent, {len(data['received'])} received")


class TestQuizGeneration:
    """Test Quiz generation via Claude Sonnet"""
    
    @pytest.fixture
    def student_session(self):
        """Get authenticated student session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": STUDENT_EMAIL,
            "password": STUDENT_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Student account not available")
        return requests.Session(), response.cookies
    
    def test_quiz_generate_endpoint(self, student_session):
        """Test GET /api/quiz/generate creates quiz with Claude"""
        session, cookies = student_session
        response = session.get(f"{BASE_URL}/api/quiz/generate", params={
            "school_year": "1",
            "subject": "Matemática",
            "count": 3
        }, cookies=cookies, timeout=60)  # Longer timeout for LLM
        
        assert response.status_code == 200, f"Quiz generate failed: {response.text}"
        data = response.json()
        
        # Verify quiz structure
        assert "quiz_id" in data
        assert "school_year" in data
        assert "subject" in data
        assert "questions" in data
        assert len(data["questions"]) > 0
        
        # Verify question structure
        question = data["questions"][0]
        assert "question_text" in question
        assert "options" in question
        assert "correct_answer" in question
        assert len(question["options"]) >= 2
        
        print(f"Quiz generated: {len(data['questions'])} questions for {data['subject']}")
        print(f"Sample question: {question['question_text'][:100]}...")
    
    def test_subjects_endpoint(self):
        """Test GET /api/subjects/{year} returns subjects list"""
        response = requests.get(f"{BASE_URL}/api/subjects/1")
        
        assert response.status_code == 200, f"Subjects failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"Subjects for year 1: {data}")


class TestRankings:
    """Test Rankings endpoints"""
    
    @pytest.fixture
    def student_session(self):
        """Get authenticated student session"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": STUDENT_EMAIL,
            "password": STUDENT_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Student account not available")
        return requests.Session(), response.cookies
    
    def test_national_ranking_endpoint(self, student_session):
        """Test GET /api/rankings/national returns national rankings"""
        session, cookies = student_session
        response = session.get(f"{BASE_URL}/api/rankings/national", cookies=cookies)
        
        assert response.status_code == 200, f"National ranking failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "ranking_type" in data
        assert data["ranking_type"] == "national"
        assert "entries" in data
        assert "total_players" in data
        
        print(f"National ranking: {len(data['entries'])} entries, {data['total_players']} total players")
    
    def test_district_ranking_endpoint(self, student_session):
        """Test GET /api/rankings/district/{district} returns district rankings"""
        session, cookies = student_session
        response = session.get(f"{BASE_URL}/api/rankings/district/Lisboa", cookies=cookies)
        
        assert response.status_code == 200, f"District ranking failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "ranking_type" in data
        assert data["ranking_type"] == "district"
        assert "entries" in data
        
        print(f"District ranking (Lisboa): {len(data['entries'])} entries")


class TestAdminDashboard:
    """Test Admin dashboard access"""
    
    def test_admin_login_and_access(self):
        """Test admin can login and access admin endpoints"""
        # Login as admin
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert data["user"]["role"] == "admin"
        
        # Get session cookies
        cookies = response.cookies
        
        # Test admin can access auth/me
        me_response = requests.get(f"{BASE_URL}/api/auth/me", cookies=cookies)
        assert me_response.status_code == 200, f"Admin auth/me failed: {me_response.text}"
        
        print(f"Admin access verified: {data['user']['email']}")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
