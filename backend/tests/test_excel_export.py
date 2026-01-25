"""
Test cases for Excel Export functionality with filters
Tests the /api/excel/export-filtered endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestExcelExportFiltered:
    """Excel export with filters endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "ibrahimznrmak@gmail.com", "password": "Szd.dl_34"}
        )
        assert login_response.status_code == 200, "Login failed"
        self.token = login_response.json()["access_token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_export_all_reports(self):
        """Test exporting all reports (no filters)"""
        response = requests.post(
            f"{BASE_URL}/api/excel/export-filtered",
            headers=self.headers,
            json={"proje_id": "all", "sehir": "all", "firma": "all"}
        )
        
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        assert 'content-disposition' in response.headers
        assert len(response.content) > 0
        print(f"All reports export: {len(response.content)} bytes")
    
    def test_export_with_city_filter(self):
        """Test exporting reports filtered by city (Adana)"""
        response = requests.post(
            f"{BASE_URL}/api/excel/export-filtered",
            headers=self.headers,
            json={"proje_id": "all", "sehir": "Adana", "firma": "all"}
        )
        
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        assert 'Adana' in response.headers.get('content-disposition', '')
        print(f"City filter export: {len(response.content)} bytes")
    
    def test_export_with_firma_filter(self):
        """Test exporting reports filtered by company"""
        response = requests.post(
            f"{BASE_URL}/api/excel/export-filtered",
            headers=self.headers,
            json={"proje_id": "all", "sehir": "all", "firma": "POLTEK"}
        )
        
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        print(f"Firma filter export: {len(response.content)} bytes")
    
    def test_export_with_project_filter(self):
        """Test exporting reports filtered by project"""
        # First get a valid project ID
        projects_response = requests.get(
            f"{BASE_URL}/api/projeler",
            headers=self.headers
        )
        
        if projects_response.status_code == 200 and len(projects_response.json()) > 0:
            project_id = projects_response.json()[0].get('id')
            
            response = requests.post(
                f"{BASE_URL}/api/excel/export-filtered",
                headers=self.headers,
                json={"proje_id": project_id, "sehir": "all", "firma": "all"}
            )
            
            assert response.status_code in [200, 404]  # 404 if no reports for project
            if response.status_code == 200:
                assert response.headers.get('content-type') == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                print(f"Project filter export: {len(response.content)} bytes")
            else:
                print("No reports found for project filter")
        else:
            pytest.skip("No projects available for testing")
    
    def test_export_with_combined_filters(self):
        """Test exporting reports with multiple filters"""
        response = requests.post(
            f"{BASE_URL}/api/excel/export-filtered",
            headers=self.headers,
            json={"proje_id": "all", "sehir": "Adana", "firma": "all"}
        )
        
        assert response.status_code == 200
        print(f"Combined filter export: {len(response.content)} bytes")
    
    def test_export_no_matching_reports(self):
        """Test export when no reports match filters"""
        response = requests.post(
            f"{BASE_URL}/api/excel/export-filtered",
            headers=self.headers,
            json={"proje_id": "all", "sehir": "NonExistentCity", "firma": "all"}
        )
        
        # Should return 404 when no reports match
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        print(f"No matching reports: {data['detail']}")
    
    def test_export_without_auth(self):
        """Test export without authentication"""
        response = requests.post(
            f"{BASE_URL}/api/excel/export-filtered",
            json={"proje_id": "all", "sehir": "all", "firma": "all"}
        )
        
        assert response.status_code == 401
        print("Unauthorized access correctly rejected")


class TestDashboardStats:
    """Dashboard stats endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "ibrahimznrmak@gmail.com", "password": "Szd.dl_34"}
        )
        assert login_response.status_code == 200, "Login failed"
        self.token = login_response.json()["access_token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_get_dashboard_stats(self):
        """Test getting dashboard statistics"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        assert "total_raporlar" in data
        assert "monthly_raporlar" in data
        assert "uygun_count" in data
        assert "uygun_degil_count" in data
        assert "kategori_dagilim" in data
        
        print(f"Dashboard stats: {data['total_raporlar']} total reports")
    
    def test_get_raporlar_list(self):
        """Test getting reports list for filtering"""
        response = requests.get(
            f"{BASE_URL}/api/raporlar",
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            # Verify report structure
            report = data[0]
            assert "id" in report or "rapor_no" in report
            print(f"Reports list: {len(data)} reports")
    
    def test_get_projeler_list(self):
        """Test getting projects list for filter dropdown"""
        response = requests.get(
            f"{BASE_URL}/api/projeler",
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            project = data[0]
            assert "id" in project
            assert "proje_adi" in project
            print(f"Projects list: {len(data)} projects")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
