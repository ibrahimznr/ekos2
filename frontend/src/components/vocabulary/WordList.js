import React, { useState } from 'react';
import { Trash2, Edit2, BookOpen } from 'lucide-react';

const WordList = ({ words, onDelete, onEdit }) => {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const handleEditClick = (word) => {
        setEditingId(word.id);
        setEditForm({
            word: word.word,
            meaning: word.meaning,
            sentence: word.sentence || '',
            word_type: word.word_type || ''
        });
    };

    const handleSaveEdit = async (wordId) => {
        await onEdit(wordId, editForm);
        setEditingId(null);
        setEditForm({});
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getWordTypeLabel = (type) => {
        const types = {
            'noun': 'İsim',
            'verb': 'Fiil',
            'adjective': 'Sıfat',
            'adverb': 'Zarf'
        };
        return types[type] || type;
    };

    if (!words || words.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">Henüz kelime eklenmemiş</p>
                <p className="text-gray-500 text-sm mt-2">Yeni kelime ekleyerek başlayın!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {words.map((word) => (
                <div
                    key={word.id}
                    className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                    {editingId === word.id ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        İngilizce Kelime
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.word}
                                        onChange={(e) => setEditForm({ ...editForm, word: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Türkçe Anlamı
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.meaning}
                                        onChange={(e) => setEditForm({ ...editForm, meaning: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Örnek Cümle
                                </label>
                                <input
                                    type="text"
                                    value={editForm.sentence}
                                    onChange={(e) => setEditForm({ ...editForm, sentence: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kelime Türü
                                </label>
                                <select
                                    value={editForm.word_type}
                                    onChange={(e) => setEditForm({ ...editForm, word_type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                >
                                    <option value="">Seçiniz</option>
                                    <option value="noun">İsim</option>
                                    <option value="verb">Fiil</option>
                                    <option value="adjective">Sıfat</option>
                                    <option value="adverb">Zarf</option>
                                </select>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={() => handleSaveEdit(word.id)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-gray-900">{word.word}</h3>
                                        {word.word_type && (
                                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                {getWordTypeLabel(word.word_type)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-700 mb-2">{word.meaning}</p>
                                    {word.sentence && (
                                        <p className="text-sm text-gray-600 italic mb-2">
                                            📝 "{word.sentence}"
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span>📅 {formatDate(word.added_date)}</span>
                                        <span>🔄 {word.review_count} tekrar</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditClick(word)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition"
                                        title="Düzenle"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(word.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition"
                                        title="Sil"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
};

export default WordList;
