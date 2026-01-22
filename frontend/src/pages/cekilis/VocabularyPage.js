import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Lightbulb, Trophy, BarChart3 } from 'lucide-react';
import vocabularyService from '@/services/vocabularyService';
import WordList from '@/components/vocabulary/WordList';
import AddWordForm from '@/components/vocabulary/AddWordForm';
import WordSearch from '@/components/vocabulary/WordSearch';
import QuizMode from '@/components/vocabulary/QuizMode';
import PracticeMode from '@/components/vocabulary/PracticeMode';
import VocabularyStats from '@/components/vocabulary/VocabularyStats';
import Layout from '@/components/Layout';
import { toast } from 'sonner';

const VocabularyPage = () => {
    const [activeTab, setActiveTab] = useState('list');
    const [words, setWords] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'list') {
            loadWords();
        } else if (activeTab === 'stats') {
            loadStatistics();
        }
    }, [activeTab]);

    const loadWords = async () => {
        setIsLoading(true);
        try {
            const data = await vocabularyService.getWords();
            setWords(data);
        } catch (error) {
            console.error('Error loading words:', error);
            toast.error('Kelimeler yüklenirken bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const loadStatistics = async () => {
        setIsLoading(true);
        try {
            const data = await vocabularyService.getStatistics();
            setStatistics(data);
        } catch (error) {
            console.error('Error loading statistics:', error);
            toast.error('İstatistikler yüklenirken bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddWord = async (wordData) => {
        try {
            await vocabularyService.addWord(wordData);
            toast.success('Kelime başarıyla eklendi!');
            if (activeTab === 'list') {
                loadWords();
            }
            setActiveTab('list');
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Kelime eklenirken bir hata oluştu';
            toast.error(errorMessage);
            throw error;
        }
    };

    const handleDeleteWord = async (wordId) => {
        if (!window.confirm('Bu kelimeyi silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            await vocabularyService.deleteWord(wordId);
            toast.success('Kelime başarıyla silindi!');
            loadWords();
        } catch (error) {
            toast.error('Kelime silinirken bir hata oluştu');
        }
    };

    const handleEditWord = async (wordId, updateData) => {
        try {
            await vocabularyService.updateWord(wordId, updateData);
            toast.success('Kelime başarıyla güncellendi!');
            loadWords();
        } catch (error) {
            toast.error('Kelime güncellenirken bir hata oluştu');
        }
    };

    const handleSearchWord = async (query) => {
        return await vocabularyService.searchWord(query);
    };

    const handleGenerateQuiz = async () => {
        return await vocabularyService.generateQuiz();
    };

    const handleSubmitQuiz = async (answers) => {
        return await vocabularyService.submitQuiz(answers);
    };

    const handlePracticeSentence = async (sentence) => {
        return await vocabularyService.practiceSentence(sentence);
    };

    const tabs = [
        { id: 'list', name: 'Kelime Listesi', icon: BookOpen },
        { id: 'add', name: 'Kelime Ekle', icon: Plus },
        { id: 'search', name: 'Kelime Ara', icon: Search },
        { id: 'practice', name: 'Cümle Pratiği', icon: Lightbulb },
        { id: 'quiz', name: 'Quiz', icon: Trophy },
        { id: 'stats', name: 'İstatistikler', icon: BarChart3 },
    ];

    return (
        <Layout>
            <div className="space-y-6">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                        İngilizce Kelime Havuzu
                    </h1>
                    <p className="text-gray-600">
                        Kelimelerinizi ekleyin, pratik yapın ve kendinizi test edin!
                    </p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md">
                    <div className="flex flex-wrap border-b border-gray-200">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-medium transition-all ${activeTab === tab.id
                                            ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="hidden sm:inline">{tab.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div>
                    {isLoading && activeTab === 'list' ? (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Kelimeler yükleniyor...</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'list' && (
                                <WordList
                                    words={words}
                                    onDelete={handleDeleteWord}
                                    onEdit={handleEditWord}
                                />
                            )}
                            {activeTab === 'add' && <AddWordForm onAdd={handleAddWord} />}
                            {activeTab === 'search' && <WordSearch onSearch={handleSearchWord} />}
                            {activeTab === 'practice' && (
                                <PracticeMode onPracticeSentence={handlePracticeSentence} />
                            )}
                            {activeTab === 'quiz' && (
                                <QuizMode
                                    onGenerateQuiz={handleGenerateQuiz}
                                    onSubmitQuiz={handleSubmitQuiz}
                                />
                            )}
                            {activeTab === 'stats' && <VocabularyStats statistics={statistics} />}
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default VocabularyPage;
