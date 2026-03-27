"""
Test P4 Features: Admin Dashboard, Monthly Leagues, Notifications, Change Password
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "info@serv2all.pt"
ADMIN_PASSWORD = "Quest1234*"
STUDENT_EMAIL = "test_student_ui_1774624516@example.com"
STUDENT_PASSWORD = "7817c30c"


class TestAdminAuthentication:
    """Test admin login and authentication"""
    
    def test_admin_login_success(self):
        """Admin can login with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "session_token" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"✓ Admin login successful, role: {data['user']['role']}")
    
    def test_admin_login_wrong_password(self):
        """Admin login fails with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Admin login correctly rejected with wrong password")


class TestAdminDashboard:
    """Test admin dashboard endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            self.session = requests.Session()
            self.session.cookies.set("session_token", response.json()["session_token"])
        else:
            pytest.skip("Admin login failed")
    
    def test_get_dashboard_stats(self):
        """GET /api/admin/dashboard returns stats"""
        response = self.session.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 200, f"Dashboard failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "users" in data
        assert "subscriptions" in data
        assert "revenue" in data
        assert "content" in data
        
        # Verify users stats
        assert "total" in data["users"]
        assert "parents" in data["users"]
        assert "students" in data["users"]
        assert "associations" in data["users"]
        assert "recent_7_days" in data["users"]
        
        # Verify subscriptions
        assert "active" in data["subscriptions"]
        
        # Verify revenue
        assert "total" in data["revenue"]
        assert "commissions_paid" in data["revenue"]
        assert "pending_payouts" in data["revenue"]
        
        # Verify content
        assert "questions" in data["content"]
        
        print(f"✓ Dashboard stats: {data['users']['total']} users, {data['subscriptions']['active']} active subs")
    
    def test_get_users_paginated(self):
        """GET /api/admin/users returns paginated user list"""
        response = self.session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200, f"Users list failed: {response.text}"
        data = response.json()
        
        assert "users" in data
        assert "pagination" in data
        assert "page" in data["pagination"]
        assert "limit" in data["pagination"]
        assert "total" in data["pagination"]
        assert "pages" in data["pagination"]
        
        # Verify user structure (if users exist)
        if data["users"]:
            user = data["users"][0]
            assert "user_id" in user
            assert "email" in user
            assert "role" in user
            assert "password" not in user  # Password should be excluded
        
        print(f"✓ Users list: {len(data['users'])} users, page {data['pagination']['page']}/{data['pagination']['pages']}")
    
    def test_get_users_with_role_filter(self):
        """GET /api/admin/users with role filter"""
        response = self.session.get(f"{BASE_URL}/api/admin/users", params={"role": "student"})
        assert response.status_code == 200
        data = response.json()
        
        # All returned users should be students
        for user in data["users"]:
            assert user["role"] == "student"
        
        print(f"✓ Filtered users by role: {len(data['users'])} students")
    
    def test_get_associations(self):
        """GET /api/admin/associations returns association list"""
        response = self.session.get(f"{BASE_URL}/api/admin/associations")
        assert response.status_code == 200, f"Associations failed: {response.text}"
        data = response.json()
        
        assert "associations" in data
        assert "pagination" in data
        
        print(f"✓ Associations list: {len(data['associations'])} associations")
    
    def test_get_transactions(self):
        """GET /api/admin/transactions returns transaction list"""
        response = self.session.get(f"{BASE_URL}/api/admin/transactions")
        assert response.status_code == 200, f"Transactions failed: {response.text}"
        data = response.json()
        
        assert "transactions" in data
        assert "pagination" in data
        
        print(f"✓ Transactions list: {len(data['transactions'])} transactions")
    
    def test_toggle_user_active_status(self):
        """PUT /api/admin/users/{id}/toggle-active toggles user status"""
        # First get a non-admin user
        users_response = self.session.get(f"{BASE_URL}/api/admin/users", params={"role": "student"})
        assert users_response.status_code == 200
        users = users_response.json()["users"]
        
        if not users:
            pytest.skip("No student users to test toggle")
        
        user_id = users[0]["user_id"]
        original_status = users[0].get("is_active", True)
        
        # Toggle status
        response = self.session.put(f"{BASE_URL}/api/admin/users/{user_id}/toggle-active")
        assert response.status_code == 200, f"Toggle failed: {response.text}"
        data = response.json()
        
        assert data["success"] == True
        assert data["is_active"] != original_status
        
        # Toggle back to original
        self.session.put(f"{BASE_URL}/api/admin/users/{user_id}/toggle-active")
        
        print(f"✓ User status toggled: {original_status} -> {data['is_active']}")


class TestAdminAccessControl:
    """Test that admin routes are protected"""
    
    def test_dashboard_requires_auth(self):
        """Dashboard requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Dashboard requires authentication")
    
    def test_dashboard_requires_admin_role(self):
        """Dashboard requires admin role"""
        # Login as student
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": STUDENT_EMAIL, "password": STUDENT_PASSWORD}
        )
        if login_response.status_code != 200:
            pytest.skip("Student login failed")
        
        session = requests.Session()
        session.cookies.set("session_token", login_response.json()["session_token"])
        
        response = session.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Dashboard requires admin role (student gets 403)")


class TestMonthlyLeagues:
    """Test monthly leagues endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as student before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": STUDENT_EMAIL, "password": STUDENT_PASSWORD}
        )
        if response.status_code == 200:
            self.session = requests.Session()
            self.session.cookies.set("session_token", response.json()["session_token"])
        else:
            pytest.skip("Student login failed")
    
    def test_get_current_league(self):
        """GET /api/leagues/current returns league data"""
        response = self.session.get(f"{BASE_URL}/api/leagues/current")
        assert response.status_code == 200, f"League failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "league_id" in data
        assert "month_name" in data
        assert "days_left" in data
        assert "user_stats" in data
        assert "top_10" in data
        assert "rewards" in data
        
        # Verify user_stats
        assert "rank" in data["user_stats"]
        assert "xp_earned" in data["user_stats"]
        assert "nickname" in data["user_stats"]
        
        # Verify rewards structure
        assert "1st" in data["rewards"]
        assert "2nd" in data["rewards"]
        assert "3rd" in data["rewards"]
        
        print(f"✓ League data: {data['month_name']}, {data['days_left']} days left, user rank: {data['user_stats']['rank']}")
    
    def test_update_league_xp(self):
        """POST /api/leagues/update-xp updates league XP"""
        response = self.session.post(
            f"{BASE_URL}/api/leagues/update-xp",
            params={"xp_gained": 10}
        )
        assert response.status_code == 200, f"Update XP failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        print("✓ League XP updated successfully")
    
    def test_league_requires_student_role(self):
        """League endpoints require student role"""
        # Login as admin
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if login_response.status_code != 200:
            pytest.skip("Admin login failed")
        
        session = requests.Session()
        session.cookies.set("session_token", login_response.json()["session_token"])
        
        response = session.get(f"{BASE_URL}/api/leagues/current")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ League requires student role (admin gets 403)")


class TestNotifications:
    """Test notifications endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as student before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": STUDENT_EMAIL, "password": STUDENT_PASSWORD}
        )
        if response.status_code == 200:
            self.session = requests.Session()
            self.session.cookies.set("session_token", response.json()["session_token"])
        else:
            pytest.skip("Student login failed")
    
    def test_get_my_notifications(self):
        """GET /api/notifications/my returns user notifications"""
        response = self.session.get(f"{BASE_URL}/api/notifications/my")
        assert response.status_code == 200, f"Notifications failed: {response.text}"
        data = response.json()
        
        assert "notifications" in data
        assert "unread_count" in data
        assert isinstance(data["notifications"], list)
        assert isinstance(data["unread_count"], int)
        
        print(f"✓ Notifications: {len(data['notifications'])} total, {data['unread_count']} unread")
    
    def test_notifications_requires_auth(self):
        """Notifications require authentication"""
        response = requests.get(f"{BASE_URL}/api/notifications/my")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Notifications require authentication")


class TestChangePassword:
    """Test change password endpoint"""
    
    def test_change_password_requires_auth(self):
        """Change password requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/auth/change-password",
            params={"old_password": "test", "new_password": "test123"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Change password requires authentication")
    
    def test_change_password_wrong_old_password(self):
        """Change password fails with wrong old password"""
        # Login as student
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": STUDENT_EMAIL, "password": STUDENT_PASSWORD}
        )
        if login_response.status_code != 200:
            pytest.skip("Student login failed")
        
        session = requests.Session()
        session.cookies.set("session_token", login_response.json()["session_token"])
        
        response = session.post(
            f"{BASE_URL}/api/auth/change-password",
            params={"old_password": "wrongpassword", "new_password": "newpassword123"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Change password correctly rejects wrong old password")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
