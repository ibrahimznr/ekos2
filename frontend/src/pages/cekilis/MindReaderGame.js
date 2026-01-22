import React, { useState } from 'react';
import { Brain, RotateCcw, Sparkles, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/Layout';

const MindReaderGame = () => {
  const [step, setStep] = useState(0);
  const [durum1, setDurum1] = useState(null);
  const [durum2, setDurum2] = useState(null);
  const [bolumTam, setBolumTam] = useState('');
  const [tahmin, setTahmin] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const resetGame = () => {
    setStep(0);
    setDurum1(null);
    setDurum2(null);
    setBolumTam('');
    setTahmin(null);
    setShowResult(false);
  };

  const handleStep1 = (value) => {
    setDurum1(value);
    setStep(2);
  };

  const handleStep2 = (value) => {
    setDurum2(value);
    setStep(3);
  };

  const handleStep3 = () => {
    const bolum = parseInt(bolumTam, 10);
    if (isNaN(bolum) || bolum < 0) return;
    
    const result = 4 * bolum + (durum1 + durum2);
    setTahmin(result);
    setShowResult(true);
    setStep(4);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <Brain className="w-8 h-8" />
              <div>
                <h3 className="text-xl font-bold">Sayı Okuyucu</h3>
                <p className="text-sm text-purple-100">Aklından tuttuğun sayıyı tahmin edeyim!</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Progress Bar */}
            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    step >= s ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {step > 0 && (
              <div className="flex justify-end mb-4">
                <Button
                  onClick={resetGame}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Yeniden Başla
                </Button>
              </div>
            )}

            {/* Step 0: Start */}
            {step === 0 && (
              <div className="text-center py-8">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-purple-500" />
                </div>
                <h4 className="text-2xl font-bold text-gray-800 mb-3">Hazır mısın?</h4>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Aklından bir <span className="text-purple-600 font-semibold">tam sayı</span> tut (örn: 7, 15, 23...). 
                  Bana söyleme! Sadece birkaç basit soruya cevap ver, ben tahmin edeceğim.
                </p>
                <Button
                  onClick={() => setStep(1)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 text-lg"
                >
                  Sayıyı Tuttum, Başla!
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 1 */}
            {step === 1 && (
              <div className="py-4">
                <div className="bg-purple-50 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">1</span>
                    <h4 className="text-lg font-bold text-gray-800">Birinci Adım</h4>
                  </div>
                  <p className="text-gray-700 mb-4">
                    Tuttuğun sayıyı <span className="text-purple-600 font-semibold">3 ile çarp</span>, sonra <span className="text-purple-600 font-semibold">2'ye böl</span>.
                  </p>
                  <div className="bg-white rounded-lg p-4 mb-4 border border-purple-200">
                    <p className="text-sm text-gray-600">
                      <span className="text-amber-600 font-semibold">Örnek:</span> 5 tuttuysan → 5 × 3 = 15 → 15 ÷ 2 = 7.5 (buçuklu)
                    </p>
                  </div>
                </div>

                <p className="text-center text-gray-700 mb-4 font-medium">Sonuç buçuklu mu çıktı?</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => handleStep1(0)}
                    className="py-8 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-800"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl font-bold text-green-600">Hayır</span>
                      <span className="text-sm text-gray-500">Tam sayı çıktı</span>
                    </div>
                  </Button>
                  <Button
                    onClick={() => handleStep1(1)}
                    className="py-8 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-800"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl font-bold text-amber-500">Evet</span>
                      <span className="text-sm text-gray-500">Buçuklu çıktı (üste yuvarla)</span>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="py-4">
                <div className="bg-purple-50 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">2</span>
                    <h4 className="text-lg font-bold text-gray-800">İkinci Adım</h4>
                  </div>
                  <p className="text-gray-700 mb-4">
                    Şimdi elindeki {durum1 === 1 ? 'yuvarlanmış' : ''} sayıyı tekrar <span className="text-purple-600 font-semibold">3 ile çarp</span>, sonra <span className="text-purple-600 font-semibold">2'ye böl</span>.
                  </p>
                  <div className="bg-white rounded-lg p-4 mb-4 border border-purple-200">
                    <p className="text-sm text-gray-600">
                      <span className="text-amber-600 font-semibold">Örnek:</span> Elinde 8 varsa → 8 × 3 = 24 → 24 ÷ 2 = 12 (tam sayı)
                    </p>
                  </div>
                </div>

                <p className="text-center text-gray-700 mb-4 font-medium">Sonuç buçuklu mu çıktı?</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => handleStep2(0)}
                    className="py-8 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-800"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl font-bold text-green-600">Hayır</span>
                      <span className="text-sm text-gray-500">Tam sayı çıktı</span>
                    </div>
                  </Button>
                  <Button
                    onClick={() => handleStep2(2)}
                    className="py-8 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-800"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl font-bold text-amber-500">Evet</span>
                      <span className="text-sm text-gray-500">Buçuklu çıktı (üste yuvarla)</span>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="py-4">
                <div className="bg-purple-50 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">3</span>
                    <h4 className="text-lg font-bold text-gray-800">Son Adım</h4>
                  </div>
                  <p className="text-gray-700 mb-4">
                    Şimdi elindeki {durum2 === 2 ? <span className="text-amber-600">yuvarlamadan önceki</span> : ''} sayıyı <span className="text-purple-600 font-semibold">9'a böl</span>.
                  </p>
                  <div className="bg-white rounded-lg p-4 mb-4 border border-purple-200">
                    <p className="text-sm text-gray-600">
                      <span className="text-amber-600 font-semibold">Örnek:</span> 17 ÷ 9 = 1.88... → Tam kısım: <span className="font-bold">1</span>
                    </p>
                  </div>
                </div>

                <p className="text-center text-gray-700 mb-4 font-medium">Bölümün tam kısmını yaz:</p>
                
                <div className="flex gap-4 justify-center items-center">
                  <input
                    type="number"
                    value={bolumTam}
                    onChange={(e) => setBolumTam(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-32 h-16 text-center text-3xl font-bold bg-white border-2 border-purple-300 rounded-xl text-gray-800 focus:border-purple-500 focus:outline-none"
                  />
                  <Button
                    onClick={handleStep3}
                    disabled={bolumTam === '' || parseInt(bolumTam, 10) < 0}
                    className="h-16 px-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Tahmin Et!
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Result */}
            {step === 4 && showResult && (
              <div className="py-8 text-center">
                <div className="relative">
                  <div className="relative">
                    <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
                      <span className="text-5xl font-bold text-white">{tahmin}</span>
                    </div>
                    <h4 className="text-2xl font-bold text-gray-800 mb-2">
                      ✨ Aklından tuttuğun sayı: <span className="text-purple-600">{tahmin}</span>
                    </h4>
                    <p className="text-gray-600 mb-6">Doğru mu tahmin ettim?</p>
                    
                    <div className="flex gap-4 justify-center">
                      <Button
                        onClick={resetGame}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Tekrar Oyna
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MindReaderGame;
