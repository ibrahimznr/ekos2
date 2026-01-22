import React from 'react';
import { BarChart3, TrendingUp, Award, BookOpen } from 'lucide-react';

const VocabularyStats = ({ statistics }) => {
    if (!statistics) {
        return (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">İstatistikler yükleniyor...</p>
            </div>
        );
    }

    const getTypeColor = (type) => {
        const colors = {
            'noun': 'bg-blue-100 text-blue-800',
            'verb': 'bg-green-100 text-green-800',
            'adjective': 'bg-purple-100 text-purple-800',
            'adverb': 'bg-orange-100 text-orange-800',
            'belirsiz': 'bg-gray-100 text-gray-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    const getTypeLabel = (type) => {
        const labels = {
            'noun': 'İsim',
            'verb': 'Fiil',
            'adjective': 'Sıfat',
            'adverb': 'Zarf',
            'belirsiz': 'Belirsiz'
        };
        return labels[type] || type;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <BookOpen className="h-8 w-8" />
                        <span className="text-3xl font-bold">{statistics.total_words}</span>
                    </div>
                    <p className="text-blue-100 text-sm">Toplam Kelime</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="h-8 w-8" />
                        <span className="text-3xl font-bold">{statistics.total_reviews}</span>
                    </div>
                    <p className="text-green-100 text-sm">Toplam Tekrar</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Award className="h-8 w-8" />
                        <span className="text-3xl font-bold">
                            {statistics.most_reviewed_word?.review_count || 0}
                        </span>
                    </div>
                    <p className="text-purple-100 text-sm">En Çok Tekrar</p>
                </div>
            </div>

            {/* Most Reviewed Word */}
            {statistics.most_reviewed_word && statistics.most_reviewed_word.review_count > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Award className="h-6 w-6 text-yellow-500" />
                        En Çok Tekrarlanan Kelime
                    </h3>
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                        <p className="text-2xl font-bold text-gray-900">
                            {statistics.most_reviewed_word.word}
                        </p>
                        <p className="text-gray-700 mt-1">{statistics.most_reviewed_word.meaning}</p>
                        <p className="text-sm text-gray-600 mt-2">
                            🔄 {statistics.most_reviewed_word.review_count} kez tekrarlandı
                        </p>
                    </div>
                </div>
            )}

            {/* Word Type Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                    Kelime Türleri Dağılımı
                </h3>
                <div className="space-y-3">
                    {Object.entries(statistics.word_type_distribution).map(([type, count]) => {
                        const percentage = ((count / statistics.total_words) * 100).toFixed(1);
                        return (
                            <div key={type}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(type)}`}>
                                        {getTypeLabel(type)}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        {count} kelime ({percentage}%)
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Words */}
            {statistics.recent_words && statistics.recent_words.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-green-500" />
                        Son Eklenen Kelimeler
                    </h3>
                    <div className="space-y-3">
                        {statistics.recent_words.map((word) => (
                            <div
                                key={word.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                                <div>
                                    <p className="font-semibold text-gray-900">{word.word}</p>
                                    <p className="text-sm text-gray-600">{word.meaning}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">{formatDate(word.added_date)}</p>
                                    <p className="text-xs text-gray-500">🔄 {word.review_count} tekrar</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VocabularyStats;
