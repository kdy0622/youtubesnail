
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { ThumbnailStrategy, HistoryItem } from './types';
import ThumbnailEditor from './components/ThumbnailEditor';
import { Sparkles, Youtube, Loader2, Edit3, History } from 'lucide-react';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ThumbnailStrategy | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // 고정된 API 키
  const API_KEY = "AIzaSyDnXYUz3RBvu3YrrZrh8hzq4DQQhpnXnT4";

  const generateEverything = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setGeneratedImageUrl(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const textResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a YouTube thumbnail strategy for: "${input}" in Korean.`,
        config: {
          systemInstruction: `You are a YouTube Expert. Output valid JSON in Korean. Format: {"title": "Main Title", "subtitle": "Sub Title", "badge": "Badge", "image_prompt": "English Visual Prompt"}`,
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

      try {
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: `A professional background for a YouTube thumbnail about: ${strategyData.image_prompt}. Cinematic lighting, no text.` }]
          },
          config: { imageConfig: { aspectRatio: "16:9" } }
        });
        const imagePart = imageResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (imagePart?.inlineData) {
          setGeneratedImageUrl(`data:image/png;base64,${imagePart.inlineData.data}`);
        }
      } catch (e) { console.error("Img error", e); }
      
      setHistory(prev => [{ ...strategyData, id: Date.now().toString(), timestamp: Date.now(), input }, ...prev]);
    } catch (error) {
      console.error("Error:", error);
      alert("생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <header className="flex flex-col items-center mb-12">
          <div className="bg-red-600 p-3 rounded-2xl mb-4 shadow-lg">
            <Youtube className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black mb-2">AI 유튜브 <span className="text-red-600">전략가</span></h1>
          <p className="text-gray-500 font-medium">클릭을 부르는 썸네일을 즉시 설계합니다.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* 왼쪽: 입력창 */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
              <h2 className="text-xl font-bold mb-4">주제 입력</h2>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="어떤 영상인가요? (예: 파이썬 기초 강의, 제주도 3박 4일 브이로그)"
                className="w-full h-32 p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-red-600 outline-none resize-none"
              />
              <button
                onClick={generateEverything}
                disabled={loading || !input.trim()}
                className="w-full mt-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                <span>{loading ? 'AI가 분석하는 중...' : '썸네일 자동 완성'}</span>
              </button>
            </div>

            {history.length > 0 && (
              <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
                <h3 className="font-bold text-gray-400 mb-4 flex items-center gap-2 text-sm"><History size={16}/> 히스토리</h3>
                <div className="space-y-2">
                  {history.slice(0, 3).map(item => (
                    <button key={item.id} onClick={() => setResult(item)} className="w-full p-3 text-left bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors truncate text-sm font-bold">
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 미리보기 및 편집 */}
          <div className="space-y-6">
            {result ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2"><Edit3 className="text-red-600"/> 실시간 미리보기</h2>
                </div>
                <ThumbnailEditor strategy={result} bgImage={generatedImageUrl} isImageLoading={loading && !generatedImageUrl} />
              </div>
            ) : (
              <div className="h-full min-h-[400px] border-4 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-300 p-10 text-center">
                <Youtube size={60} className="mb-4 opacity-20" />
                <p className="text-lg font-bold">왼쪽에 주제를 입력하고<br/>버튼을 눌러주세요!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
