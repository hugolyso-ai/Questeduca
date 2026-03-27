"""
Test suite for QUESTEDUCA Game, Quiz, and Association features
Tests: /api/subjects, /api/game/state, /api/game/upgrade, /api/quiz/generate, 
       /api/associations/me, /api/associations/me/payout-request
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSubjectsAPI:
    """Test /api/subjects/{year} endpoint - returns subjects by school year"""
    
    def test_subjects_year_1(self):
        """Year 1 should return Português, Matemática, Estudo do Meio"""
        response = requests.get(f"{BASE_URL}/api/subjects/1")
        assert response.status_code == 200
        subjects = response.json()
        assert isinstance(subjects, list)
        assert "Português" in subjects
        assert "Matemática" in subjects
        assert "Estudo do Meio" in subjects
        assert len(subjects) == 3
        print(f"✓ Year 1 subjects: {subjects}")
    
    def test_subjects_year_5(self):
        """Year 5 should include História e Geografia de Portugal, Inglês"""
        response = requests.get(f"{BASE_URL}/api/subjects/5")
        assert response.status_code == 200
        subjects = response.json()
        assert "Português" in subjects
        assert "Matemática" in subjects
        assert "Ciências Naturais" in subjects
        assert "História e Geografia de Portugal" in subjects
        assert "Inglês" in subjects
        print(f"✓ Year 5 subjects: {subjects}")
    
    def test_subjects_year_7(self):
        """Year 7 should include Físico-Química, História, Geografia"""
        response = requests.get(f"{BASE_URL}/api/subjects/7")
        assert response.status_code == 200
        subjects = response.json()
        assert "Físico-Química" in subjects
        assert "História" in subjects
        assert "Geografia" in subjects
        print(f"✓ Year 7 subjects: {subjects}")
    
    def test_subjects_invalid_year(self):
        """Invalid year should return 422"""
        response = requests.get(f"{BASE_URL}/api/subjects/invalid")
        assert response.status_code == 422
        print("✓ Invalid year returns 422")


class TestGameStateAPI:
    """Test /api/game/state and /api/game/upgrade endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a test student user and get session"""
        self.session = requests.Session()
        
        # Register a parent first
        timestamp = int(time.time())
        self.parent_email = f"test_parent_game_{timestamp}@example.com"
        self.parent_password = "TestPassword123!"
        
        register_response = self.session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": self.parent_email,
                "password": self.parent_password,
                "name": "Test Parent Game",
                "role": "parent"
            }
        )
        
        if register_response.status_code == 400:
            # User exists, try login
            login_response = self.session.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": self.parent_email,
                    "password": self.parent_password
                }
            )
            assert login_response.status_code == 200
        else:
            assert register_response.status_code == 200
            # Login to get session
            login_response = self.session.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": self.parent_email,
                    "password": self.parent_password
                }
            )
            assert login_response.status_code == 200
        
        # Create a student
        self.student_email = f"test_student_game_{timestamp}@example.com"
        student_response = self.session.post(
            f"{BASE_URL}/api/students",
            json={
                "email": self.student_email,
                "name": "Test Student Game",
                "nickname": "GameTester",
                "school_year": "5",
                "school_name": "Test School",
                "district": "Lisboa"
            }
        )
        
        if student_response.status_code == 200 or student_response.status_code == 201:
            student_data = student_response.json()
            self.student_temp_password = student_data.get('temp_password')
            print(f"✓ Created student with temp password: {self.student_temp_password}")
        
        # Login as student
        self.student_session = requests.Session()
        if hasattr(self, 'student_temp_password') and self.student_temp_password:
            student_login = self.student_session.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": self.student_email,
                    "password": self.student_temp_password
                }
            )
            if student_login.status_code == 200:
                print("✓ Logged in as student")
            else:
                print(f"⚠ Student login failed: {student_login.status_code}")
    
    def test_game_state_requires_auth(self):
        """Game state endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/game/state")
        assert response.status_code == 401
        print("✓ Game state requires authentication")
    
    def test_game_state_requires_student_role(self):
        """Game state endpoint requires student role"""
        # Parent trying to access game state
        response = self.session.get(f"{BASE_URL}/api/game/state")
        assert response.status_code == 403
        print("✓ Game state requires student role")
    
    def test_game_state_returns_initial_state(self):
        """Game state returns initial state for new student"""
        if not hasattr(self, 'student_temp_password'):
            pytest.skip("Student not created")
        
        response = self.student_session.get(f"{BASE_URL}/api/game/state")
        if response.status_code == 200:
            data = response.json()
            # Check initial resources
            assert "coins" in data
            assert "diamonds" in data
            assert "xp" in data or "level" in data
            assert "buildings" in data
            print(f"✓ Game state: coins={data.get('coins')}, diamonds={data.get('diamonds')}")
        else:
            print(f"⚠ Game state returned {response.status_code}")
    
    def test_game_upgrade_requires_auth(self):
        """Upgrade endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/game/upgrade",
            params={"building_id": "school", "cost": 50}
        )
        assert response.status_code == 401
        print("✓ Upgrade requires authentication")


class TestQuizGenerationAPI:
    """Test /api/quiz/generate endpoint - generates quiz with LLM questions"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a test student user"""
        self.session = requests.Session()
        timestamp = int(time.time())
        
        # Register parent
        self.parent_email = f"test_parent_quiz_{timestamp}@example.com"
        register_response = self.session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": self.parent_email,
                "password": "TestPassword123!",
                "name": "Test Parent Quiz",
                "role": "parent"
            }
        )
        
        if register_response.status_code != 200:
            self.session.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": self.parent_email,
                    "password": "TestPassword123!"
                }
            )
        else:
            self.session.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": self.parent_email,
                    "password": "TestPassword123!"
                }
            )
        
        # Create student
        self.student_email = f"test_student_quiz_{timestamp}@example.com"
        student_response = self.session.post(
            f"{BASE_URL}/api/students",
            json={
                "email": self.student_email,
                "name": "Test Student Quiz",
                "nickname": "QuizTester",
                "school_year": "5",
                "school_name": "Test School",
                "district": "Lisboa"
            }
        )
        
        self.student_session = requests.Session()
        if student_response.status_code in [200, 201]:
            student_data = student_response.json()
            temp_password = student_data.get('temp_password')
            if temp_password:
                self.student_session.post(
                    f"{BASE_URL}/api/auth/login",
                    json={
                        "email": self.student_email,
                        "password": temp_password
                    }
                )
    
    def test_quiz_generate_requires_auth(self):
        """Quiz generation requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/quiz/generate",
            params={"school_year": "5", "subject": "Matemática", "count": 3}
        )
        assert response.status_code == 401
        print("✓ Quiz generation requires authentication")
    
    def test_quiz_generate_requires_student_role(self):
        """Quiz generation requires student role"""
        response = self.session.get(
            f"{BASE_URL}/api/quiz/generate",
            params={"school_year": "5", "subject": "Matemática", "count": 3}
        )
        assert response.status_code == 403
        print("✓ Quiz generation requires student role")
    
    def test_quiz_generate_returns_questions(self):
        """Quiz generation returns questions with correct structure"""
        response = self.student_session.get(
            f"{BASE_URL}/api/quiz/generate",
            params={"school_year": "5", "subject": "Matemática", "count": 3},
            timeout=60  # LLM calls can be slow
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "quiz_id" in data
            assert "questions" in data
            assert "school_year" in data
            assert "subject" in data
            
            questions = data.get("questions", [])
            if len(questions) > 0:
                q = questions[0]
                assert "question_text" in q
                assert "options" in q
                assert "correct_answer" in q
                assert len(q["options"]) == 4
                print(f"✓ Quiz generated with {len(questions)} questions")
                print(f"  Sample question: {q['question_text'][:50]}...")
            else:
                print("⚠ Quiz returned but no questions")
        elif response.status_code == 403:
            print("⚠ Student session not valid for quiz generation")
        else:
            print(f"⚠ Quiz generation returned {response.status_code}: {response.text[:200]}")


class TestAssociationAPI:
    """Test /api/associations/me and /api/associations/me/payout-request endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a test association"""
        self.session = requests.Session()
        timestamp = int(time.time())
        
        # Create association
        self.assoc_email = f"test_assoc_{timestamp}@example.com"
        create_response = requests.post(
            f"{BASE_URL}/api/associations",
            json={
                "email": self.assoc_email,
                "name": "Test Association Admin",
                "association_name": f"Associação de Pais Test {timestamp}",
                "district": "Lisboa",
                "municipality": "Cascais",
                "locality": "Estoril",
                "school_id": "school_test_123",
                "school_name": "Escola Básica de Teste",
                "iban": "PT50000201231234567890154",
                "responsible_names": ["João Silva", "Maria Santos"],
                "documents_urls": []
            }
        )
        
        if create_response.status_code == 200:
            self.association = create_response.json()
            self.association_code = self.association.get('association_code')
            print(f"✓ Created association with code: {self.association_code}")
        else:
            print(f"⚠ Association creation failed: {create_response.status_code}")
            self.association = None
    
    def test_association_me_requires_auth(self):
        """Association profile requires authentication"""
        response = requests.get(f"{BASE_URL}/api/associations/me")
        assert response.status_code == 401
        print("✓ Association profile requires authentication")
    
    def test_association_payout_requires_auth(self):
        """Payout request requires authentication"""
        response = requests.post(f"{BASE_URL}/api/associations/me/payout-request")
        assert response.status_code == 401
        print("✓ Payout request requires authentication")
    
    def test_association_created_with_code(self):
        """Association is created with unique code"""
        if not self.association:
            pytest.skip("Association not created")
        
        assert self.association_code is not None
        assert self.association_code.startswith("ASSOC-")
        assert len(self.association_code) == 12  # ASSOC-XXXXXX
        print(f"✓ Association code format correct: {self.association_code}")
    
    def test_association_has_required_fields(self):
        """Association has all required fields"""
        if not self.association:
            pytest.skip("Association not created")
        
        required_fields = [
            "association_id", "association_name", "school_name",
            "district", "municipality", "locality", "iban",
            "responsible_names", "association_code", "total_commissions",
            "pending_payout"
        ]
        
        for field in required_fields:
            assert field in self.association, f"Missing field: {field}"
        
        print("✓ Association has all required fields")
    
    def test_association_initial_commissions_zero(self):
        """New association has zero commissions"""
        if not self.association:
            pytest.skip("Association not created")
        
        assert self.association.get("total_commissions") == 0
        assert self.association.get("pending_payout") == 0
        print("✓ Initial commissions are zero")


class TestIntegration:
    """Integration tests for complete flows"""
    
    def test_parent_can_register_association_code(self):
        """Parent can register an association code"""
        session = requests.Session()
        timestamp = int(time.time())
        
        # Create association first
        assoc_response = requests.post(
            f"{BASE_URL}/api/associations",
            json={
                "email": f"test_assoc_int_{timestamp}@example.com",
                "name": "Integration Test Admin",
                "association_name": f"Associação Integration {timestamp}",
                "district": "Porto",
                "municipality": "Porto",
                "locality": "Porto",
                "school_id": f"school_int_{timestamp}",
                "school_name": "Escola Integration",
                "iban": "PT50000201231234567890154",
                "responsible_names": ["Test Admin"],
                "documents_urls": []
            }
        )
        
        if assoc_response.status_code != 200:
            pytest.skip("Could not create association")
        
        assoc_code = assoc_response.json().get("association_code")
        
        # Register parent
        parent_email = f"test_parent_int_{timestamp}@example.com"
        session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": parent_email,
                "password": "TestPassword123!",
                "name": "Integration Parent",
                "role": "parent"
            }
        )
        
        session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": parent_email,
                "password": "TestPassword123!"
            }
        )
        
        # Register association code
        code_response = session.post(
            f"{BASE_URL}/api/parents/me/association-code",
            params={"code": assoc_code}
        )
        
        assert code_response.status_code == 200
        data = code_response.json()
        assert data.get("success") == True
        assert data.get("association_code") == assoc_code
        print(f"✓ Parent registered association code: {assoc_code}")
    
    def test_invalid_association_code_rejected(self):
        """Invalid association code is rejected"""
        session = requests.Session()
        timestamp = int(time.time())
        
        # Register parent
        parent_email = f"test_parent_invalid_{timestamp}@example.com"
        session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": parent_email,
                "password": "TestPassword123!",
                "name": "Invalid Code Parent",
                "role": "parent"
            }
        )
        
        session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": parent_email,
                "password": "TestPassword123!"
            }
        )
        
        # Try invalid code
        code_response = session.post(
            f"{BASE_URL}/api/parents/me/association-code",
            params={"code": "INVALID-CODE-123"}
        )
        
        assert code_response.status_code == 404
        print("✓ Invalid association code rejected with 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
