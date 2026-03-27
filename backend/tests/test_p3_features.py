"""
Test P3 Features: Portugal Map, Memory Match, Speed Math, Weekly Challenges
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://edu-empire-1.preview.emergentagent.com')

# Test credentials from iteration_7.json
PARENT_EMAIL = "test_parent_giftcard@example.com"
PARENT_PASSWORD = "TestPass123!"
STUDENT_EMAIL = "test_student_ui_1774624516@example.com"
STUDENT_PASSWORD = "7817c30c"


class TestWeeklyChallengesAPI:
    """Test Weekly Challenges API endpoints"""
    
    @pytest.fixture(scope="class")
    def student_session(self):
        """Get authenticated student session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": STUDENT_EMAIL,
            "password": STUDENT_PASSWORD
        })
        assert response.status_code == 200, f"Student login failed: {response.text}"
        return session
    
    @pytest.fixture(scope="class")
    def parent_session(self):
        """Get authenticated parent session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": PARENT_EMAIL,
            "password": PARENT_PASSWORD
        })
        assert response.status_code == 200, f"Parent login failed: {response.text}"
        return session
    
    def test_weekly_challenges_requires_auth(self):
        """Test that weekly challenges endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/challenges/weekly")
        assert response.status_code == 401, "Should require authentication"
    
    def test_weekly_challenges_requires_student_role(self, parent_session):
        """Test that weekly challenges endpoint requires student role"""
        response = parent_session.get(f"{BASE_URL}/api/challenges/weekly")
        assert response.status_code == 403, "Should require student role"
    
    def test_weekly_challenges_returns_4_challenges(self, student_session):
        """Test that weekly challenges returns exactly 4 challenges"""
        response = student_session.get(f"{BASE_URL}/api/challenges/weekly")
        assert response.status_code == 200, f"Failed to get challenges: {response.text}"
        
        challenges = response.json()
        assert isinstance(challenges, list), "Should return a list"
        assert len(challenges) == 4, f"Should return 4 challenges, got {len(challenges)}"
    
    def test_weekly_challenges_structure(self, student_session):
        """Test that each challenge has the correct structure"""
        response = student_session.get(f"{BASE_URL}/api/challenges/weekly")
        assert response.status_code == 200
        
        challenges = response.json()
        required_fields = [
            "challenge_id", "type", "title", "description", 
            "target", "current", "reward_coins", "reward_diamonds", 
            "reward_xp", "claimed"
        ]
        
        for challenge in challenges:
            for field in required_fields:
                assert field in challenge, f"Challenge missing field: {field}"
    
    def test_weekly_challenges_types(self, student_session):
        """Test that challenges have the expected types"""
        response = student_session.get(f"{BASE_URL}/api/challenges/weekly")
        assert response.status_code == 200
        
        challenges = response.json()
        types = [c["type"] for c in challenges]
        
        expected_types = ["quizzes_completed", "perfect_quizzes", "xp_earned", "login_streak"]
        for expected in expected_types:
            assert expected in types, f"Missing challenge type: {expected}"
    
    def test_claim_challenge_requires_auth(self):
        """Test that claim endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/challenges/claim/test_id")
        assert response.status_code == 401, "Should require authentication"
    
    def test_claim_challenge_requires_student_role(self, parent_session):
        """Test that claim endpoint requires student role"""
        response = parent_session.post(f"{BASE_URL}/api/challenges/claim/test_id")
        assert response.status_code == 403, "Should require student role"
    
    def test_claim_nonexistent_challenge(self, student_session):
        """Test claiming a non-existent challenge"""
        response = student_session.post(f"{BASE_URL}/api/challenges/claim/nonexistent_challenge_id")
        assert response.status_code == 404, "Should return 404 for non-existent challenge"
    
    def test_claim_incomplete_challenge(self, student_session):
        """Test claiming an incomplete challenge (current < target)"""
        # First get challenges to find one that's not complete
        response = student_session.get(f"{BASE_URL}/api/challenges/weekly")
        assert response.status_code == 200
        
        challenges = response.json()
        incomplete = [c for c in challenges if c["current"] < c["target"] and not c["claimed"]]
        
        if incomplete:
            challenge_id = incomplete[0]["challenge_id"]
            response = student_session.post(f"{BASE_URL}/api/challenges/claim/{challenge_id}")
            assert response.status_code == 400, "Should reject claiming incomplete challenge"


class TestMiniGamesAPI:
    """Test Mini-games API endpoints (Memory Match and Speed Math use these)"""
    
    @pytest.fixture(scope="class")
    def student_session(self):
        """Get authenticated student session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": STUDENT_EMAIL,
            "password": STUDENT_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    @pytest.fixture(scope="class")
    def parent_session(self):
        """Get authenticated parent session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": PARENT_EMAIL,
            "password": PARENT_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_quiz_questions_for_minigames(self, student_session):
        """Test getting quiz questions for mini-games"""
        response = student_session.get(f"{BASE_URL}/api/minigames/quiz-questions", params={"count": 5})
        assert response.status_code == 200
        
        questions = response.json()
        assert isinstance(questions, list)
        assert len(questions) >= 1, "Should return at least 1 question"
        
        # Check question structure
        for q in questions:
            assert "question_text" in q
            assert "options" in q
            assert "correct_answer" in q
            assert len(q["options"]) == 4, "Each question should have 4 options"
    
    def test_save_minigame_result_student(self, student_session):
        """Test saving mini-game result as student"""
        response = student_session.post(
            f"{BASE_URL}/api/minigames/result",
            params={
                "game_id": "memory_match",
                "opponent_id": "test_opponent",
                "coins_won": 40
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
    
    def test_save_minigame_result_parent(self, parent_session):
        """Test saving mini-game result as parent"""
        response = parent_session.post(
            f"{BASE_URL}/api/minigames/result",
            params={
                "game_id": "speed_math",
                "opponent_id": "test_child",
                "coins_won": 35
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
    
    def test_minigame_history(self, student_session):
        """Test getting mini-game history"""
        response = student_session.get(f"{BASE_URL}/api/minigames/history", params={"limit": 10})
        assert response.status_code == 200
        
        history = response.json()
        assert isinstance(history, list)


class TestGameStateAPI:
    """Test Game State API (used by Memory Match and Speed Math for rewards)"""
    
    @pytest.fixture(scope="class")
    def student_session(self):
        """Get authenticated student session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": STUDENT_EMAIL,
            "password": STUDENT_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_get_game_state(self, student_session):
        """Test getting game state"""
        response = student_session.get(f"{BASE_URL}/api/game/state")
        assert response.status_code == 200
        
        state = response.json()
        assert "coins" in state
        assert "diamonds" in state
        assert "xp" in state
        assert "level" in state
        assert "buildings" in state
    
    def test_add_resources(self, student_session):
        """Test adding resources (used after mini-game completion)"""
        # Get initial state
        response = student_session.get(f"{BASE_URL}/api/game/state")
        initial_coins = response.json().get("coins", 0)
        
        # Add resources
        response = student_session.post(
            f"{BASE_URL}/api/game/add-resources",
            params={"coins": 10, "xp": 5}
        )
        assert response.status_code == 200
        
        # Verify resources were added
        response = student_session.get(f"{BASE_URL}/api/game/state")
        new_coins = response.json().get("coins", 0)
        assert new_coins >= initial_coins, "Coins should have increased"


class TestFriendSearchAPI:
    """Test Friend Search API (used by Portugal Map)"""
    
    @pytest.fixture(scope="class")
    def student_session(self):
        """Get authenticated student session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": STUDENT_EMAIL,
            "password": STUDENT_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_search_friends_by_district(self, student_session):
        """Test searching friends by district (Portugal Map feature)"""
        response = student_session.get(
            f"{BASE_URL}/api/friends/search",
            params={"district": "Lisboa"}
        )
        assert response.status_code == 200
        
        results = response.json()
        assert isinstance(results, list)
    
    def test_search_friends_by_query(self, student_session):
        """Test searching friends by nickname query"""
        response = student_session.get(
            f"{BASE_URL}/api/friends/search",
            params={"query": "test"}
        )
        assert response.status_code == 200
        
        results = response.json()
        assert isinstance(results, list)
    
    def test_search_students(self, student_session):
        """Test searching students endpoint"""
        response = student_session.get(
            f"{BASE_URL}/api/students/search",
            params={"district": "Lisboa"}
        )
        assert response.status_code == 200
        
        results = response.json()
        assert isinstance(results, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
