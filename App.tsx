
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { ThumbnailStrategy, HistoryItem } from './types';
import ThumbnailEditor from './components/ThumbnailEditor';
import { Sparkles, History, Youtube, Loader2, Edit3 } from 'lucide-react';

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
      
      // 1. 텍스트 전략 생성
      const textResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a YouTube thumbnail strategy for: "${input}" in Korean.`,
        config: {
          systemInstruction: `You are a YouTube Expert. Output valid JSON in Korean. 
          Format: {"title": "Main Title", "subtitle": "Sub Title", "badge": "Badge", "image_prompt": "English Visual Prompt"}`,
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

      // 2. 이미지 생성 시도
      try {
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: `A professional background for a YouTube thumbnail about: ${strategyData.image_prompt}. High quality, 4k, no text, cinematic lighting.` }]
          },
          config: { imageConfig: { aspectRatio: "16:9" } }
        });

        if (imageResponse.candidates?.[0]?.content?.parts) {
          const imagePart = imageResponse.candidates[0].content.parts.find(p => p.inlineData);
          if (imagePart?.inlineData) {
            setGeneratedImageUrl(`data:image/png;base64,${imagePart.inlineData.data}`);
          }
        }
      } catch (e) {
        console.error("Image gen error", e);
      }
      
      setHistory(prev => [{ ...strategyData, id: Date.now().toString(), timestamp: Date.now(), input }, ...prev]);

    } catch (error: any) {
      console.error("Analysis Error:", error);
      alert("분석에 실패했습니다. 내용을 조금 더 구체적으로 적어주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10 min-h-screen bg-gray-50">
      <header className="text-center mb-10">
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="bg-red-600 p-2 rounded-xl">
            <Youtube className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">
            AI <span className="text-red-600">썸네일러</span>
          </h1>
        </div>
        <p className="text-gray-500 font-medium">단 5초 만에 클릭을 부르는 썸네일 전략을 세워드립니다.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* 입력 및 편집 섹션 */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold mb-4 text-gray-800">영상 주제 입력</h3>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="영상 내용을 간단히 적어주세요 (예: 주식 초보 탈출법)"
              className="w-full h-32 p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-red-500 outline-none text-gray-800 resize-none transition-all"
            />
            <button
              onClick={generateEverything}
              disabled={loading || !input.trim()}
              className="w-full mt-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              <span>{loading ? '분석 중...' : '썸네일 자동 생성'}</span>
            </button>
          </div>

          {result && (
            <div className="animate-in fade-in slide-in-from-bottom duration-500">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Edit3 className="text-red-600" size={20} /> 실시간 편집
              </h3>
              <ThumbnailEditor strategy={result} bgImage={generatedImageUrl} isImageLoading={loading && !generatedImageUrl} />
            </div>
          )}
        </div>

        {/* 미리보기 섹션 */}
        <div className="lg:col-span-7">
          <div className="sticky top-10 space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-lg font-bold text-gray-800">미리보기</h3>
              {result && <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-bold">생성 완료</span>}
            </div>
            
            <div 
              id="large-preview-container" 
              className="w-full aspect-video bg-white rounded-3xl shadow-2xl border-4 border-white overflow-hidden flex items-center justify-center relative"
            >
              {!result && (
                <div className="text-center p-10">
                  <Youtube size={80} className="mx-auto text-gray-100 mb-6" />
                  <p className="text-gray-400 font-bold text-lg">주제를 입력하면 이곳에<br/>아트보드가 생성됩니다.</p>
                </div>
              )}
              {/* ThumbnailEditor renders here via Portal */}
            </div>

            {history.length > 0 && (
              <div className="mt-10">
                <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <History size={16} /> 히스토리
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {history.map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => setResult(item)}
                      className="flex-shrink-0 w-40 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-red-500 transition-all text-left"
                    >
                      <p className="text-xs font-black truncate mb-1">{item.title}</p>
                      <p className="text-[10px] text-gray-400">{new Date(item.timestamp).toLocaleTimeString()}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
