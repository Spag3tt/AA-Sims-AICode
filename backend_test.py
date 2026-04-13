#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class NCAASimAPITester:
    def __init__(self, base_url="https://division-climb-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_standings(self):
        """Test standings endpoint"""
        return self.run_test("Current Standings", "GET", "standings", 200)

    def test_history(self):
        """Test history endpoint"""
        return self.run_test("Championship History", "GET", "history", 200)

    def test_all_time_rankings(self):
        """Test all-time rankings endpoint"""
        return self.run_test("All-Time Rankings", "GET", "all-time-rankings", 200)

    def test_seasons(self):
        """Test seasons endpoint"""
        return self.run_test("Available Seasons", "GET", "seasons", 200)

    def test_google_sheets_data(self):
        """Test Google Sheets data endpoint"""
        return self.run_test("Google Sheets Data", "GET", "sheets/all", 200)

    def test_season_specific(self, season=5):
        """Test season-specific endpoints"""
        success1, _ = self.run_test(f"Season {season} Rankings", "GET", f"season/{season}/rankings", 200)
        success2, _ = self.run_test(f"Season {season} Division A", "GET", f"season/{season}/division/A", 200)
        success3, _ = self.run_test(f"Season {season} Division B", "GET", f"season/{season}/division/B", 200)
        success4, _ = self.run_test(f"Season {season} Division C", "GET", f"season/{season}/division/C", 200)
        return success1 and success2 and success3 and success4

    def test_tournaments(self):
        """Test tournament endpoints"""
        success1, _ = self.run_test("All Tournaments", "GET", "tournaments", 200)
        success2, _ = self.run_test("Active Tournaments", "GET", "tournaments/active", 200)
        return success1 and success2

    def test_auth_endpoints_without_token(self):
        """Test auth endpoints without authentication (should fail)"""
        success1, _ = self.run_test("Auth Me (No Token)", "GET", "auth/me", 401)
        success2, _ = self.run_test("My Predictions (No Token)", "GET", "predictions/mine", 401)
        return success1 and success2

    def test_with_session_token(self, session_token):
        """Test endpoints that require authentication"""
        self.session_token = session_token
        print(f"\n🔑 Testing with session token: {session_token[:20]}...")
        
        success1, user_data = self.run_test("Auth Me (With Token)", "GET", "auth/me", 200)
        success2, _ = self.run_test("My Predictions (With Token)", "GET", "predictions/mine", 200)
        success3, _ = self.run_test("Global Leaderboard", "GET", "leaderboard", 200)
        
        if success1 and user_data:
            print(f"   Authenticated as: {user_data.get('name', 'Unknown')} ({user_data.get('email', 'No email')})")
        
        return success1 and success2 and success3

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting NCAA Simulation API Tests")
        print("=" * 50)

        # Test public endpoints
        print("\n📊 Testing Public Data Endpoints")
        self.test_root_endpoint()
        self.test_standings()
        self.test_history()
        self.test_all_time_rankings()
        self.test_seasons()
        self.test_google_sheets_data()
        self.test_season_specific()
        self.test_tournaments()

        # Test auth endpoints without token
        print("\n🔒 Testing Auth Endpoints (No Token)")
        self.test_auth_endpoints_without_token()

        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                if 'error' in test:
                    print(f"   - {test.get('test', 'Unknown')}: {test['error']}")
                else:
                    print(f"   - {test.get('test', 'Unknown')}: Expected {test.get('expected')}, got {test.get('actual')}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = NCAASimAPITester()
    
    # Run basic tests
    success = tester.run_all_tests()
    
    print(f"\n🏁 Basic API testing completed")
    print(f"Success rate: {tester.tests_passed}/{tester.tests_run} ({(tester.tests_passed/tester.tests_run*100):.1f}%)")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())