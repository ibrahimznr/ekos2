"""
Metraj Cetveli (Bill of Quantities) Module Tests
Tests all CRUD operations for metraj cetvelleri and satirlar (rows)
"""
import pytest
import requests
import os
import uuid

# Use the public URL for testing
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bill-of-quantities-3.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "ibrahimznrmak@gmail.com"
TEST_PASSWORD = "Szd.dl_34"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for testing"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "access_token" in data, "No access_token in response"
    return data["access_token"]


@pytest.fixture(scope="module")
def api_client(auth_token):
    """Create API client with auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


@pytest.fixture(scope="function")
def test_cetvel(api_client):
    """Create a test cetvel and clean up after test"""
    unique_id = str(uuid.uuid4())[:8]
    response = api_client.post(
        f"{BASE_URL}/api/metraj/",
        json={
            "baslik": f"TEST_Cetvel_{unique_id}",
            "aciklama": "Test metraj cetveli"
        }
    )
    assert response.status_code == 200
    data = response.json()
    cetvel_id = data["id"]
    
    yield cetvel_id
    
    # Cleanup
    try:
        api_client.delete(f"{BASE_URL}/api/metraj/{cetvel_id}")
    except:
        pass


class TestMetrajCRUD:
    """Test CRUD operations for metraj cetvelleri"""
    
    # === LIST CETVELLER ===
    def test_list_cetveller(self, api_client):
        """Test listing all metraj cetvelleri"""
        response = api_client.get(f"{BASE_URL}/api/metraj/")
        assert response.status_code == 200, f"List failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Found {len(data)} metraj cetvelleri")
    
    # === CREATE CETVEL ===
    def test_create_cetvel(self, api_client):
        """Test creating a new metraj cetveli"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "baslik": f"TEST_NewCetvel_{unique_id}",
            "aciklama": "Automated test cetvel"
        }
        
        response = api_client.post(f"{BASE_URL}/api/metraj/", json=payload)
        assert response.status_code == 200, f"Create failed: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain cetvel id"
        assert data["message"] == "Metraj cetveli oluşturuldu"
        
        cetvel_id = data["id"]
        print(f"✓ Created cetvel: {cetvel_id}")
        
        # Verify by GET
        get_response = api_client.get(f"{BASE_URL}/api/metraj/{cetvel_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["baslik"] == payload["baslik"]
        assert fetched["aciklama"] == payload["aciklama"]
        assert fetched["genel_toplam"] == 0.0
        assert fetched["satirlar"] == []
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/metraj/{cetvel_id}")
    
    # === GET SINGLE CETVEL ===
    def test_get_cetvel(self, api_client, test_cetvel):
        """Test getting a single metraj cetveli"""
        response = api_client.get(f"{BASE_URL}/api/metraj/{test_cetvel}")
        assert response.status_code == 200, f"Get failed: {response.text}"
        
        data = response.json()
        assert data["id"] == test_cetvel
        assert "baslik" in data
        assert "satirlar" in data
        assert "genel_toplam" in data
        print(f"✓ Got cetvel: {data['baslik']}")
    
    # === GET NON-EXISTENT CETVEL ===
    def test_get_nonexistent_cetvel(self, api_client):
        """Test getting a non-existent cetvel returns 404"""
        fake_id = str(uuid.uuid4())
        response = api_client.get(f"{BASE_URL}/api/metraj/{fake_id}")
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"
        print("✓ Non-existent cetvel returns 404")
    
    # === DELETE CETVEL ===
    def test_delete_cetvel(self, api_client):
        """Test deleting a metraj cetveli"""
        # Create a cetvel to delete
        unique_id = str(uuid.uuid4())[:8]
        create_response = api_client.post(
            f"{BASE_URL}/api/metraj/",
            json={"baslik": f"TEST_ToDelete_{unique_id}", "aciklama": "Will be deleted"}
        )
        cetvel_id = create_response.json()["id"]
        
        # Delete
        delete_response = api_client.delete(f"{BASE_URL}/api/metraj/{cetvel_id}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        data = delete_response.json()
        assert data["message"] == "Metraj cetveli silindi"
        
        # Verify it's deleted
        get_response = api_client.get(f"{BASE_URL}/api/metraj/{cetvel_id}")
        assert get_response.status_code == 404
        print("✓ Cetvel deleted successfully")


class TestMetrajSatirCRUD:
    """Test CRUD operations for satir (rows) in metraj cetveli"""
    
    # === ADD SATIR ===
    def test_add_satir(self, api_client, test_cetvel):
        """Test adding a row to metraj cetveli"""
        payload = {
            "poz_no": "P-001",
            "malzeme_adi": "Çelik Profil HEB200",
            "birim": "kg",
            "miktar": 100.0,
            "birim_fiyat": 15.50,
            "birim_agirlik": 1.0,
            "aciklama": "Test satır"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/metraj/{test_cetvel}/satir",
            json=payload
        )
        assert response.status_code == 200, f"Add satir failed: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain satir id"
        assert "satir" in data
        assert data["message"] == "Satır eklendi"
        
        satir = data["satir"]
        assert satir["poz_no"] == "P-001"
        assert satir["malzeme_adi"] == "Çelik Profil HEB200"
        assert satir["miktar"] == 100.0
        assert satir["birim_fiyat"] == 15.50
        assert satir["toplam"] == 1550.0  # 100 * 15.50
        assert satir["toplam_agirlik"] == 100.0  # 100 * 1.0
        
        print(f"✓ Added satir with toplam: {satir['toplam']} TL")
        
        # Verify by GET cetvel
        get_response = api_client.get(f"{BASE_URL}/api/metraj/{test_cetvel}")
        cetvel = get_response.json()
        assert len(cetvel["satirlar"]) == 1
        assert cetvel["genel_toplam"] == 1550.0
    
    # === UPDATE SATIR ===
    def test_update_satir(self, api_client, test_cetvel):
        """Test updating a row in metraj cetveli"""
        # First add a satir
        add_response = api_client.post(
            f"{BASE_URL}/api/metraj/{test_cetvel}/satir",
            json={
                "poz_no": "P-002",
                "malzeme_adi": "Beton",
                "birim": "m³",
                "miktar": 10.0,
                "birim_fiyat": 200.0
            }
        )
        satir_id = add_response.json()["id"]
        
        # Update the satir
        update_payload = {
            "miktar": 20.0,
            "birim_fiyat": 250.0
        }
        
        response = api_client.put(
            f"{BASE_URL}/api/metraj/{test_cetvel}/satir/{satir_id}",
            json=update_payload
        )
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        data = response.json()
        assert data["message"] == "Satır güncellendi"
        assert data["satir"]["miktar"] == 20.0
        assert data["satir"]["birim_fiyat"] == 250.0
        assert data["satir"]["toplam"] == 5000.0  # 20 * 250
        
        print(f"✓ Updated satir, new toplam: {data['satir']['toplam']} TL")
    
    # === DELETE SATIR ===
    def test_delete_satir(self, api_client, test_cetvel):
        """Test deleting a row from metraj cetveli"""
        # Add two satirs
        add1 = api_client.post(
            f"{BASE_URL}/api/metraj/{test_cetvel}/satir",
            json={"poz_no": "P-003", "malzeme_adi": "Test1", "birim": "Adet", "miktar": 5, "birim_fiyat": 100}
        )
        satir_id = add1.json()["id"]
        
        api_client.post(
            f"{BASE_URL}/api/metraj/{test_cetvel}/satir",
            json={"poz_no": "P-004", "malzeme_adi": "Test2", "birim": "Adet", "miktar": 3, "birim_fiyat": 50}
        )
        
        # Verify we have 2 satirs
        before = api_client.get(f"{BASE_URL}/api/metraj/{test_cetvel}")
        assert len(before.json()["satirlar"]) == 2
        
        # Delete first satir
        response = api_client.delete(f"{BASE_URL}/api/metraj/{test_cetvel}/satir/{satir_id}")
        assert response.status_code == 200, f"Delete satir failed: {response.text}"
        
        data = response.json()
        assert data["message"] == "Satır silindi"
        
        # Verify only one satir remains
        after = api_client.get(f"{BASE_URL}/api/metraj/{test_cetvel}")
        assert len(after.json()["satirlar"]) == 1
        assert after.json()["genel_toplam"] == 150.0  # Only second satir: 3 * 50
        
        print("✓ Satir deleted and totals recalculated")
    
    # === DUPLICATE SATIR ===
    def test_duplicate_satir(self, api_client, test_cetvel):
        """Test duplicating a row"""
        # Add a satir
        add_response = api_client.post(
            f"{BASE_URL}/api/metraj/{test_cetvel}/satir",
            json={
                "poz_no": "P-005",
                "malzeme_adi": "Demir Profil",
                "birim": "kg",
                "miktar": 50,
                "birim_fiyat": 20.0
            }
        )
        satir_id = add_response.json()["id"]
        
        # Duplicate
        response = api_client.post(
            f"{BASE_URL}/api/metraj/{test_cetvel}/satir/{satir_id}/duplicate"
        )
        assert response.status_code == 200, f"Duplicate failed: {response.text}"
        
        data = response.json()
        assert data["message"] == "Satır kopyalandı"
        assert data["satir"]["poz_no"] == "P-005-KOPYA"
        assert data["satir"]["malzeme_adi"] == "Demir Profil"
        assert data["satir"]["toplam"] == 1000.0  # Same as original
        
        # Verify 2 satirs now
        cetvel = api_client.get(f"{BASE_URL}/api/metraj/{test_cetvel}").json()
        assert len(cetvel["satirlar"]) == 2
        assert cetvel["genel_toplam"] == 2000.0  # 1000 + 1000
        
        print("✓ Satir duplicated successfully")


class TestBulkUpdate:
    """Test bulk update functionality"""
    
    def test_bulk_update(self, api_client, test_cetvel):
        """Test bulk updating all rows at once"""
        # Add some initial satirs
        api_client.post(
            f"{BASE_URL}/api/metraj/{test_cetvel}/satir",
            json={"poz_no": "B-001", "malzeme_adi": "Initial", "birim": "Adet", "miktar": 1, "birim_fiyat": 10}
        )
        
        # Bulk update with new data
        bulk_data = [
            {"poz_no": "BULK-001", "malzeme_adi": "Bulk Item 1", "birim": "m", "miktar": 100, "birim_fiyat": 5.0},
            {"poz_no": "BULK-002", "malzeme_adi": "Bulk Item 2", "birim": "m²", "miktar": 50, "birim_fiyat": 10.0},
            {"poz_no": "BULK-003", "malzeme_adi": "Bulk Item 3", "birim": "kg", "miktar": 200, "birim_fiyat": 2.5, "birim_agirlik": 1.0}
        ]
        
        response = api_client.put(
            f"{BASE_URL}/api/metraj/{test_cetvel}/bulk-update",
            json=bulk_data
        )
        assert response.status_code == 200, f"Bulk update failed: {response.text}"
        
        data = response.json()
        assert "3 satır güncellendi" in data["message"]
        
        # Expected totals: 500 + 500 + 500 = 1500
        assert data["genel_toplam"] == 1500.0
        assert data["genel_agirlik"] == 200.0  # Only item 3 has weight
        
        # Verify by GET
        cetvel = api_client.get(f"{BASE_URL}/api/metraj/{test_cetvel}").json()
        assert len(cetvel["satirlar"]) == 3
        assert cetvel["genel_toplam"] == 1500.0
        assert cetvel["genel_agirlik"] == 200.0
        
        print("✓ Bulk update successful with correct totals")


class TestExcelExport:
    """Test Excel export functionality"""
    
    def test_export_excel(self, api_client, test_cetvel):
        """Test exporting metraj to Excel"""
        # Add some data first
        api_client.post(
            f"{BASE_URL}/api/metraj/{test_cetvel}/satir",
            json={"poz_no": "E-001", "malzeme_adi": "Export Test", "birim": "Adet", "miktar": 10, "birim_fiyat": 100}
        )
        
        response = api_client.get(f"{BASE_URL}/api/metraj/{test_cetvel}/export-excel")
        assert response.status_code == 200, f"Export failed: {response.text}"
        
        # Check content type
        assert "spreadsheetml" in response.headers.get("Content-Type", "")
        
        # Check content disposition header
        content_disposition = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disposition
        assert ".xlsx" in content_disposition
        
        # Check file size (should be > 0)
        assert len(response.content) > 0
        
        print(f"✓ Excel export successful, file size: {len(response.content)} bytes")


class TestBirimOptions:
    """Test birim (unit) options endpoint"""
    
    def test_get_birim_options(self, api_client):
        """Test getting available unit types"""
        response = api_client.get(f"{BASE_URL}/api/metraj/birimler/liste")
        assert response.status_code == 200, f"Get birimler failed: {response.text}"
        
        data = response.json()
        assert "birimler" in data
        assert len(data["birimler"]) > 0
        
        # Verify some expected units
        birim_values = [b["value"] for b in data["birimler"]]
        assert "Adet" in birim_values
        assert "m" in birim_values
        assert "m²" in birim_values
        assert "kg" in birim_values
        
        print(f"✓ Found {len(data['birimler'])} birim options")


class TestCalculations:
    """Test automatic calculation features"""
    
    def test_row_total_calculation(self, api_client, test_cetvel):
        """Test that row totals are calculated correctly"""
        # Add satir with specific values
        response = api_client.post(
            f"{BASE_URL}/api/metraj/{test_cetvel}/satir",
            json={
                "poz_no": "CALC-001",
                "malzeme_adi": "Calculation Test",
                "birim": "m",
                "miktar": 25.5,
                "birim_fiyat": 12.0,
                "birim_agirlik": 3.5
            }
        )
        
        satir = response.json()["satir"]
        
        # toplam = miktar * birim_fiyat = 25.5 * 12.0 = 306.0
        assert satir["toplam"] == 306.0
        
        # toplam_agirlik = miktar * birim_agirlik = 25.5 * 3.5 = 89.25
        assert satir["toplam_agirlik"] == 89.25
        
        print("✓ Row calculations verified")
    
    def test_grand_total_calculation(self, api_client, test_cetvel):
        """Test that grand totals are calculated correctly"""
        # Add multiple satirs
        api_client.post(
            f"{BASE_URL}/api/metraj/{test_cetvel}/satir",
            json={"poz_no": "GT-001", "malzeme_adi": "Item 1", "birim": "Adet", "miktar": 10, "birim_fiyat": 100, "birim_agirlik": 2.0}
        )
        api_client.post(
            f"{BASE_URL}/api/metraj/{test_cetvel}/satir",
            json={"poz_no": "GT-002", "malzeme_adi": "Item 2", "birim": "m", "miktar": 20, "birim_fiyat": 50, "birim_agirlik": 1.5}
        )
        api_client.post(
            f"{BASE_URL}/api/metraj/{test_cetvel}/satir",
            json={"poz_no": "GT-003", "malzeme_adi": "Item 3", "birim": "kg", "miktar": 5, "birim_fiyat": 200}  # No weight
        )
        
        # Get cetvel and verify totals
        cetvel = api_client.get(f"{BASE_URL}/api/metraj/{test_cetvel}").json()
        
        # genel_toplam = 1000 + 1000 + 1000 = 3000
        assert cetvel["genel_toplam"] == 3000.0
        
        # genel_agirlik = 20 + 30 = 50 (item 3 has no weight)
        assert cetvel["genel_agirlik"] == 50.0
        
        print("✓ Grand total calculations verified")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
