"""
P5 Features Test Suite
Tests for:
- Interactive Tutorial (localStorage-based, frontend only)
- Online/Offline Status Indicator (frontend only)
- Offline Cache Manager (frontend only)
- PDF Report Export API (/api/reports/student/{student_id})
- Push Notifications API (/api/push/subscribe, /api/push/unsubscribe)
- Service Worker registration (frontend only)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://edu-empire-1.preview.emergentagent.com').rstrip('/')

class TestP5ReportExportAPI:
    """Tests for PDF Report Export API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data - create parent and student accounts"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Create unique test parent
        self.parent_email = f"test_p5_parent_{uuid.uuid4().hex[:8]}@test.com"
        self.parent_password = "Test1234!"
        
        # Register parent
        register_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.parent_email,
            "password": self.parent_password,
            "name": "Test P5 Parent",
            "role": "parent"
        })
        
        if register_response.status_code == 200:
            # Login as parent
            login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
                "email": self.parent_email,
                "password": self.parent_password
            })
            assert login_response.status_code == 200
            self.parent_user_id = login_response.json().get('user', {}).get('user_id')
            
            # Create a student child
            self.student_email = f"test_p5_student_{uuid.uuid4().hex[:8]}@test.com"
            student_response = self.session.post(f"{BASE_URL}/api/students", json={
                "email": self.student_email,
                "name": "Test P5 Student",
                "nickname": "P5Tester",
                "school_year": "5",
                "district": "Lisboa",
                "school_name": "Escola Teste P5"
            })
            
            if student_response.status_code == 200:
                self.student_id = student_response.json().get('student_id')
                self.student_user_id = student_response.json().get('user_id')
                self.student_temp_password = student_response.json().get('temp_password')
            else:
                self.student_id = None
        else:
            # Try to login with existing credentials
            login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
                "email": "test_p5@test.com",
                "password": "Test1234!"
            })
            if login_response.status_code == 200:
                self.parent_user_id = login_response.json().get('user', {}).get('user_id')
            self.student_id = None
    
    def test_report_api_requires_authentication(self):
        """Test that report API requires authentication"""
        # Use a new session without cookies
        new_session = requests.Session()
        response = new_session.get(f"{BASE_URL}/api/reports/student/test_student_id")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Report API requires authentication (401)")
    
    def test_report_api_returns_data_for_parent(self):
        """Test that parent can get report data for their child"""
        if not self.student_id:
            pytest.skip("No student created for this test")
        
        response = self.session.get(f"{BASE_URL}/api/reports/student/{self.student_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify report data structure
        assert 'nickname' in data, "Report should contain nickname"
        assert 'school_year' in data, "Report should contain school_year"
        assert 'xp' in data, "Report should contain xp"
        assert 'level' in data, "Report should contain level"
        assert 'quizzes_completed' in data, "Report should contain quizzes_completed"
        assert 'subjects_performance' in data, "Report should contain subjects_performance"
        assert 'achievements' in data, "Report should contain achievements"
        assert 'settlement_level' in data, "Report should contain settlement_level"
        assert 'report_date' in data, "Report should contain report_date"
        
        print(f"✓ Report API returns complete data for parent's child")
        print(f"  - Nickname: {data.get('nickname')}")
        print(f"  - School Year: {data.get('school_year')}")
        print(f"  - XP: {data.get('xp')}")
        print(f"  - Level: {data.get('level')}")
        print(f"  - Settlement: {data.get('settlement_level')}")
    
    def test_report_api_denies_access_to_other_students(self):
        """Test that parent cannot access reports for students that are not their children"""
        # Try to access a non-existent or other parent's student
        response = self.session.get(f"{BASE_URL}/api/reports/student/student_nonexistent_12345")
        assert response.status_code in [403, 404], f"Expected 403 or 404, got {response.status_code}"
        print("✓ Report API denies access to other students (403/404)")


class TestP5PushNotificationsAPI:
    """Tests for Push Notifications API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login with existing test credentials or create new
        self.test_email = f"test_p5_push_{uuid.uuid4().hex[:8]}@test.com"
        self.test_password = "Test1234!"
        
        # Try to register
        register_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": "Test P5 Push User",
            "role": "parent"
        })
        
        # Login
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        
        if login_response.status_code == 200:
            self.user_id = login_response.json().get('user', {}).get('user_id')
            self.logged_in = True
        else:
            self.logged_in = False
    
    def test_push_subscribe_requires_authentication(self):
        """Test that push subscribe requires authentication"""
        new_session = requests.Session()
        response = new_session.post(f"{BASE_URL}/api/push/subscribe", json={
            "endpoint": "https://fcm.googleapis.com/test",
            "keys": {"p256dh": "test", "auth": "test"}
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Push subscribe requires authentication (401)")
    
    def test_push_subscribe_works_for_authenticated_user(self):
        """Test that authenticated user can subscribe to push notifications"""
        if not self.logged_in:
            pytest.skip("Not logged in")
        
        response = self.session.post(f"{BASE_URL}/api/push/subscribe", json={
            "endpoint": f"https://fcm.googleapis.com/test/{uuid.uuid4().hex}",
            "keys": {
                "p256dh": "test_p256dh_key",
                "auth": "test_auth_key"
            }
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get('success') == True, "Response should indicate success"
        assert 'message' in data, "Response should contain message"
        print("✓ Push subscribe works for authenticated user")
        print(f"  - Message: {data.get('message')}")
    
    def test_push_unsubscribe_works(self):
        """Test that user can unsubscribe from push notifications"""
        if not self.logged_in:
            pytest.skip("Not logged in")
        
        # First subscribe
        self.session.post(f"{BASE_URL}/api/push/subscribe", json={
            "endpoint": f"https://fcm.googleapis.com/test/{uuid.uuid4().hex}",
            "keys": {"p256dh": "test", "auth": "test"}
        })
        
        # Then unsubscribe
        response = self.session.delete(f"{BASE_URL}/api/push/unsubscribe")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get('success') == True, "Response should indicate success"
        print("✓ Push unsubscribe works")
        print(f"  - Message: {data.get('message')}")


class TestP5ServiceWorkerAndOffline:
    """Tests for Service Worker and Offline functionality (API endpoints)"""
    
    def test_service_worker_file_exists(self):
        """Test that service worker file is accessible"""
        response = requests.get(f"{BASE_URL}/service-worker.js")
        # Service worker might return 200 or be served differently
        assert response.status_code in [200, 304], f"Expected 200 or 304, got {response.status_code}"
        
        if response.status_code == 200:
            content = response.text
            # Check for key service worker features
            assert 'install' in content.lower() or 'fetch' in content.lower() or 'cache' in content.lower(), \
                "Service worker should contain install, fetch, or cache handlers"
            print("✓ Service worker file is accessible and contains expected handlers")
        else:
            print("✓ Service worker file exists (304 - cached)")
    
    def test_subjects_api_for_offline_cache(self):
        """Test that subjects API works (used for offline caching)"""
        response = requests.get(f"{BASE_URL}/api/subjects/5")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        subjects = response.json()
        assert isinstance(subjects, list), "Subjects should be a list"
        assert len(subjects) > 0, "Should have at least one subject"
        print(f"✓ Subjects API works for offline caching")
        print(f"  - Subjects for year 5: {subjects}")


class TestP5InAppNotifications:
    """Tests for in-app notifications (fallback when push not available)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login with existing test credentials
        self.test_email = f"test_p5_notif_{uuid.uuid4().hex[:8]}@test.com"
        self.test_password = "Test1234!"
        
        # Register
        self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": "Test P5 Notif User",
            "role": "parent"
        })
        
        # Login
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        
        self.logged_in = login_response.status_code == 200
    
    def test_send_push_creates_inapp_notification_when_no_subscription(self):
        """Test that sending push to user without subscription creates in-app notification"""
        if not self.logged_in:
            pytest.skip("Not logged in")
        
        response = self.session.post(f"{BASE_URL}/api/notifications/send-push", json={
            "title": "Test Notification",
            "body": "This is a test notification for P5"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get('success') == True, "Response should indicate success"
        # When no push subscription exists, it should create in-app notification
        assert data.get('method') == 'in-app', "Should fall back to in-app notification"
        print("✓ Send push creates in-app notification when no subscription exists")
        print(f"  - Method: {data.get('method')}")


class TestP5QuizGenerationForOffline:
    """Tests for quiz generation API (used for offline caching)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with student login"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Use existing student credentials from previous tests
        # First try to create a new student via parent
        self.parent_email = f"test_p5_quiz_parent_{uuid.uuid4().hex[:8]}@test.com"
        self.parent_password = "Test1234!"
        
        # Register parent
        self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.parent_email,
            "password": self.parent_password,
            "name": "Test P5 Quiz Parent",
            "role": "parent"
        })
        
        # Login as parent
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.parent_email,
            "password": self.parent_password
        })
        
        if login_response.status_code == 200:
            # Create student
            self.student_email = f"test_p5_quiz_student_{uuid.uuid4().hex[:8]}@test.com"
            student_response = self.session.post(f"{BASE_URL}/api/students", json={
                "email": self.student_email,
                "name": "Test P5 Quiz Student",
                "nickname": "QuizTester",
                "school_year": "5",
                "district": "Lisboa",
                "school_name": "Escola Teste Quiz"
            })
            
            if student_response.status_code == 200:
                self.student_temp_password = student_response.json().get('temp_password')
                
                # Logout parent
                self.session.post(f"{BASE_URL}/api/auth/logout")
                
                # Login as student
                student_login = self.session.post(f"{BASE_URL}/api/auth/login", json={
                    "email": self.student_email,
                    "password": self.student_temp_password
                })
                self.student_logged_in = student_login.status_code == 200
            else:
                self.student_logged_in = False
        else:
            self.student_logged_in = False
    
    def test_quiz_generate_works_for_student(self):
        """Test that quiz generation works for students (used for offline caching)"""
        if not self.student_logged_in:
            pytest.skip("Student not logged in")
        
        response = self.session.get(f"{BASE_URL}/api/quiz/generate", params={
            "school_year": "5",
            "subject": "Matemática",
            "count": 5
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'questions' in data, "Response should contain questions"
        assert len(data['questions']) > 0, "Should have at least one question"
        
        # Verify question structure
        question = data['questions'][0]
        assert 'question_text' in question, "Question should have question_text"
        assert 'options' in question, "Question should have options"
        assert 'correct_answer' in question, "Question should have correct_answer"
        
        print("✓ Quiz generation works for offline caching")
        print(f"  - Generated {len(data['questions'])} questions")
        print(f"  - Subject: {data.get('subject')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
