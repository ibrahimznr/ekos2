import React, { useState } from 'react';
import { Lightbulb, Send } from 'lucide-react';

const PracticeMode = ({ onPracticeSentence }) => {
    const [sentence, setSentence] = useState('');
    const [practice, setPractice] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!sentence.trim()) {
            alert('Lütfen bir cümle girin!');
            return;
        }

        setIsLoading(true);
        try {
            const result = await onPracticeSentence(sentence);
            setPractice(result);
        } catch (error) {
            alert(error.response?.data?.detail || 'Cümle analiz edilirken bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewPractice = () => {
        setSentence('');
        setPractice(null);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-yellow-500" />
                Cümle Oluşturma Pratiği
            </h2>

            {!practice ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <p className="text-gray-700 mb-4">
                            Size verilen kelimeleri kullanarak bir İngilizce cümle oluşturun.
                            Cümleniz analiz edilecek ve geri bildirim alacaksınız.
                        </p>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cümlenizi Yazın
                        </label>
                        <textarea
                            value={sentence}
                            onChange={(e) => setSentence(e.target.value)}
                            placeholder="Örnek: I like to eat fresh apples every morning."
                            rows="4"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-md hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Analiz Ediliyor...
                            </>
                        ) : (
                            <>
                                <Send className="h-5 w-5" />
                                Analiz Et
                            </>
                        )}
                    </button>
                </form>
            ) : (
                <div className="space-y-6">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                        <h3 className="font-semibold text-blue-900 mb-2">Hedef Kelimeler:</h3>
                        <div className="flex flex-wrap gap-2">
                            {practice.target_words.map((word, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                                >
                                    {word.word} ({word.meaning})
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Cümleniz:</h3>
                        <p className="text-gray-700 italic">"{practice.sentence}"</p>
                    </div>

                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-3">📊 Analiz ve Geri Bildirim:</h3>
                        <div className="space-y-2">
                            {practice.feedback.map((feedback, index) => (
                                <div
                                    key={index}
                                    className={`p-3 rounded-md ${feedback.includes('✅') || feedback.includes('🎉')
                                        ? 'bg-green-50 text-green-800 border border-green-200'
                                        : feedback.includes('⚠️')
                                            ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                                            : feedback.includes('💡')
                                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                                : 'bg-gray-50 text-gray-800 border border-gray-200'
                                        }`}
                                >
                                    {feedback}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleNewPractice}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-md hover:from-green-600 hover:to-green-700 transition-all"
                    >
                        Yeni Pratik
                    </button>
                </div>
            )}
        </div>
    );
};

export default PracticeMode;
