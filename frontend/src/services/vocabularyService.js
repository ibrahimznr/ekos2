import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Create axios instance with auth
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const vocabularyService = {
    // Add new word
    addWord: async (wordData) => {
        const response = await axios.post(
            `${API_URL}/api/vocabulary`,
            wordData,
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    // Get all words
    getWords: async () => {
        const response = await axios.get(
            `${API_URL}/api/vocabulary`,
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    // Get single word
    getWord: async (wordId) => {
        const response = await axios.get(
            `${API_URL}/api/vocabulary/${wordId}`,
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    // Search word
    searchWord: async (query) => {
        const response = await axios.get(
            `${API_URL}/api/vocabulary/search?q=${encodeURIComponent(query)}`,
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    // Update word
    updateWord: async (wordId, updateData) => {
        const response = await axios.put(
            `${API_URL}/api/vocabulary/${wordId}`,
            updateData,
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    // Delete word
    deleteWord: async (wordId) => {
        const response = await axios.delete(
            `${API_URL}/api/vocabulary/${wordId}`,
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    // Generate quiz
    generateQuiz: async () => {
        const response = await axios.get(
            `${API_URL}/api/vocabulary/quiz/generate`,
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    // Submit quiz
    submitQuiz: async (answers) => {
        const response = await axios.post(
            `${API_URL}/api/vocabulary/quiz/submit`,
            { answers },
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    // Practice sentence
    practiceSentence: async (sentence) => {
        const response = await axios.post(
            `${API_URL}/api/vocabulary/practice/sentence`,
            { sentence },
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    // Get statistics
    getStatistics: async () => {
        const response = await axios.get(
            `${API_URL}/api/vocabulary/statistics`,
            { headers: getAuthHeader() }
        );
        return response.data;
    },
};

export default vocabularyService;
