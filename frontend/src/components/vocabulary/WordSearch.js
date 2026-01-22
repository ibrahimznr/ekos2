import React, { useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';

const WordSearch = ({ onSearch }) => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();

        if (!query.trim()) {
            alert('Lütfen bir kelime girin!');
            return;
        }

        setIsLoading(true);
        try {
            const searchResult = await onSearch(query);
            setResult(searchResult);
        } catch (error) {
            alert('Arama sırasında bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
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

    return (
        <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Search className="h-6 w-6 text-blue-600" />
                Kelime Ara
            </h2>

            <form onSubmit={handleSearch} className="mb-6">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Aranacak kelimeyi girin..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-8 rounded-md hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Aranıyor...
                            </>
                        ) : (
                            <>
                                <Search className="h-5 w-5" />
                                Ara
                            </>
                        )}
                    </button>
                </div>
            </form>

            {result && (
                <div className="space-y-6">
                    {result.found && result.exact_match ? (
                        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="bg-green-100 rounded-full p-2">
                                    <Search className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-green-900 mb-2 flex items-center gap-2">
                                        {result.exact_match.word}
                                        {result.exact_match.word_type && (
                                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                                {getWordTypeLabel(result.exact_match.word_type)}
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-green-800 text-lg mb-2">{result.exact_match.meaning}</p>
                                    {result.exact_match.sentence && (
                                        <p className="text-green-700 italic mb-3">
                                            📝 "{result.exact_match.sentence}"
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-green-700">
                                        <span>📅 {formatDate(result.exact_match.added_date)}</span>
                                        <span>🔄 {result.exact_match.review_count} tekrar</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                                <div>
                                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                                        Kelime Bulunamadı
                                    </h3>
                                    <p className="text-yellow-800">
                                        "{query}" kelimesi listenizde bulunamadı.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {result.suggestions && result.suggestions.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Benzer Kelimeler:
                            </h3>
                            <div className="space-y-3">
                                {result.suggestions.map((word) => (
                                    <div
                                        key={word.id}
                                        className="bg-blue-50 border border-blue-200 p-4 rounded-lg hover:bg-blue-100 transition"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                                                    {word.word}
                                                    {word.word_type && (
                                                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                            {getWordTypeLabel(word.word_type)}
                                                        </span>
                                                    )}
                                                </h4>
                                                <p className="text-blue-800">{word.meaning}</p>
                                                {word.sentence && (
                                                    <p className="text-sm text-blue-700 italic mt-2">
                                                        📝 "{word.sentence}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WordSearch;
