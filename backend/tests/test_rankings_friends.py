"""
Test suite for QUESTEDUCA Rankings and Friends features
Tests: /api/rankings/national, /api/rankings/district/{district}, /api/rankings/school/{school_id}
       /api/friends/my, /api/friends/search, /api/friends/request
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestRankingsAPI:
    """Test /api/rankings endpoints - national, district, school rankings"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create test student user for rankings tests"""
        self.session = requests.Session()
        timestamp = int(time.time())
        
        # Register parent
        self.parent_email = f"test_parent_rank_{timestamp}@example.com"
        self.parent_password = "TestPassword123!"
        
        register_response = self.session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": self.parent_email,
                "password": self.parent_password,
                "name": "Test Parent Rankings",
                "role": "parent"
            }
        )
        
        if register_response.status_code == 400:
            self.session.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": self.parent_email,
                    "password": self.parent_password
                }
            )
        else:
            self.session.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": self.parent_email,
                    "password": self.parent_password
                }
            )
        
        # Create student
        self.student_email = f"test_student_rank_{timestamp}@example.com"
        student_response = self.session.post(
            f"{BASE_URL}/api/students",
            json={
                "email": self.student_email,
                "name": "Test Student Rankings",
                "nickname": f"RankTester{timestamp}",
                "school_year": "5",
                "school_name": "Escola de Teste Rankings",
                "district": "Lisboa"
            }
        )
        
        self.student_session = requests.Session()
        self.student_logged_in = False
        
        if student_response.status_code in [200, 201]:
            student_data = student_response.json()
            self.temp_password = student_data.get('temp_password')
            if self.temp_password:
                login_response = self.student_session.post(
                    f"{BASE_URL}/api/auth/login",
                    json={
                        "email": self.student_email,
                        "password": self.temp_password
                    }
                )
                if login_response.status_code == 200:
                    self.student_logged_in = True
                    print(f"✓ Student logged in for rankings tests")
    
    def test_national_ranking_requires_auth(self):
        """National ranking requires authentication"""
        response = requests.get(f"{BASE_URL}/api/rankings/national")
        assert response.status_code == 401
        print("✓ National ranking requires authentication")
    
    def test_national_ranking_requires_student_role(self):
        """National ranking requires student role"""
        response = self.session.get(f"{BASE_URL}/api/rankings/national")
        assert response.status_code == 403
        print("✓ National ranking requires student role")
    
    def test_national_ranking_returns_data(self):
        """National ranking returns ranking data for student"""
        if not self.student_logged_in:
            pytest.skip("Student not logged in")
        
        response = self.student_session.get(f"{BASE_URL}/api/rankings/national")
        assert response.status_code == 200
        
        data = response.json()
        assert "ranking_type" in data
        assert data["ranking_type"] == "national"
        assert "entries" in data
        assert "total_players" in data
        assert isinstance(data["entries"], list)
        
        # Check entry structure if there are entries
        if len(data["entries"]) > 0:
            entry = data["entries"][0]
            assert "rank" in entry
            assert "user_id" in entry
            assert "nickname" in entry
            assert "xp" in entry
            assert "settlement_level" in entry
            print(f"✓ National ranking returned {len(data['entries'])} entries")
        else:
            print("✓ National ranking returned empty list (no students yet)")
    
    def test_district_ranking_requires_auth(self):
        """District ranking requires authentication"""
        response = requests.get(f"{BASE_URL}/api/rankings/district/Lisboa")
        assert response.status_code == 401
        print("✓ District ranking requires authentication")
    
    def test_district_ranking_returns_data(self):
        """District ranking returns ranking data for student"""
        if not self.student_logged_in:
            pytest.skip("Student not logged in")
        
        response = self.student_session.get(f"{BASE_URL}/api/rankings/district/Lisboa")
        assert response.status_code == 200
        
        data = response.json()
        assert "ranking_type" in data
        assert data["ranking_type"] == "district"
        assert data["filter_value"] == "Lisboa"
        assert "entries" in data
        assert isinstance(data["entries"], list)
        print(f"✓ District ranking (Lisboa) returned {len(data['entries'])} entries")
    
    def test_school_ranking_requires_auth(self):
        """School ranking requires authentication"""
        response = requests.get(f"{BASE_URL}/api/rankings/school/test_school_123")
        assert response.status_code == 401
        print("✓ School ranking requires authentication")
    
    def test_school_ranking_returns_data(self):
        """School ranking returns ranking data for student"""
        if not self.student_logged_in:
            pytest.skip("Student not logged in")
        
        response = self.student_session.get(f"{BASE_URL}/api/rankings/school/default")
        assert response.status_code == 200
        
        data = response.json()
        assert "ranking_type" in data
        assert data["ranking_type"] == "school"
        assert "entries" in data
        assert isinstance(data["entries"], list)
        print(f"✓ School ranking returned {len(data['entries'])} entries")


class TestFriendsAPI:
    """Test /api/friends endpoints - my friends, search, request"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create test student users for friends tests"""
        self.session = requests.Session()
        timestamp = int(time.time())
        
        # Register parent
        self.parent_email = f"test_parent_friend_{timestamp}@example.com"
        self.parent_password = "TestPassword123!"
        
        register_response = self.session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": self.parent_email,
                "password": self.parent_password,
                "name": "Test Parent Friends",
                "role": "parent"
            }
        )
        
        if register_response.status_code == 400:
            self.session.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": self.parent_email,
                    "password": self.parent_password
                }
            )
        else:
            self.session.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": self.parent_email,
                    "password": self.parent_password
                }
            )
        
        # Create first student
        self.student1_email = f"test_student1_friend_{timestamp}@example.com"
        student1_response = self.session.post(
            f"{BASE_URL}/api/students",
            json={
                "email": self.student1_email,
                "name": "Test Student 1 Friends",
                "nickname": f"FriendTester1_{timestamp}",
                "school_year": "5",
                "school_name": "Escola de Teste Friends",
                "district": "Lisboa"
            }
        )
        
        self.student1_session = requests.Session()
        self.student1_logged_in = False
        self.student1_user_id = None
        
        if student1_response.status_code in [200, 201]:
            student1_data = student1_response.json()
            self.temp_password1 = student1_data.get('temp_password')
            self.student1_user_id = student1_data.get('user_id')
            if self.temp_password1:
                login_response = self.student1_session.post(
                    f"{BASE_URL}/api/auth/login",
                    json={
                        "email": self.student1_email,
                        "password": self.temp_password1
                    }
                )
                if login_response.status_code == 200:
                    self.student1_logged_in = True
                    print(f"✓ Student 1 logged in for friends tests")
        
        # Create second student (for friend request target)
        self.student2_email = f"test_student2_friend_{timestamp}@example.com"
        student2_response = self.session.post(
            f"{BASE_URL}/api/students",
            json={
                "email": self.student2_email,
                "name": "Test Student 2 Friends",
                "nickname": f"FriendTester2_{timestamp}",
                "school_year": "5",
                "school_name": "Escola de Teste Friends",
                "district": "Lisboa"
            }
        )
        
        self.student2_user_id = None
        if student2_response.status_code in [200, 201]:
            student2_data = student2_response.json()
            self.student2_user_id = student2_data.get('user_id')
            print(f"✓ Student 2 created for friend request target")
    
    def test_friends_my_requires_auth(self):
        """My friends endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/friends/my")
        assert response.status_code == 401
        print("✓ My friends requires authentication")
    
    def test_friends_my_requires_student_role(self):
        """My friends endpoint requires student role"""
        response = self.session.get(f"{BASE_URL}/api/friends/my")
        assert response.status_code == 403
        print("✓ My friends requires student role")
    
    def test_friends_my_returns_list(self):
        """My friends returns list of friends"""
        if not self.student1_logged_in:
            pytest.skip("Student not logged in")
        
        response = self.student1_session.get(f"{BASE_URL}/api/friends/my")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ My friends returned {len(data)} friends")
    
    def test_friends_search_requires_auth(self):
        """Friends search requires authentication"""
        response = requests.get(f"{BASE_URL}/api/friends/search", params={"query": "test"})
        assert response.status_code == 401
        print("✓ Friends search requires authentication")
    
    def test_friends_search_requires_student_role(self):
        """Friends search requires student role"""
        response = self.session.get(f"{BASE_URL}/api/friends/search", params={"query": "test"})
        assert response.status_code == 403
        print("✓ Friends search requires student role")
    
    def test_friends_search_returns_results(self):
        """Friends search returns potential friends"""
        if not self.student1_logged_in:
            pytest.skip("Student not logged in")
        
        response = self.student1_session.get(
            f"{BASE_URL}/api/friends/search",
            params={"query": "FriendTester"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Check result structure if there are results
        if len(data) > 0:
            result = data[0]
            assert "user_id" in result
            assert "nickname" in result
            assert "school_name" in result
            print(f"✓ Friends search returned {len(data)} results")
        else:
            print("✓ Friends search returned empty list")
    
    def test_friends_request_requires_auth(self):
        """Friend request requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/friends/request",
            params={"to_user_id": "test_user_123"}
        )
        assert response.status_code == 401
        print("✓ Friend request requires authentication")
    
    def test_friends_request_requires_student_role(self):
        """Friend request requires student role"""
        response = self.session.post(
            f"{BASE_URL}/api/friends/request",
            params={"to_user_id": "test_user_123"}
        )
        assert response.status_code == 403
        print("✓ Friend request requires student role")
    
    def test_friends_request_to_nonexistent_user(self):
        """Friend request to non-existent user returns 404"""
        if not self.student1_logged_in:
            pytest.skip("Student not logged in")
        
        response = self.student1_session.post(
            f"{BASE_URL}/api/friends/request",
            params={"to_user_id": "nonexistent_user_12345"}
        )
        assert response.status_code == 404
        print("✓ Friend request to non-existent user returns 404")
    
    def test_friends_request_success(self):
        """Friend request to valid user succeeds"""
        if not self.student1_logged_in or not self.student2_user_id:
            pytest.skip("Students not set up properly")
        
        response = self.student1_session.post(
            f"{BASE_URL}/api/friends/request",
            params={"to_user_id": self.student2_user_id}
        )
        
        # Should succeed or return 400 if request already exists
        assert response.status_code in [200, 400]
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            assert "request_id" in data
            print(f"✓ Friend request sent successfully: {data.get('request_id')}")
        else:
            print("✓ Friend request already exists (400)")


class TestRankingsIntegration:
    """Integration tests for rankings with game state"""
    
    def test_ranking_entry_structure(self):
        """Verify ranking entry has all required fields"""
        session = requests.Session()
        timestamp = int(time.time())
        
        # Create parent and student
        parent_email = f"test_parent_rankint_{timestamp}@example.com"
        session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": parent_email,
                "password": "TestPassword123!",
                "name": "Test Parent Rank Int",
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
        
        student_email = f"test_student_rankint_{timestamp}@example.com"
        student_response = session.post(
            f"{BASE_URL}/api/students",
            json={
                "email": student_email,
                "name": "Test Student Rank Int",
                "nickname": f"RankIntTester{timestamp}",
                "school_year": "5",
                "school_name": "Escola Rank Int",
                "district": "Porto"
            }
        )
        
        if student_response.status_code not in [200, 201]:
            pytest.skip("Could not create student")
        
        student_data = student_response.json()
        temp_password = student_data.get('temp_password')
        
        student_session = requests.Session()
        login_response = student_session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": student_email,
                "password": temp_password
            }
        )
        
        if login_response.status_code != 200:
            pytest.skip("Could not login as student")
        
        # Get national ranking
        response = student_session.get(f"{BASE_URL}/api/rankings/national")
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify structure
        required_fields = ["ranking_type", "entries", "total_players"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Verify entry structure if entries exist
        if len(data["entries"]) > 0:
            entry = data["entries"][0]
            entry_fields = ["rank", "user_id", "nickname", "xp", "level", "settlement_level"]
            for field in entry_fields:
                assert field in entry, f"Missing entry field: {field}"
            
            # Verify settlement_level is valid
            valid_settlements = ["village", "town", "city", "metropolis"]
            assert entry["settlement_level"] in valid_settlements
            
            print(f"✓ Ranking entry structure verified with {len(data['entries'])} entries")
        else:
            print("✓ Ranking structure verified (no entries yet)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
