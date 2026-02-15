"""
Test suite for Kombinasyonlar (Şans Topu Tahmin Üretici) API endpoints
Tests: /api/kombinasyonlar/stats, /generate, /clear, /search, /sample, /export-excel
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestKombinasyonlarStats:
    """Test /api/kombinasyonlar/stats endpoint"""
    
    def test_stats_returns_200(self):
        """Stats endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/kombinasyonlar/stats")
        assert response.status_code == 200
        
    def test_stats_returns_total_combinations(self):
        """Stats should return total_combinations field"""
        response = requests.get(f"{BASE_URL}/api/kombinasyonlar/stats")
        data = response.json()
        assert "total_combinations" in data
        assert isinstance(data["total_combinations"], int)


class TestKombinasyonlarGenerate:
    """Test /api/kombinasyonlar/generate endpoint"""
    
    def test_generate_small_batch(self):
        """Generate small batch of combinations"""
        # First clear cache
        requests.post(f"{BASE_URL}/api/kombinasyonlar/clear")
        
        response = requests.post(
            f"{BASE_URL}/api/kombinasyonlar/generate",
            json={"num_combinations": 100}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["generated_count"] == 100
        assert data["total_count"] == 100
        assert "message" in data
        
    def test_generate_adds_to_existing(self):
        """Generate should add to existing combinations"""
        # Clear and generate initial batch
        requests.post(f"{BASE_URL}/api/kombinasyonlar/clear")
        requests.post(
            f"{BASE_URL}/api/kombinasyonlar/generate",
            json={"num_combinations": 50}
        )
        
        # Generate more
        response = requests.post(
            f"{BASE_URL}/api/kombinasyonlar/generate",
            json={"num_combinations": 50}
        )
        data = response.json()
        assert data["total_count"] == 100
        
    def test_generate_invalid_count(self):
        """Generate with invalid count should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/kombinasyonlar/generate",
            json={"num_combinations": 0}
        )
        assert response.status_code == 400
        
    def test_generate_exceeds_max(self):
        """Generate exceeding max should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/kombinasyonlar/generate",
            json={"num_combinations": 20000000}
        )
        assert response.status_code == 400


class TestKombinasyonlarClear:
    """Test /api/kombinasyonlar/clear endpoint"""
    
    def test_clear_cache(self):
        """Clear should remove all combinations"""
        # Generate some combinations first
        requests.post(
            f"{BASE_URL}/api/kombinasyonlar/generate",
            json={"num_combinations": 100}
        )
        
        # Clear
        response = requests.post(f"{BASE_URL}/api/kombinasyonlar/clear")
        assert response.status_code == 200
        
        data = response.json()
        assert "cleared_count" in data
        assert "message" in data
        
        # Verify stats is 0
        stats = requests.get(f"{BASE_URL}/api/kombinasyonlar/stats").json()
        assert stats["total_combinations"] == 0


class TestKombinasyonlarSearch:
    """Test /api/kombinasyonlar/search endpoint"""
    
    def test_search_empty_cache(self):
        """Search in empty cache should return not found"""
        requests.post(f"{BASE_URL}/api/kombinasyonlar/clear")
        
        response = requests.post(
            f"{BASE_URL}/api/kombinasyonlar/search",
            json={"combination_str": "5,12,23,27,34+8"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["found"] == False
        assert "Cache boş" in data["message"]
        
    def test_search_format_with_plus(self):
        """Search with format: 5,12,23,27,34+8"""
        # Generate combinations first
        requests.post(f"{BASE_URL}/api/kombinasyonlar/clear")
        requests.post(
            f"{BASE_URL}/api/kombinasyonlar/generate",
            json={"num_combinations": 100}
        )
        
        response = requests.post(
            f"{BASE_URL}/api/kombinasyonlar/search",
            json={"combination_str": "5,12,23,27,34+8"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "found" in data
        assert "indices" in data
        assert "combination" in data
        
    def test_search_format_with_dash(self):
        """Search with format: 5-12-23-27-34-8"""
        requests.post(f"{BASE_URL}/api/kombinasyonlar/clear")
        requests.post(
            f"{BASE_URL}/api/kombinasyonlar/generate",
            json={"num_combinations": 100}
        )
        
        response = requests.post(
            f"{BASE_URL}/api/kombinasyonlar/search",
            json={"combination_str": "5-12-23-27-34-8"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "found" in data
        
    def test_search_format_with_spaces(self):
        """Search with format: 5 12 23 27 34 8"""
        requests.post(f"{BASE_URL}/api/kombinasyonlar/clear")
        requests.post(
            f"{BASE_URL}/api/kombinasyonlar/generate",
            json={"num_combinations": 100}
        )
        
        response = requests.post(
            f"{BASE_URL}/api/kombinasyonlar/search",
            json={"combination_str": "5 12 23 27 34 8"}
        )
        assert response.status_code == 200
        
    def test_search_invalid_main_numbers(self):
        """Search with invalid main numbers (>34)"""
        requests.post(f"{BASE_URL}/api/kombinasyonlar/clear")
        requests.post(
            f"{BASE_URL}/api/kombinasyonlar/generate",
            json={"num_combinations": 100}
        )
        
        response = requests.post(
            f"{BASE_URL}/api/kombinasyonlar/search",
            json={"combination_str": "5,12,23,27,50+8"}
        )
        data = response.json()
        assert data["found"] == False
        assert "1-34" in data["message"]
        
    def test_search_invalid_bonus_number(self):
        """Search with invalid bonus number (>14)"""
        requests.post(f"{BASE_URL}/api/kombinasyonlar/clear")
        requests.post(
            f"{BASE_URL}/api/kombinasyonlar/generate",
            json={"num_combinations": 100}
        )
        
        response = requests.post(
            f"{BASE_URL}/api/kombinasyonlar/search",
            json={"combination_str": "5,12,23,27,34+20"}
        )
        data = response.json()
        assert data["found"] == False
        assert "1-14" in data["message"]
        
    def test_search_duplicate_main_numbers(self):
        """Search with duplicate main numbers"""
        requests.post(f"{BASE_URL}/api/kombinasyonlar/clear")
        requests.post(
            f"{BASE_URL}/api/kombinasyonlar/generate",
            json={"num_combinations": 100}
        )
        
        response = requests.post(
            f"{BASE_URL}/api/kombinasyonlar/search",
            json={"combination_str": "5,5,23,27,34+8"}
        )
        data = response.json()
        assert data["found"] == False
        assert "farklı" in data["message"]


class TestKombinasyonlarSample:
    """Test /api/kombinasyonlar/sample endpoint"""
    
    def test_sample_empty_cache(self):
        """Sample from empty cache should return empty list"""
        requests.post(f"{BASE_URL}/api/kombinasyonlar/clear")
        
        response = requests.get(f"{BASE_URL}/api/kombinasyonlar/sample?count=5")
        assert response.status_code == 200
        
        data = response.json()
        assert data == []
        
    def test_sample_returns_correct_count(self):
        """Sample should return requested count"""
        requests.post(f"{BASE_URL}/api/kombinasyonlar/clear")
        requests.post(
            f"{BASE_URL}/api/kombinasyonlar/generate",
            json={"num_combinations": 100}
        )
        
        response = requests.get(f"{BASE_URL}/api/kombinasyonlar/sample?count=5")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 5
        
    def test_sample_structure(self):
        """Sample items should have correct structure"""
        requests.post(f"{BASE_URL}/api/kombinasyonlar/clear")
        requests.post(
            f"{BASE_URL}/api/kombinasyonlar/generate",
            json={"num_combinations": 100}
        )
        
        response = requests.get(f"{BASE_URL}/api/kombinasyonlar/sample?count=1")
        data = response.json()
        
        assert len(data) == 1
        item = data[0]
        assert "index" in item
        assert "main_numbers" in item
        assert "bonus_number" in item
        assert "formatted" in item
        assert len(item["main_numbers"]) == 5
        assert isinstance(item["bonus_number"], int)


class TestKombinasyonlarExportExcel:
    """Test /api/kombinasyonlar/export-excel endpoint"""
    
    def test_export_empty_cache(self):
        """Export from empty cache should return 400"""
        requests.post(f"{BASE_URL}/api/kombinasyonlar/clear")
        
        response = requests.get(f"{BASE_URL}/api/kombinasyonlar/export-excel")
        assert response.status_code == 400
        
    def test_export_returns_excel(self):
        """Export should return Excel file"""
        requests.post(f"{BASE_URL}/api/kombinasyonlar/clear")
        requests.post(
            f"{BASE_URL}/api/kombinasyonlar/generate",
            json={"num_combinations": 100}
        )
        
        response = requests.get(f"{BASE_URL}/api/kombinasyonlar/export-excel")
        assert response.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("Content-Type", "")
        assert len(response.content) > 0


class TestKombinasyonlarCombinationByIndex:
    """Test /api/kombinasyonlar/combination/{index} endpoint"""
    
    def test_get_combination_by_index(self):
        """Get specific combination by index"""
        requests.post(f"{BASE_URL}/api/kombinasyonlar/clear")
        requests.post(
            f"{BASE_URL}/api/kombinasyonlar/generate",
            json={"num_combinations": 100}
        )
        
        response = requests.get(f"{BASE_URL}/api/kombinasyonlar/combination/1")
        assert response.status_code == 200
        
        data = response.json()
        assert data["index"] == 1
        assert "main_numbers" in data
        assert "bonus_number" in data
        
    def test_get_combination_not_found(self):
        """Get non-existent combination should return 404"""
        requests.post(f"{BASE_URL}/api/kombinasyonlar/clear")
        requests.post(
            f"{BASE_URL}/api/kombinasyonlar/generate",
            json={"num_combinations": 10}
        )
        
        response = requests.get(f"{BASE_URL}/api/kombinasyonlar/combination/999")
        assert response.status_code == 404


# Cleanup fixture
@pytest.fixture(scope="module", autouse=True)
def cleanup():
    """Cleanup after all tests"""
    yield
    # Clear cache after tests
    requests.post(f"{BASE_URL}/api/kombinasyonlar/clear")
