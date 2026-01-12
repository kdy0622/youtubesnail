
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

  // 1. 환경 변수에서 가져오거나, 여기에 직접 'AIza...'로 시작하는 키를 따옴표 안에 넣으세요.
  const API_KEY = process.env.API_KEY || "여기에_직접_API_키를_넣으세요";

  useEffect(() => {
    setIsReady(true);
  }, []);

  const generateEverything = async () => {
    if (!input.trim()) return;

    // 키가 비어있는지 확인
    if (!API_KEY || API_KEY.includes("여기에_직접")) {
      alert("API 키가 설정되지 않았습니다. App.tsx 파일 상단의 API_KEY 변수에 키를 입력해주세요.");
      return;
    }

    setLoading(true);
    setGeneratedImageUrl(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      
      // 텍스트 전략 생성 (무료 모델)
      const textResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this content and suggest a YouTube thumbnail strategy: "${input}"`,
        config: {
          systemInstruction: `You are a YouTube CTR Expert. Provide high-impact strategies in Korean. Output JSON.`,
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

      const strategyData = JSON.parse(textResponse.text) as ThumbnailStrategy;
      setResult(strategyData);

      // 배경 이미지 생성 (무료 모델)
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `YouTube thumbnail background. Theme: ${strategyData.image_prompt}. Professional lighting, 4k, no text.` }]
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
      
      setHistory(prev => [{ ...strategyData, id: Date.now().toString(), timestamp: Date.now(), input }, ...prev]);

    } catch (error: any) {
      console.error("Error:", error);
      alert("API 호출 중 오류가 발생했습니다. 키가 유효한지 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) return null;

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <div className="flex justify-center items-center gap-2 mb-2">
          <Youtube className="text-red-600 w-8 h-8" />
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            무료 <span className="gradient-text">AI 썸네일러</span>
          </h1>
        </div>
        <p className="text-gray-500 font-medium">API 키를 입력하면 바로 사용 가능합니다.</p>
      </header>

      {(!API_KEY || API_KEY.includes("여기에_직접")) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800">
          <AlertCircle size={20} />
          <p className="text-sm font-bold">API 키가 비어있습니다. App.tsx 소스 코드의 15번째 줄을 수정해주세요!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <section className="glass-card rounded-2xl p-6 shadow-xl border-t-4 border-t-red-500">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="영상 주제를 적어주세요..."
              className="w-full h-24 p-4 rounded-xl border mb-4 outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={generateEverything}
              disabled={loading || !input.trim()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              <span>{loading ? '생성 중...' : '썸네일 만들기'}</span>
            </button>
          </section>

          {result && <ThumbnailEditor strategy={result} bgImage={generatedImageUrl} isImageLoading={loading && !generatedImageUrl} />}
        </div>

        <div className="lg:col-span-7 sticky top-8">
          <div id="large-preview-container" className={`w-full bg-white rounded-3xl p-4 shadow-2xl border min-h-[420px] ${!result ? 'hidden' : 'block'}`}></div>
          {!result && (
            <div className="h-[600px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-gray-400 bg-white shadow-inner">
              <Youtube size={64} className="mb-4 opacity-20" />
              <p className="text-lg">분석 버튼을 누르면 미리보기가 나타납니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
