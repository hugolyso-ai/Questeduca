import requests
import sys
from datetime import datetime
import json

class QuestEducaAPITester:
    def __init__(self, base_url="https://edu-empire-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else f"{self.api_url}/"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            result = {
                "test_name": name,
                "endpoint": endpoint or "/",
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_data": None,
                "error": None
            }

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    result["response_data"] = response.json()
                    print(f"   Response: {json.dumps(result['response_data'], indent=2)[:200]}...")
                except:
                    result["response_data"] = response.text[:200]
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    result["error"] = error_data
                    print(f"   Error: {error_data}")
                except:
                    result["error"] = response.text
                    print(f"   Error: {response.text}")

            self.test_results.append(result)
            return success, result.get("response_data", {})

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            result = {
                "test_name": name,
                "endpoint": endpoint or "/",
                "method": method,
                "expected_status": expected_status,
                "actual_status": None,
                "success": False,
                "response_data": None,
                "error": str(e)
            }
            self.test_results.append(result)
            return False, {}

    def test_root_endpoint(self):
        """Test /api/ endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        if success and response.get("message") == "QUESTEDUCA API v1.0":
            print("✅ Root endpoint returns correct message")
            return True
        else:
            print(f"❌ Root endpoint message incorrect. Expected: 'QUESTEDUCA API v1.0', Got: {response.get('message')}")
            return False

    def test_districts_endpoint(self):
        """Test /api/districts endpoint"""
        success, response = self.run_test(
            "Districts Endpoint",
            "GET",
            "districts",
            200
        )
        if success:
            if isinstance(response, list) and len(response) >= 18:  # Portugal has 18 districts + 2 autonomous regions
                print(f"✅ Districts endpoint returns {len(response)} districts")
                # Check if it contains expected Portuguese districts
                district_names = [d.get('name', '') if isinstance(d, dict) else str(d) for d in response]
                expected_districts = ['Lisboa', 'Porto', 'Braga', 'Aveiro', 'Coimbra']
                found_districts = [d for d in expected_districts if any(exp in str(district) for district in district_names for exp in [d])]
                print(f"   Found expected districts: {found_districts}")
                return len(found_districts) >= 3
            else:
                print(f"❌ Districts endpoint should return list with 18+ items, got: {len(response) if isinstance(response, list) else 'not a list'}")
                return False
        return False

    def test_schools_endpoint(self):
        """Test /api/schools endpoint"""
        success, response = self.run_test(
            "Schools Endpoint",
            "GET",
            "schools",
            200
        )
        if success:
            if isinstance(response, list) and len(response) > 0:
                print(f"✅ Schools endpoint returns {len(response)} schools")
                # Check structure of first school
                if response and isinstance(response[0], dict):
                    school = response[0]
                    required_fields = ['name', 'district']
                    has_fields = all(field in school for field in required_fields)
                    print(f"   First school structure valid: {has_fields}")
                    print(f"   Sample school: {school}")
                    return has_fields
                return True
            else:
                print(f"❌ Schools endpoint should return non-empty list, got: {len(response) if isinstance(response, list) else 'not a list'}")
                return False
        return False

    def test_subscription_prices_endpoint(self):
        """Test /api/subscriptions/prices endpoint"""
        success, response = self.run_test(
            "Subscription Prices Endpoint",
            "GET",
            "subscriptions/prices",
            200
        )
        if success:
            if isinstance(response, dict):
                print(f"✅ Subscription prices endpoint returns pricing data")
                print(f"   Available subscriptions: {list(response.keys())}")
                # Check for expected subscription types
                expected_types = ['individual_monthly', 'individual_annual', 'family_monthly', 'family_annual']
                found_types = [t for t in expected_types if t in response]
                print(f"   Found subscription types: {found_types}")
                return len(found_types) >= 2
            else:
                print(f"❌ Subscription prices should return dict, got: {type(response)}")
                return False
        return False

    def test_health_endpoint(self):
        """Test /api/health endpoint"""
        success, response = self.run_test(
            "Health Check Endpoint",
            "GET",
            "health",
            200
        )
        return success

    def test_subjects_endpoint(self):
        """Test /api/subjects/{school_year} endpoint"""
        success, response = self.run_test(
            "Subjects Endpoint (Year 5)",
            "GET",
            "subjects/5",
            200
        )
        if success and isinstance(response, dict) and 'subjects' in response:
            subjects = response['subjects']
            print(f"✅ Subjects endpoint returns {len(subjects)} subjects for year 5")
            print(f"   Subjects: {subjects}")
            return len(subjects) > 0
        return False

def main():
    print("🚀 Starting QUESTEDUCA API Testing...")
    print("=" * 60)
    
    # Setup
    tester = QuestEducaAPITester()
    
    # Run basic API tests
    print("\n📋 Testing Basic API Endpoints...")
    tester.test_root_endpoint()
    tester.test_health_endpoint()
    
    print("\n📋 Testing Data Endpoints...")
    tester.test_districts_endpoint()
    tester.test_schools_endpoint()
    tester.test_subscription_prices_endpoint()
    tester.test_subjects_endpoint()

    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    print(f"🎯 Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Print failed tests
    failed_tests = [t for t in tester.test_results if not t['success']]
    if failed_tests:
        print(f"\n❌ Failed Tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test['test_name']}: {test.get('error', 'Status code mismatch')}")
    
    # Print successful tests
    successful_tests = [t for t in tester.test_results if t['success']]
    if successful_tests:
        print(f"\n✅ Successful Tests ({len(successful_tests)}):")
        for test in successful_tests:
            print(f"   - {test['test_name']}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())