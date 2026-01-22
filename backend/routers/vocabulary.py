"""
İngilizce Kelime Havuzu Router
Kelime öğrenme ve quiz sistemi için API endpoint'leri
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import random
import uuid
from difflib import get_close_matches

from database import db
from routers.auth import get_current_user

router = APIRouter(prefix="/vocabulary", tags=["vocabulary"])


# Models
class WordCreate(BaseModel):
    word: str = Field(min_length=1, max_length=100)
    meaning: str = Field(min_length=1, max_length=500)
    sentence: Optional[str] = ""
    word_type: Optional[str] = ""  # noun, verb, adjective, adverb


class WordUpdate(BaseModel):
    word: Optional[str] = None
    meaning: Optional[str] = None
    sentence: Optional[str] = None
    word_type: Optional[str] = None


class QuizAnswer(BaseModel):
    word_id: str
    answer: str


class QuizSubmit(BaseModel):
    answers: List[QuizAnswer]


class SentencePractice(BaseModel):
    sentence: str


@router.post("")
async def add_word(word_data: WordCreate, current_user=Depends(get_current_user)):
    """Yeni kelime ekle"""
    # Check if word already exists for this user
    existing = await db.vocabulary.find_one({
        "user_id": current_user.username,
        "word": word_data.word.lower()
    })
    
    if existing:
        raise HTTPException(status_code=400, detail=f"'{word_data.word}' zaten kelime listenizde mevcut")
    
    word_dict = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.username,
        "word": word_data.word.lower(),
        "meaning": word_data.meaning,
        "sentence": word_data.sentence or "",
        "word_type": word_data.word_type or "",
        "added_date": datetime.now(timezone.utc).isoformat(),
        "review_count": 0,
        "last_reviewed": None
    }
    
    await db.vocabulary.insert_one(word_dict)
    
    word_dict.pop('_id', None)
    word_dict['added_date'] = datetime.fromisoformat(word_dict['added_date'])
    return word_dict


@router.get("")
async def list_words(current_user=Depends(get_current_user)):
    """Tüm kelimeleri listele"""
    words = await db.vocabulary.find(
        {"user_id": current_user.username},
        {"_id": 0}
    ).sort("added_date", -1).to_list(length=None)
    
    for word in words:
        word['added_date'] = datetime.fromisoformat(word['added_date'])
        if word.get('last_reviewed'):
            word['last_reviewed'] = datetime.fromisoformat(word['last_reviewed'])
    
    return words


@router.get("/search")
async def search_word(q: str = Query(..., min_length=1), current_user=Depends(get_current_user)):
    """Kelime ara (fuzzy matching ile)"""
    # Exact match
    word = await db.vocabulary.find_one({
        "user_id": current_user.username,
        "word": q.lower()
    }, {"_id": 0})
    
    if word:
        word['added_date'] = datetime.fromisoformat(word['added_date'])
        if word.get('last_reviewed'):
            word['last_reviewed'] = datetime.fromisoformat(word['last_reviewed'])
        return {
            "found": True,
            "exact_match": word,
            "suggestions": []
        }
    
    # Fuzzy match
    all_words = await db.vocabulary.find(
        {"user_id": current_user.username},
        {"_id": 0, "word": 1, "meaning": 1}
    ).to_list(length=None)
    
    word_list = [w['word'] for w in all_words]
    matches = get_close_matches(q.lower(), word_list, n=5, cutoff=0.6)
    
    suggestions = []
    if matches:
        for match in matches:
            word_data = await db.vocabulary.find_one({
                "user_id": current_user.username,
                "word": match
            }, {"_id": 0})
            if word_data:
                word_data['added_date'] = datetime.fromisoformat(word_data['added_date'])
                if word_data.get('last_reviewed'):
                    word_data['last_reviewed'] = datetime.fromisoformat(word_data['last_reviewed'])
                suggestions.append(word_data)
    
    return {
        "found": False,
        "exact_match": None,
        "suggestions": suggestions
    }


@router.get("/quiz/generate")
async def generate_quiz(current_user=Depends(get_current_user)):
    """5 soruluk quiz oluştur"""
    words = await db.vocabulary.find(
        {"user_id": current_user.username},
        {"_id": 0}
    ).to_list(length=None)
    
    if len(words) < 5:
        raise HTTPException(
            status_code=400, 
            detail=f"Quiz için en az 5 kelime gerekli. Şu an {len(words)} kelimeniz var."
        )
    
    # Randomly select 5 words
    selected_words = random.sample(words, 5)
    
    questions = []
    for word in selected_words:
        questions.append({
            "word_id": word['id'],
            "meaning": word['meaning'],
            "correct_answer": word['word']
        })
    
    return questions


@router.post("/quiz/submit")
async def submit_quiz(quiz_data: QuizSubmit, current_user=Depends(get_current_user)):
    """Quiz cevaplarını değerlendir"""
    score = 0
    results = []
    
    for answer in quiz_data.answers:
        word = await db.vocabulary.find_one({
            "id": answer.word_id,
            "user_id": current_user.username
        }, {"_id": 0})
        
        if not word:
            continue
        
        is_correct = answer.answer.lower().strip() == word['word'].lower().strip()
        if is_correct:
            score += 1
        
        results.append({
            "word_id": answer.word_id,
            "word": word['word'],
            "meaning": word['meaning'],
            "user_answer": answer.answer,
            "correct": is_correct,
            "sentence": word.get('sentence', '')
        })
        
        # Update review count
        await db.vocabulary.update_one(
            {"id": answer.word_id},
            {
                "$inc": {"review_count": 1},
                "$set": {"last_reviewed": datetime.now(timezone.utc).isoformat()}
            }
        )
    
    return {
        "score": score,
        "total": len(quiz_data.answers),
        "percentage": round((score / len(quiz_data.answers)) * 100, 2) if quiz_data.answers else 0,
        "results": results
    }


@router.post("/practice/sentence")
async def practice_sentence(practice_data: SentencePractice, current_user=Depends(get_current_user)):
    """Cümle pratiği - cümleyi analiz et"""
    sentence = practice_data.sentence.strip()
    
    if not sentence:
        raise HTTPException(status_code=400, detail="Cümle boş olamaz")
    
    # Get 3 random words
    words = await db.vocabulary.find(
        {"user_id": current_user.username},
        {"_id": 0}
    ).to_list(length=None)
    
    if len(words) < 3:
        raise HTTPException(
            status_code=400,
            detail=f"Pratik için en az 3 kelime gerekli. Şu an {len(words)} kelimeniz var."
        )
    
    selected_words = random.sample(words, min(3, len(words)))
    target_words = [w['word'] for w in selected_words]
    
    # Analyze sentence
    feedback = analyze_sentence(sentence, target_words)
    
    return {
        "sentence": sentence,
        "target_words": [
            {"word": w['word'], "meaning": w['meaning']} 
            for w in selected_words
        ],
        "feedback": feedback
    }


def analyze_sentence(sentence: str, target_words: List[str]) -> List[str]:
    """Cümleyi analiz et ve geri bildirim ver"""
    sentence_lower = sentence.lower()
    feedback = []
    
    # Check word usage
    used_words = []
    for word in target_words:
        if word in sentence_lower:
            used_words.append(word)
    
    if len(used_words) < len(target_words):
        missing = set(target_words) - set(used_words)
        feedback.append(f"⚠️ Kullanmanız gereken bazı kelimeleri kullanmadınız: {', '.join(missing)}")
    else:
        feedback.append("✅ Tüm hedef kelimeleri kullandınız!")
    
    # Basic grammar checks
    if not sentence[0].isupper():
        feedback.append("⚠️ Cümle büyük harfle başlamalı")
    
    if not sentence.endswith(('.', '!', '?')):
        feedback.append("⚠️ Cümle noktalama işaretiyle bitmeli (., !, ?)")
    
    # Length check
    word_count = len(sentence.split())
    if word_count < 3:
        feedback.append("💡 Cümlenizi biraz daha uzatabilirsiniz")
    elif word_count >= 5:
        feedback.append("👍 İyi bir cümle uzunluğu")
    
    # Final evaluation
    if len(used_words) == len(target_words) and sentence[0].isupper() and sentence.endswith(('.', '!', '?')):
        feedback.append("🎉 Harika bir cümle! Dil bilgisi kurallarına uygun.")
    
    return feedback


@router.get("/statistics")
async def get_statistics(current_user=Depends(get_current_user)):
    """Kelime istatistiklerini getir"""
    words = await db.vocabulary.find(
        {"user_id": current_user.username},
        {"_id": 0}
    ).to_list(length=None)
    
    if not words:
        return {
            "total_words": 0,
            "total_reviews": 0,
            "most_reviewed_word": None,
            "word_type_distribution": {},
            "recent_words": []
        }
    
    # Calculate statistics
    total_words = len(words)
    total_reviews = sum(w.get('review_count', 0) for w in words)
    
    # Most reviewed word
    most_reviewed = max(words, key=lambda x: x.get('review_count', 0))
    most_reviewed_dict = {
        "word": most_reviewed['word'],
        "meaning": most_reviewed['meaning'],
        "review_count": most_reviewed.get('review_count', 0)
    }
    
    # Word type distribution
    type_distribution = {}
    for word in words:
        word_type = word.get('word_type') or 'belirsiz'
        type_distribution[word_type] = type_distribution.get(word_type, 0) + 1
    
    # Recent words (last 5)
    recent_words_data = sorted(
        words, 
        key=lambda x: x['added_date'], 
        reverse=True
    )[:5]
    
    recent_words = []
    for word_data in recent_words_data:
        word_data['added_date'] = datetime.fromisoformat(word_data['added_date'])
        if word_data.get('last_reviewed'):
            word_data['last_reviewed'] = datetime.fromisoformat(word_data['last_reviewed'])
        recent_words.append(word_data)
    
    return {
        "total_words": total_words,
        "total_reviews": total_reviews,
        "most_reviewed_word": most_reviewed_dict,
        "word_type_distribution": type_distribution,
        "recent_words": recent_words
    }


@router.get("/{word_id}")
async def get_word(word_id: str, current_user=Depends(get_current_user)):
    """Belirli bir kelimeyi getir"""
    word = await db.vocabulary.find_one({
        "id": word_id,
        "user_id": current_user.username
    }, {"_id": 0})
    
    if not word:
        raise HTTPException(status_code=404, detail="Kelime bulunamadı")
    
    word['added_date'] = datetime.fromisoformat(word['added_date'])
    if word.get('last_reviewed'):
        word['last_reviewed'] = datetime.fromisoformat(word['last_reviewed'])
    
    return word


@router.put("/{word_id}")
async def update_word(word_id: str, update_data: WordUpdate, current_user=Depends(get_current_user)):
    """Kelimeyi güncelle"""
    # Check if word exists
    existing = await db.vocabulary.find_one({
        "id": word_id,
        "user_id": current_user.username
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Kelime bulunamadı")
    
    # Prepare update dict (only non-None values)
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_dict:
        await db.vocabulary.update_one(
            {"id": word_id, "user_id": current_user.username},
            {"$set": update_dict}
        )
    
    # Return updated word
    return await get_word(word_id, current_user)


@router.delete("/{word_id}")
async def delete_word(word_id: str, current_user=Depends(get_current_user)):
    """Kelimeyi sil"""
    result = await db.vocabulary.delete_one({
        "id": word_id,
        "user_id": current_user.username
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kelime bulunamadı")
    
    return {"success": True, "message": "Kelime başarıyla silindi"}
