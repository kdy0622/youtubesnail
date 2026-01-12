
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { ThumbnailStrategy, HistoryItem } from './types';
import ThumbnailEditor from './components/ThumbnailEditor';
import { Sparkles, History, Youtube, Loader2, Edit3, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ThumbnailStrategy | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  // 제공해주신 API 키 고정
  const API_KEY = "AIzaSyDnXYUz3RBvu3YrrZrh8hzq4DQQhpnXnT4";

  useEffect(() => {
    // 마운트 직후 준비 상태로 변경하여 초기 백지 현상 방지
    setIsReady(true);
  }, []);

  const generateEverything = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setGeneratedImageUrl(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      
      // 1. 텍스트 전략 생성 (Gemini 3 Flash)
      const textResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze: "${input}"`,
        config: {
          systemInstruction: `You are a YouTube CTR Expert. Provide high-impact strategies in Korean.
          JSON Output required:
          {
            "title": "Korean Title",
            "subtitle": "Korean Sub-copy",
            "badge": "Short Impact Word",
            "image_prompt": "English Visual Prompt"
          }`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              badge: { type: Type.STRING },
              image_prompt: { type: Type.STRING },
            },
            required: ["title", "subtitle", "badge", "image_prompt"]
          },
        },
      });

      const strategyData = JSON.parse(textResponse.text);
      setResult(strategyData);

      // 2. 배경 이미지 생성 (Gemini 2.5 Flash Image)
      try {
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: `A cinematic and high-quality background for: ${strategyData.image_prompt}. Professional lighting, 4k resolution, aesthetic background only.` }]
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9"
            }
          }
        });

        if (imageResponse.candidates?.[0]?.content?.parts) {
          for (const part of imageResponse.candidates[0].content.parts) {
            if (part.inlineData) {
              setGeneratedImageUrl(`data:image/png;base64,${part.inlineData.data}`);
              break;
            }
          }
        }
      } catch (imgErr) {
        console.error("Image gen failed, using fallback color", imgErr);
      }
      
      const newHistoryItem: HistoryItem = {
        ...strategyData,
        id: Date.now().toString(),
        timestamp: Date.now(),
        input: input
      };
      setHistory(prev => [newHistoryItem, ...prev]);

    } catch (error: any) {
      console.error("Analysis Failed:", error);
      alert("전략 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // 백지 현상 방지를 위해 최소한의 레이아웃은 무조건 렌더링
  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8 min-h-screen">
      <header className="text-center mb-8">
        <div className="flex justify-center items-center gap-2 mb-2">
          <Youtube className="text-red-600 w-8 h-8" />
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            AI <span className="gradient-text">유튜브 썸네일러</span>
          </h1>
        </div>
        <p className="text-gray-500 font-medium">분석 버튼 하나로 매력적인 썸네일을 자동 완성합니다.</p>
      </header>

      {!isReady ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-red-500" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <section className="glass-card rounded-2xl p-6 shadow-xl border-t-4 border-t-red-500">
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">영상 주제 또는 내용을 입력하세요</label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="예: 아이폰 16 한 달 사용기, 가성비 맛집 TOP 5 등..."
                  className="w-full h-24 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none resize-none text-gray-800 text-sm"
                />
              </div>
              <button
                onClick={generateEverything}
                disabled={loading || !input.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                <span>{loading ? 'AI 분석 중...' : '전략 및 이미지 생성'}</span>
              </button>
            </section>

            {result && (
              <div className="animate-in slide-in-from-left duration-500 space-y-6">
                <div className="flex items-center gap-2 text-xl font-bold text-gray-800">
                  <Edit3 size={20} className="text-red-500" /> 커스텀 편집기
                </div>
                <ThumbnailEditor strategy={result} bgImage={generatedImageUrl} isImageLoading={loading && !generatedImageUrl} />
              </div>
            )}

            {history.length > 0 && (
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold flex items-center gap-2 text-gray-500"><History size={18} /> 최근 내역</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2">
                  {history.map(item => (
                    <div key={item.id} className="p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-red-200 transition-all shadow-sm" onClick={() => setResult(item)}>
                      <div className="text-xs font-bold truncate">{item.title}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-7 sticky top-8">
            <div className="space-y-4">
              <h2 className={`text-xl font-bold text-gray-800 ${!result ? 'hidden' : 'block'}`}>대형 미리보기</h2>
              <div id="large-preview-container" className={`w-full bg-white rounded-3xl p-4 shadow-2xl border border-gray-100 min-h-[420px] ${!result ? 'hidden' : 'block'}`}>
                {/* ThumbnailEditor will render here via Portal */}
              </div>

              {!result && (
                <div className="h-[500px] rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-white shadow-inner">
                  <Youtube size={64} className="text-gray-200 mb-6" />
                  <p className="text-xl font-medium">영상의 주제를 입력하면<br/><span className="text-red-500 font-bold">고퀄리티 썸네일</span>이 생성됩니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
