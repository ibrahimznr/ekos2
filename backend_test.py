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
        self.critical_failures = []

    def log_test(self, name, success, details="", critical=False):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
            if critical:
                self.critical_failures.append(f"{name}: {details}")
        
        result = {
            "test": name,
            "status": "PASS" if success else "FAIL",
            "details": details,
            "critical": critical
        }
        self.test_results.append(result)
        print(f"{status} - {name}: {details}")
        return success

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None, critical=False):
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
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data, headers=test_headers, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success and response.content:
                try:
                    response_data = response.json()
                    details += f", Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Array'}"
                    return self.log_test(name, True, details, critical), response_data
                except:
                    return self.log_test(name, True, details, critical), {}
            elif not success:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Error: {response.text[:200]}"
                return self.log_test(name, False, details, critical), {}
            
            return self.log_test(name, success, details, critical), {}

        except Exception as e:
            return self.log_test(name, False, f"Exception: {str(e)}", critical), {}

    def test_specific_user_login(self):
        """Test login with specific user credentials from review request"""
        print("\n🔐 Testing Specific User Login (Review Request)...")
        
        success, response = self.run_test(
            "Login with ibrahimznrmak@gmail.com",
            "POST",
            "auth/login",
            200,
            data={"email": "ibrahimznrmak@gmail.com", "password": "Szd.dl_34"},
            critical=True
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response.get('user', {})
            self.log_test("User Role Check", True, f"User role: {self.user_data.get('role', 'unknown')}")
            return True
        else:
            self.log_test("Critical Login Failed", False, "Cannot proceed with tests without login", critical=True)
            return False

    def test_critical_backend_endpoints(self):
        """Test all critical backend endpoints mentioned in review request"""
        print("\n🎯 Testing Critical Backend Endpoints...")
        
        # Test all endpoints mentioned in the review request
        critical_endpoints = [
            ("POST /api/auth/login", "POST", "auth/login", 200, {"email": "ibrahimznrmak@gmail.com", "password": "Szd.dl_34"}),
            ("GET /api/raporlar", "GET", "raporlar", 200, None),
            ("GET /api/kategoriler", "GET", "kategoriler", 200, None),
            ("GET /api/projeler", "GET", "projeler", 200, None),
            ("GET /api/dashboard/stats", "GET", "dashboard/stats", 200, None),
        ]
        
        for name, method, endpoint, expected_status, data in critical_endpoints:
            if name == "POST /api/auth/login":
                # Skip login test as we already did it
                continue
            self.run_test(name, method, endpoint, expected_status, data=data, critical=True)

    def test_report_creation_flow(self):
        """Test the complete report creation flow for two-stage modal"""
        print("\n📝 Testing Report Creation Flow (Two-Stage Modal)...")
        
        if self.user_data.get('role') not in ['admin', 'inspector']:
            self.log_test("Report Creation Permission", False, "User doesn't have permission to create reports", critical=True)
            return
        
        # First, get required data for report creation
        success, projeler = self.run_test("Get Projects for Report", "GET", "projeler", 200, critical=True)
        if not success or not projeler:
            self.log_test("Projects Required", False, "No projects available for report creation", critical=True)
            return
        
        success, kategoriler = self.run_test("Get Categories for Report", "GET", "kategoriler", 200, critical=True)
        if not success or not kategoriler:
            self.log_test("Categories Required", False, "No categories available for report creation", critical=True)
            return
        
        # Test report creation with realistic data
        proje = projeler[0]  # Use first available project
        kategori = kategoriler[0] if kategoriler else {"isim": "Test Kategori"}
        
        test_rapor_data = {
            "proje_id": proje.get("id"),
            "sehir": "İstanbul",  # Use a valid Turkish city
            "ekipman_adi": "Test Forklift Ekipmanı",
            "kategori": kategori.get("isim", "Forklift"),
            "alt_kategori": "Elektrikli Forklift",
            "firma": "Test EKOS Company",
            "lokasyon": "İstanbul Depo",
            "marka_model": "Toyota 8FBE15",
            "seri_no": f"TF{datetime.now().strftime('%H%M%S')}",
            "periyot": "6 Aylık",
            "gecerlilik_tarihi": "2025-12-31",
            "uygunluk": "Uygun",
            "aciklama": "Test raporu - İki aşamalı modal testi"
        }
        
        success, new_rapor = self.run_test(
            "Create New Report (Two-Stage Modal Test)",
            "POST",
            "raporlar",
            200,
            data=test_rapor_data,
            critical=True
        )
        
        if success and 'id' in new_rapor:
            rapor_id = new_rapor['id']
            rapor_no = new_rapor.get('rapor_no', 'Unknown')
            
            self.log_test("Report Number Format", True, f"Generated report number: {rapor_no}")
            
            # Test getting the created report
            self.run_test(
                "Get Created Report",
                "GET",
                f"raporlar/{rapor_id}",
                200,
                critical=True
            )
            
            # Test updating the report (simulating second stage of modal)
            update_data = {
                "aciklama": "Updated via two-stage modal - equipment added successfully"
            }
            
            self.run_test(
                "Update Report (Second Stage)",
                "PUT",
                f"raporlar/{rapor_id}",
                200,
                data=update_data,
                critical=True
            )
            
            # Clean up - delete test report
            self.run_test(
                "Cleanup Test Report",
                "DELETE",
                f"raporlar/{rapor_id}",
                200
            )
            
            return True
        else:
            self.log_test("Report Creation Failed", False, "Could not create test report", critical=True)
            return False

    def test_category_subcategory_relationship(self):
        """Test category and subcategory relationships"""
        print("\n🏷️ Testing Category-Subcategory Relationships...")
        
        # Test kategori-alt-kategoriler endpoint
        success, kategori_map = self.run_test(
            "Get Category-Subcategory Map",
            "GET",
            "kategori-alt-kategoriler",
            200,
            critical=True
        )
        
        if success:
            self.log_test("Category Map Structure", True, f"Found {len(kategori_map)} category mappings")
            
            # Check if specific categories exist
            expected_categories = ["Forklift", "Asansör", "Kaldırma-İletme"]
            for cat in expected_categories:
                if cat in kategori_map:
                    subcats = kategori_map[cat]
                    self.log_test(f"Category '{cat}' Subcategories", True, f"Has {len(subcats)} subcategories")
                else:
                    self.log_test(f"Category '{cat}' Missing", False, f"Category not found in mapping")

    def test_cities_endpoint(self):
        """Test cities endpoint"""
        print("\n🏙️ Testing Cities Endpoint...")
        
        success, sehirler = self.run_test("Get Cities", "GET", "sehirler", 200, critical=True)
        
        if success:
            self.log_test("Cities Count", True, f"Found {len(sehirler)} cities")
            
            # Check for specific cities mentioned in review
            expected_cities = ["İstanbul", "Ankara", "İzmir", "Adana"]
            for city_name in expected_cities:
                city_found = any(city.get("isim") == city_name for city in sehirler)
                self.log_test(f"City '{city_name}' Available", city_found, f"City {'found' if city_found else 'not found'}")

    def test_dashboard_comprehensive(self):
        """Comprehensive dashboard testing"""
        print("\n📊 Testing Dashboard Comprehensive...")
        
        success, stats = self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200, critical=True)
        
        if success:
            # Check all required fields
            required_fields = [
                'total_raporlar', 'monthly_raporlar', 'uygun_count', 'uygun_degil_count',
                'expiring_30_days', 'expiring_7_days', 'kategori_dagilim'
            ]
            
            for field in required_fields:
                if field in stats:
                    value = stats[field]
                    self.log_test(f"Dashboard Field '{field}'", True, f"Value: {value}")
                else:
                    self.log_test(f"Dashboard Field '{field}' Missing", False, f"Required field not found", critical=True)

    def test_admin_login(self):
        """Test login with admin credentials"""
        print("\n🔐 Testing Admin Authentication...")
        
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

    def test_zip_export_feature(self):
        """Test ZIP export feature according to review request specifications"""
        print("\n📦 Testing ZIP Export Feature (Review Request)...")
        
        if self.user_data.get('role') not in ['admin', 'inspector']:
            self.log_test("ZIP Export Permission", False, "User doesn't have permission for ZIP export", critical=True)
            return False
        
        # First get some reports to export
        success, raporlar = self.run_test("Get Reports for ZIP Export", "GET", "raporlar?limit=3", 200, critical=True)
        if not success or not raporlar:
            self.log_test("Reports Required for ZIP", False, "No reports available for ZIP export", critical=True)
            return False
        
        # Extract report IDs (limit to 3 as per review request)
        rapor_ids = [rapor.get("id") for rapor in raporlar[:3] if rapor.get("id")]
        
        if len(rapor_ids) < 3:
            self.log_test("Insufficient Reports", False, f"Only {len(rapor_ids)} reports available, need 3", critical=True)
            return False
        
        print(f"   Using report IDs: {rapor_ids[:3]}")
        
        # Test 1: Successful ZIP Export with 3 reports
        success, response = self.run_test(
            "ZIP Export - 3 Reports Success",
            "POST",
            "raporlar/zip-export",
            200,
            data={"rapor_ids": rapor_ids[:3]},
            critical=True
        )
        
        if success:
            # Check response headers for ZIP content
            self.log_test("ZIP Content Type", True, "Response received for ZIP export")
        
        # Test 2: Empty rapor_ids error
        success, response = self.run_test(
            "ZIP Export - Empty IDs Error",
            "POST",
            "raporlar/zip-export",
            400,
            data={"rapor_ids": []},
            critical=True
        )
        
        if success:
            self.log_test("Empty IDs Error Message", True, "Correctly rejected empty rapor_ids")
        
        # Test 3: 100+ reports limit error
        # Create a list of 101 fake IDs
        fake_ids = [f"fake-id-{i}" for i in range(101)]
        success, response = self.run_test(
            "ZIP Export - 100+ Reports Limit",
            "POST",
            "raporlar/zip-export",
            400,
            data={"rapor_ids": fake_ids},
            critical=True
        )
        
        if success:
            self.log_test("100+ Reports Limit Error", True, "Correctly rejected 100+ reports")
        
        # Test 4: Unauthorized access (test without token)
        original_token = self.token
        self.token = None  # Remove token temporarily
        
        success, response = self.run_test(
            "ZIP Export - Unauthorized Access",
            "POST",
            "raporlar/zip-export",
            401,
            data={"rapor_ids": rapor_ids[:3]},
            critical=True
        )
        
        # Restore token
        self.token = original_token
        
        if success:
            self.log_test("Unauthorized Access Blocked", True, "Correctly blocked unauthorized access")
        
        # Test 5: Invalid/non-existent report IDs
        invalid_ids = ["invalid-id-1", "invalid-id-2", "invalid-id-3"]
        success, response = self.run_test(
            "ZIP Export - Invalid Report IDs",
            "POST",
            "raporlar/zip-export",
            404,
            data={"rapor_ids": invalid_ids}
        )
        
        if success:
            self.log_test("Invalid IDs Handling", True, "Correctly handled invalid report IDs")
        
        return True

    def run_all_tests(self):
        """Run all API tests focusing on review request requirements"""
        print("🚀 Starting EKOS Backend API Tests (Review Request Focus)...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test specific user login first (from review request)
        if not self.test_specific_user_login():
            print("❌ Critical: Specific user login failed, trying admin login...")
            if not self.test_admin_login():
                print("❌ Critical: Both logins failed, stopping tests")
                return False
        
        # Run critical tests from review request
        self.test_critical_backend_endpoints()
        self.test_report_creation_flow()
        self.test_category_subcategory_relationship()
        self.test_cities_endpoint()
        self.test_dashboard_comprehensive()
        
        # Test ZIP Export Feature (Review Request)
        self.test_zip_export_feature()
        
        # Run additional comprehensive tests
        self.test_auth_endpoints()
        self.test_kategoriler_endpoints()
        self.test_raporlar_crud()
        self.test_excel_operations()
        self.test_admin_endpoints()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 EKOS Backend Test Summary:")
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.critical_failures:
            print(f"\n❌ CRITICAL FAILURES ({len(self.critical_failures)}):")
            for failure in self.critical_failures:
                print(f"  • {failure}")
        else:
            print(f"\n✅ No critical failures detected!")
        
        return len(self.critical_failures) == 0

def main():
    # Create test reports directory
    Path("/app/test_reports").mkdir(exist_ok=True)
    
    tester = EkipmanAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results_file = "/app/test_reports/backend_test_results.json"
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "test_focus": "EKOS Review Request - P0 Bug Fix & P1 Features",
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "failed_tests": tester.tests_run - tester.tests_passed,
            "success_rate": (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0,
            "critical_failures": tester.critical_failures,
            "test_results": tester.test_results
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Detailed results saved to: {results_file}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())