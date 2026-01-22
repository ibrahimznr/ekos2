import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';

const AddWordForm = ({ onAdd }) => {
    const [formData, setFormData] = useState({
        word: '',
        meaning: '',
        sentence: '',
        word_type: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.word.trim() || !formData.meaning.trim()) {
            alert('Lütfen kelime ve anlamını girin!');
            return;
        }

        setIsSubmitting(true);
        try {
            await onAdd(formData);
            setFormData({
                word: '',
                meaning: '',
                sentence: '',
                word_type: ''
            });
        } catch (error) {
            console.error('Error adding word:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <PlusCircle className="h-6 w-6 text-green-600" />
                Yeni Kelime Ekle
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            İngilizce Kelime *
                        </label>
                        <input
                            type="text"
                            name="word"
                            value={formData.word}
                            onChange={handleChange}
                            placeholder="örn: apple"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Türkçe Anlamı *
                        </label>
                        <input
                            type="text"
                            name="meaning"
                            value={formData.meaning}
                            onChange={handleChange}
                            placeholder="örn: elma"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Örnek Cümle (Opsiyonel)
                    </label>
                    <input
                        type="text"
                        name="sentence"
                        value={formData.sentence}
                        onChange={handleChange}
                        placeholder="örn: I eat an apple every day."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kelime Türü (Opsiyonel)
                    </label>
                    <select
                        name="word_type"
                        value={formData.word_type}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                        <option value="">Seçiniz</option>
                        <option value="noun">İsim (Noun)</option>
                        <option value="verb">Fiil (Verb)</option>
                        <option value="adjective">Sıfat (Adjective)</option>
                        <option value="adverb">Zarf (Adverb)</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-md hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Ekleniyor...
                        </>
                    ) : (
                        <>
                            <PlusCircle className="h-5 w-5" />
                            Kelime Ekle
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default AddWordForm;
