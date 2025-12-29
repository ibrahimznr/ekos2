import requests
import sys
import json
import io
from datetime import datetime
from pathlib import Path

class EkipmanAPITester:
    def __init__(self, base_url="https://ekos-system.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = {
            "test": name,
            "status": "PASS" if success else "FAIL",
            "details": details
        }
        self.test_results.append(result)
        print(f"{status} - {name}: {details}")
        return success

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)
        
        if files:
            # Remove Content-Type for file uploads
            test_headers.pop('Content-Type', None)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data, headers=test_headers)
                else:
                    response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success and response.content:
                try:
                    response_data = response.json()
                    details += f", Response: {json.dumps(response_data, indent=2)[:200]}..."
                    return self.log_test(name, True, details), response_data
                except:
                    return self.log_test(name, True, details), {}
            elif not success:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Error: {response.text[:200]}"
                return self.log_test(name, False, details), {}
            
            return self.log_test(name, success, details), {}

        except Exception as e:
            return self.log_test(name, False, f"Exception: {str(e)}"), {}

    def test_login(self):
        """Test login with admin credentials"""
        print("\n🔐 Testing Authentication...")
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@ekipman.com", "password": "admin123"}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response.get('user', {})
            return True
        return False

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n👤 Testing Auth Endpoints...")
        
        # Test /auth/me
        self.run_test("Get Current User", "GET", "auth/me", 200)
        
        # Test invalid login
        self.run_test(
            "Invalid Login",
            "POST", 
            "auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrong"}
        )

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n📊 Testing Dashboard...")
        
        success, response = self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)
        
        if success:
            required_fields = ['total_raporlar', 'monthly_raporlar', 'uygun_count', 'uygun_degil_count']
            for field in required_fields:
                if field not in response:
                    self.log_test(f"Dashboard - {field} field", False, f"Missing field: {field}")
                else:
                    self.log_test(f"Dashboard - {field} field", True, f"Value: {response[field]}")

    def test_kategoriler_endpoints(self):
        """Test category management"""
        print("\n📁 Testing Categories...")
        
        # Get categories
        success, kategoriler = self.run_test("Get Categories", "GET", "kategoriler", 200)
        
        if success:
            self.log_test("Categories Count", len(kategoriler) > 0, f"Found {len(kategoriler)} categories")
        
        # Create new category (admin only)
        if self.user_data.get('role') == 'admin':
            test_kategori = {
                "isim": f"Test Kategori {datetime.now().strftime('%H%M%S')}",
                "aciklama": "Test kategorisi"
            }
            
            success, new_kategori = self.run_test(
                "Create Category",
                "POST",
                "kategoriler",
                200,
                data=test_kategori
            )
            
            if success and 'id' in new_kategori:
                kategori_id = new_kategori['id']
                
                # Delete the test category
                self.run_test(
                    "Delete Category",
                    "DELETE",
                    f"kategoriler/{kategori_id}",
                    200
                )

    def test_raporlar_crud(self):
        """Test reports CRUD operations"""
        print("\n📋 Testing Reports CRUD...")
        
        # Get reports
        success, raporlar = self.run_test("Get Reports", "GET", "raporlar", 200)
        
        if success:
            self.log_test("Reports Count", True, f"Found {len(raporlar)} reports")
        
        # Test search and filters
        self.run_test("Search Reports", "GET", "raporlar?arama=test", 200)
        self.run_test("Filter by Category", "GET", "raporlar?kategori=Asansör", 200)
        self.run_test("Filter by Uygunluk", "GET", "raporlar?uygunluk=Uygun", 200)
        
        # Create new report (admin/inspector only)
        if self.user_data.get('role') in ['admin', 'inspector']:
            test_rapor = {
                "ekipman_adi": f"Test Ekipman {datetime.now().strftime('%H%M%S')}",
                "kategori": "Asansör",
                "firma": "Test Firma",
                "lokasyon": "Test Lokasyon",
                "marka_model": "Test Model",
                "seri_no": "TEST123",
                "alt_kategori": "Test Alt Kategori",
                "periyot": "6 Aylık",
                "gecerlilik_tarihi": "2025-12-31",
                "uygunluk": "Uygun",
                "aciklama": "Test raporu"
            }
            
            success, new_rapor = self.run_test(
                "Create Report",
                "POST",
                "raporlar",
                200,
                data=test_rapor
            )
            
            if success and 'id' in new_rapor:
                rapor_id = new_rapor['id']
                
                # Get specific report
                self.run_test(
                    "Get Specific Report",
                    "GET",
                    f"raporlar/{rapor_id}",
                    200
                )
                
                # Update report
                update_data = {
                    "aciklama": "Updated test raporu"
                }
                
                self.run_test(
                    "Update Report",
                    "PUT",
                    f"raporlar/{rapor_id}",
                    200,
                    data=update_data
                )
                
                # Test file operations
                self.test_file_operations(rapor_id)
                
                # Delete report
                self.run_test(
                    "Delete Report",
                    "DELETE",
                    f"raporlar/{rapor_id}",
                    200
                )

    def test_file_operations(self, rapor_id):
        """Test file upload operations"""
        print("\n📎 Testing File Operations...")
        
        # Create a test file
        test_content = b"Test file content for upload"
        test_file = io.BytesIO(test_content)
        
        files = {
            'file': ('test.txt', test_file, 'text/plain')
        }
        
        # Test file upload (should fail for wrong type)
        success, response = self.run_test(
            "Upload Invalid File Type",
            "POST",
            f"upload/{rapor_id}",
            400,
            files=files
        )
        
        # Get files for report
        self.run_test(
            "Get Report Files",
            "GET",
            f"dosyalar/{rapor_id}",
            200
        )

    def test_excel_operations(self):
        """Test Excel import/export"""
        print("\n📊 Testing Excel Operations...")
        
        # Test Excel export
        success, response = self.run_test("Excel Export", "GET", "excel/export", 200)
        
        # Test template download
        self.run_test("Excel Template", "GET", "excel/template", 200)
        
        # Test Excel import (admin/inspector only)
        if self.user_data.get('role') in ['admin', 'inspector']:
            # Create a simple test Excel content
            test_excel = io.BytesIO(b"fake excel content")
            files = {
                'file': ('test.xlsx', test_excel, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            }
            
            # This will likely fail due to invalid Excel format, but tests the endpoint
            self.run_test(
                "Excel Import",
                "POST",
                "excel/import",
                400,  # Expected to fail with invalid Excel
                files=files
            )

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        print("\n👑 Testing Admin Endpoints...")
        
        if self.user_data.get('role') == 'admin':
            # Get users
            success, users = self.run_test("Get Users", "GET", "users", 200)
            
            if success:
                self.log_test("Users Count", len(users) > 0, f"Found {len(users)} users")
            
            # Test user creation
            test_user = {
                "email": f"test{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "testpass123",
                "role": "viewer"
            }
            
            success, new_user = self.run_test(
                "Create User",
                "POST",
                "auth/register",
                200,
                data=test_user
            )
            
            if success and 'id' in new_user:
                user_id = new_user['id']
                
                # Delete test user
                self.run_test(
                    "Delete User",
                    "DELETE",
                    f"users/{user_id}",
                    200
                )
        else:
            # Test unauthorized access
            self.run_test("Unauthorized User Access", "GET", "users", 403)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Ekipman API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test login first
        if not self.test_login():
            print("❌ Login failed, stopping tests")
            return False
        
        # Run all test suites
        self.test_auth_endpoints()
        self.test_dashboard_stats()
        self.test_kategoriler_endpoints()
        self.test_raporlar_crud()
        self.test_excel_operations()
        self.test_admin_endpoints()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = EkipmanAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results_file = "/app/test_reports/backend_test_results.json"
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0,
            "test_results": tester.test_results
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Detailed results saved to: {results_file}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())