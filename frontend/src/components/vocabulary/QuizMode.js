import React, { useState } from 'react';
import { Trophy, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

const QuizMode = ({ onGenerateQuiz, onSubmitQuiz }) => {
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);

    const startQuiz = async () => {
        setIsLoading(true);
        setResults(null);
        setAnswers({});
        setCurrentQuestion(0);
        try {
            const quizData = await onGenerateQuiz();
            setQuiz(quizData);
        } catch (error) {
            alert(error.response?.data?.detail || 'Quiz oluşturulurken bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerChange = (wordId, answer) => {
        setAnswers({
            ...answers,
            [wordId]: answer
        });
    };

    const handleSubmit = async () => {
        const answerList = quiz.map(q => ({
            word_id: q.word_id,
            answer: answers[q.word_id] || ''
        }));

        setIsLoading(true);
        try {
            const result = await onSubmitQuiz(answerList);
            setResults(result);
        } catch (error) {
            alert('Quiz değerlendirilirken bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const nextQuestion = () => {
        if (currentQuestion < quiz.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const prevQuestion = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    if (!quiz && !results) {
        return (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <Trophy className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Kelime Quiz Modu</h2>
                <p className="text-gray-600 mb-6">
                    5 soruluk bir quiz ile kendinizi test edin!
                </p>
                <button
                    onClick={startQuiz}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold py-3 px-8 rounded-md hover:from-yellow-600 hover:to-yellow-700 transition-all disabled:opacity-50"
                >
                    {isLoading ? 'Quiz Hazırlanıyor...' : 'Quiz Başlat'}
                </button>
            </div>
        );
    }

    if (results) {
        const percentage = results.percentage;
        const getGrade = () => {
            if (percentage >= 80) return { text: 'Mükemmel!', color: 'text-green-600', emoji: '🎉' };
            if (percentage >= 60) return { text: 'İyi!', color: 'text-blue-600', emoji: '👍' };
            if (percentage >= 40) return { text: 'Orta', color: 'text-yellow-600', emoji: '📚' };
            return { text: 'Çalışmaya Devam!', color: 'text-red-600', emoji: '💪' };
        };
        const grade = getGrade();

        return (
            <div className="bg-white rounded-lg shadow-md p-8">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">{grade.emoji}</div>
                    <h2 className={`text-3xl font-bold ${grade.color} mb-2`}>{grade.text}</h2>
                    <p className="text-2xl text-gray-700">
                        {results.score} / {results.total} Doğru
                    </p>
                    <p className="text-lg text-gray-600 mt-2">%{percentage} Başarı</p>
                </div>

                <div className="space-y-4 mb-6">
                    {results.results.map((result, index) => (
                        <div
                            key={result.word_id}
                            className={`p-4 rounded-lg border-2 ${result.correct
                                ? 'border-green-200 bg-green-50'
                                : 'border-red-200 bg-red-50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {result.correct ? (
                                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                                ) : (
                                    <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                                )}
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">
                                        Soru {index + 1}: {result.meaning}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Doğru Cevap: <span className="font-semibold">{result.word}</span>
                                    </p>
                                    {!result.correct && (
                                        <p className="text-sm text-red-600 mt-1">
                                            Sizin Cevabınız: <span className="font-semibold">{result.user_answer || '(Boş)'}</span>
                                        </p>
                                    )}
                                    {result.sentence && (
                                        <p className="text-sm text-gray-600 italic mt-2">
                                            📝 "{result.sentence}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={startQuiz}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold py-3 px-6 rounded-md hover:from-yellow-600 hover:to-yellow-700 transition-all flex items-center justify-center gap-2"
                >
                    <RotateCcw className="h-5 w-5" />
                    Yeni Quiz
                </button>
            </div>
        );
    }

    const question = quiz[currentQuestion];

    return (
        <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Quiz</h2>
                    <span className="text-sm text-gray-600">
                        Soru {currentQuestion + 1} / {quiz.length}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${((currentQuestion + 1) / quiz.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            <div className="mb-8">
                <p className="text-lg text-gray-700 mb-4">
                    "{question.meaning}" kelimesinin İngilizce karşılığı nedir?
                </p>
                <input
                    type="text"
                    value={answers[question.word_id] || ''}
                    onChange={(e) => handleAnswerChange(question.word_id, e.target.value)}
                    placeholder="Cevabınızı yazın..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-900"
                    autoFocus
                />
            </div>

            <div className="flex gap-3">
                <button
                    onClick={prevQuestion}
                    disabled={currentQuestion === 0}
                    className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-md hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Önceki
                </button>
                {currentQuestion < quiz.length - 1 ? (
                    <button
                        onClick={nextQuestion}
                        className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-blue-700 transition-all"
                    >
                        Sonraki
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-md hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
                    >
                        {isLoading ? 'Değerlendiriliyor...' : 'Quiz\'i Bitir'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizMode;
