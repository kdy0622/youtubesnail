
import React, { useState, useEffect } from 'react';
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
  const [isReady, setIsReady] = useState(false);

  // 클라이언트 사이드 마운트 확인
  useEffect(() => {
    setIsReady(true);
  }, []);

  const generateEverything = async () => {
    if (!input.trim()) return;

    // 환경 변수 안전하게 가져오기
    const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
    
    if (!apiKey) {
      alert("API 키가 설정되지 않았습니다. 환경 설정을 확인해주세요.");
      return;
    }

    setLoading(true);
    setGeneratedImageUrl(null);
    
    try {
      // 매 호출마다 새로운 인스턴스 생성 (최신 키 반영 보장)
      const ai = new GoogleGenAI({ apiKey });
      
      // 1. 텍스트 전략 생성 (Gemini 3 Flash 사용)
      const textResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze content and provide YouTube thumbnail strategy.\n\nContent: ${input}`,
        config: {
          systemInstruction: `You are a YouTube CTR Strategist. 
          Output JSON strictly with:
          - title: Max 2 lines Korean.
          - subtitle: Explanation Korean.
          - badge: Short impact word Korean.
          - image_prompt: Detailed English image description (vibe/background).`,
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

      // 2. 고품질 배경 이미지 생성 (Gemini 3 Pro Image 사용 - 나노 바나나 2)
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: `A high-quality, cinematic YouTube thumbnail background. ${strategyData.image_prompt}. Professional lighting, 4k resolution, bokeh background, no text in image.` }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1K"
          }
        }
      });

      let imageUrl = null;
      if (imageResponse.candidates?.[0]?.content?.parts) {
        for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            setGeneratedImageUrl(imageUrl);
            break;
          }
        }
      }
      
      const newHistoryItem: HistoryItem = {
        ...strategyData,
        id: Date.now().toString(),
        timestamp: Date.now(),
        input: input
      };
      setHistory(prev => [newHistoryItem, ...prev]);

    } catch (error: any) {
      console.error("Generation error:", error);
      const msg = error.message || "";
      if (msg.includes('429')) {
        alert("API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.");
      } else if (msg.includes('403') || msg.includes('401')) {
        alert("API 키 권한 오류입니다. 키 설정을 확인해주세요.");
      } else {
        alert("분석 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Hydration 이슈 방지: 서버 사이드와 클라이언트 사이드의 초기 렌더링 결과 일치시킴
  if (!isReady) return <div className="min-h-screen bg-gray-50"></div>;

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <div className="flex justify-center items-center gap-2 mb-2">
          <Youtube className="text-red-600 w-8 h-8" />
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            썸네일 <span className="gradient-text">만들기</span>
          </h1>
        </div>
        <p className="text-gray-500 font-medium">나노 바나나 2(Pro Image) 모델로 생성하는 고퀄리티 배경</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <section className="glass-card rounded-2xl p-6 shadow-xl border-t-4 border-t-red-500">
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">콘텐츠 분석 요청</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="영상의 내용을 입력하면 AI가 전략을 짜줍니다..."
                className="w-full h-24 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none resize-none text-gray-800 text-sm"
              />
            </div>
            <button
              onClick={generateEverything}
              disabled={loading || !input.trim()}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              <span>{loading ? '고화질 생성 중...' : '전략 및 배경 생성'}</span>
            </button>
          </section>

          {result && (
            <div className="animate-in slide-in-from-left duration-500 space-y-6">
              <div className="flex items-center gap-2 text-xl font-bold text-gray-800">
                <Edit3 size={20} className="text-red-500" /> 디자인 편집
              </div>
              <ThumbnailEditor strategy={result} bgImage={generatedImageUrl} isImageLoading={loading && !generatedImageUrl} />
            </div>
          )}

          {history.length > 0 && (
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold flex items-center gap-2 text-gray-500"><History size={18} /> 최근 내역</h2>
                <button onClick={() => setHistory([])} className="text-xs text-gray-400 hover:text-red-500">지우기</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2">
                {history.map(item => (
                  <div key={item.id} className="p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-red-200 transition-all shadow-sm" onClick={() => setResult(item)}>
                    <div className="text-xs font-bold truncate">{item.title}</div>
                    <div className="text-[10px] text-gray-400">{new Date(item.timestamp).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-7 sticky top-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between min-h-[40px]">
              {result && (
                <>
                  <h2 className="text-xl font-bold text-gray-800">미리보기 (1080p 최적화)</h2>
                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold uppercase">Pro Image Mode</span>
                </>
              )}
            </div>
            
            <div id="large-preview-container" className={`w-full bg-white rounded-3xl p-4 shadow-2xl border border-gray-100 min-h-[400px] ${!result ? 'hidden' : 'block'}`}>
            </div>

            {!result && (
              <div className="h-[600px] rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-white shadow-inner">
                <Youtube size={80} className="text-gray-200 mb-6" />
                <p className="text-xl font-medium">왼쪽 창에 내용을 입력하고<br/>AI 전략 분석을 시작해보세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
