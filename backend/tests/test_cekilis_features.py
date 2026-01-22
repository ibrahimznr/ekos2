"""
Test suite for Çekiliş (Raffle) features:
- Draws API (Çekiliş Havuzu)
- Vocabulary API (İngilizce Kelime Havuzu)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://raffle-games-1.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "ibrahimznrmak@gmail.com"
TEST_PASSWORD = "Szd.dl_34"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


# ==================== DRAWS API TESTS ====================

class TestDrawsAPI:
    """Tests for Çekiliş Havuzu (Draws) API"""
    
    created_draw_id = None
    
    def test_list_draws(self, auth_headers):
        """Test GET /api/draws - List all draws"""
        response = requests.get(f"{BASE_URL}/api/draws", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} draws")
    
    def test_create_draw(self, auth_headers):
        """Test POST /api/draws - Create new draw"""
        draw_data = {
            "name": f"TEST_Çekiliş_{uuid.uuid4().hex[:8]}",
            "main_count": 5,
            "backup_count": 3
        }
        response = requests.post(
            f"{BASE_URL}/api/draws",
            json=draw_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == draw_data["name"]
        assert data["main_count"] == 5
        assert data["backup_count"] == 3
        assert data["status"] == "pending"
        TestDrawsAPI.created_draw_id = data["id"]
        print(f"Created draw: {data['id']}")
    
    def test_get_draw_detail(self, auth_headers):
        """Test GET /api/draws/{draw_id} - Get draw details"""
        if not TestDrawsAPI.created_draw_id:
            pytest.skip("No draw created")
        
        response = requests.get(
            f"{BASE_URL}/api/draws/{TestDrawsAPI.created_draw_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TestDrawsAPI.created_draw_id
        print(f"Draw detail: {data['name']}")
    
    def test_add_participant(self, auth_headers):
        """Test POST /api/draws/{draw_id}/participants - Add participant"""
        if not TestDrawsAPI.created_draw_id:
            pytest.skip("No draw created")
        
        participant_data = {
            "id_no": f"TEST_{uuid.uuid4().hex[:8]}",
            "first_name": "Test",
            "last_name": "User",
            "contact": "test@example.com"
        }
        response = requests.post(
            f"{BASE_URL}/api/draws/{TestDrawsAPI.created_draw_id}/participants",
            json=participant_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["first_name"] == "Test"
        print(f"Added participant: {data['id']}")
    
    def test_list_participants(self, auth_headers):
        """Test GET /api/draws/{draw_id}/participants - List participants"""
        if not TestDrawsAPI.created_draw_id:
            pytest.skip("No draw created")
        
        response = requests.get(
            f"{BASE_URL}/api/draws/{TestDrawsAPI.created_draw_id}/participants",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        print(f"Found {len(data)} participants")
    
    def test_execute_draw_insufficient_participants(self, auth_headers):
        """Test POST /api/draws/{draw_id}/execute - Should fail with insufficient participants"""
        if not TestDrawsAPI.created_draw_id:
            pytest.skip("No draw created")
        
        response = requests.post(
            f"{BASE_URL}/api/draws/{TestDrawsAPI.created_draw_id}/execute",
            headers=auth_headers
        )
        # Should fail because we need 5+3=8 participants but only have 1
        assert response.status_code == 400
        data = response.json()
        assert "Yetersiz katılımcı" in data.get("detail", "")
        print("Correctly rejected execution with insufficient participants")
    
    def test_delete_draw(self, auth_headers):
        """Test DELETE /api/draws/{draw_id} - Delete draw"""
        if not TestDrawsAPI.created_draw_id:
            pytest.skip("No draw created")
        
        response = requests.delete(
            f"{BASE_URL}/api/draws/{TestDrawsAPI.created_draw_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"Deleted draw: {TestDrawsAPI.created_draw_id}")
        
        # Verify deletion
        response = requests.get(
            f"{BASE_URL}/api/draws/{TestDrawsAPI.created_draw_id}",
            headers=auth_headers
        )
        assert response.status_code == 404


# ==================== VOCABULARY API TESTS ====================

class TestVocabularyAPI:
    """Tests for İngilizce Kelime Havuzu (Vocabulary) API"""
    
    created_word_id = None
    
    def test_list_words(self, auth_headers):
        """Test GET /api/vocabulary - List all words"""
        response = requests.get(f"{BASE_URL}/api/vocabulary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} words")
    
    def test_add_word(self, auth_headers):
        """Test POST /api/vocabulary - Add new word"""
        word_data = {
            "word": f"test_{uuid.uuid4().hex[:6]}",
            "meaning": "Test anlamı",
            "sentence": "This is a test sentence.",
            "word_type": "noun"
        }
        response = requests.post(
            f"{BASE_URL}/api/vocabulary",
            json=word_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["word"] == word_data["word"]
        assert data["meaning"] == word_data["meaning"]
        TestVocabularyAPI.created_word_id = data["id"]
        print(f"Added word: {data['word']}")
    
    def test_get_word(self, auth_headers):
        """Test GET /api/vocabulary/{word_id} - Get word details"""
        if not TestVocabularyAPI.created_word_id:
            pytest.skip("No word created")
        
        response = requests.get(
            f"{BASE_URL}/api/vocabulary/{TestVocabularyAPI.created_word_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TestVocabularyAPI.created_word_id
        print(f"Word detail: {data['word']}")
    
    def test_search_word(self, auth_headers):
        """Test GET /api/vocabulary/search - Search words"""
        response = requests.get(
            f"{BASE_URL}/api/vocabulary/search?q=test",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "found" in data
        assert "suggestions" in data
        print(f"Search result: found={data['found']}")
    
    def test_update_word(self, auth_headers):
        """Test PUT /api/vocabulary/{word_id} - Update word"""
        if not TestVocabularyAPI.created_word_id:
            pytest.skip("No word created")
        
        update_data = {
            "meaning": "Updated test meaning"
        }
        response = requests.put(
            f"{BASE_URL}/api/vocabulary/{TestVocabularyAPI.created_word_id}",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["meaning"] == "Updated test meaning"
        print(f"Updated word meaning")
    
    def test_get_statistics(self, auth_headers):
        """Test GET /api/vocabulary/statistics - Get vocabulary statistics"""
        response = requests.get(
            f"{BASE_URL}/api/vocabulary/statistics",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_words" in data
        assert "total_reviews" in data
        print(f"Statistics: {data['total_words']} words, {data['total_reviews']} reviews")
    
    def test_quiz_generate_insufficient_words(self, auth_headers):
        """Test GET /api/vocabulary/quiz/generate - Should fail with insufficient words"""
        response = requests.get(
            f"{BASE_URL}/api/vocabulary/quiz/generate",
            headers=auth_headers
        )
        # May fail if less than 5 words
        if response.status_code == 400:
            data = response.json()
            assert "en az 5 kelime" in data.get("detail", "").lower()
            print("Correctly rejected quiz generation with insufficient words")
        else:
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 5
            print("Quiz generated successfully")
    
    def test_delete_word(self, auth_headers):
        """Test DELETE /api/vocabulary/{word_id} - Delete word"""
        if not TestVocabularyAPI.created_word_id:
            pytest.skip("No word created")
        
        response = requests.delete(
            f"{BASE_URL}/api/vocabulary/{TestVocabularyAPI.created_word_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"Deleted word: {TestVocabularyAPI.created_word_id}")
        
        # Verify deletion
        response = requests.get(
            f"{BASE_URL}/api/vocabulary/{TestVocabularyAPI.created_word_id}",
            headers=auth_headers
        )
        assert response.status_code == 404


# ==================== INTEGRATION TESTS ====================

class TestDrawsIntegration:
    """Integration tests for complete draw workflow"""
    
    def test_complete_draw_workflow(self, auth_headers):
        """Test complete draw workflow: create -> add participants -> execute -> get results"""
        # 1. Create draw
        draw_data = {
            "name": f"TEST_Integration_{uuid.uuid4().hex[:8]}",
            "main_count": 2,
            "backup_count": 1
        }
        response = requests.post(
            f"{BASE_URL}/api/draws",
            json=draw_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        draw_id = response.json()["id"]
        print(f"Created draw: {draw_id}")
        
        # 2. Add 3 participants (2 main + 1 backup)
        for i in range(3):
            participant_data = {
                "id_no": f"INT_TEST_{i}_{uuid.uuid4().hex[:6]}",
                "first_name": f"Test{i}",
                "last_name": f"User{i}",
                "contact": f"test{i}@example.com"
            }
            response = requests.post(
                f"{BASE_URL}/api/draws/{draw_id}/participants",
                json=participant_data,
                headers=auth_headers
            )
            assert response.status_code == 200
        print("Added 3 participants")
        
        # 3. Execute draw
        response = requests.post(
            f"{BASE_URL}/api/draws/{draw_id}/execute",
            headers=auth_headers
        )
        assert response.status_code == 200
        result = response.json()
        assert len(result["winners"]) == 2
        assert len(result["backups"]) == 1
        print(f"Draw executed: {len(result['winners'])} winners, {len(result['backups'])} backups")
        
        # 4. Get results
        response = requests.get(
            f"{BASE_URL}/api/draws/{draw_id}/results",
            headers=auth_headers
        )
        assert response.status_code == 200
        results = response.json()
        assert len(results["winners"]) == 2
        print("Results retrieved successfully")
        
        # 5. Verify draw status is completed
        response = requests.get(
            f"{BASE_URL}/api/draws/{draw_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        draw = response.json()
        assert draw["status"] == "completed"
        print("Draw status is completed")
        
        # 6. Cleanup
        response = requests.delete(
            f"{BASE_URL}/api/draws/{draw_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        print("Cleanup completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
