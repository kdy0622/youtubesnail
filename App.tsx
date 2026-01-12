
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { ThumbnailStrategy, HistoryItem } from './types';
import StrategyCard from './components/StrategyCard';
import ThumbnailEditor from './components/ThumbnailEditor';
import { Sparkles, History, Youtube, Loader2, Trash2, Edit3 } from 'lucide-react';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ThumbnailStrategy | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const generateEverything = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setGeneratedImageUrl(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      // 1. Generate Text Strategy
      const textResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze content and provide YouTube thumbnail strategy.\n\nContent: ${input}`,
        config: {
          systemInstruction: `You are a YouTube CTR Strategist. Rules:
          - Title: Max 2 lines, high-impact Korean.
          - Subtitle: Supporting explanation in Korean.
          - Badge: Impactful short text in Korean.
          - Image Prompt: Detailed English description for a background vibe (cinematic, high quality, background only).
          Output JSON.`,
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

      // 2. Generate Background Image
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `High quality YouTube thumbnail background: ${strategyData.image_prompt}. Professional lighting, 4k, cinematic, aesthetic background for text overlays.` }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });

      for (const part of imageResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          setGeneratedImageUrl(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
      
      const newHistoryItem: HistoryItem = {
        ...strategyData,
        id: Date.now().toString(),
        timestamp: Date.now(),
        input: input
      };
      setHistory(prev => [newHistoryItem, ...prev]);

    } catch (error) {
      console.error("Generation failed:", error);
      alert("생성 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <div className="flex justify-center items-center gap-2 mb-2">
          <Youtube className="text-red-600 w-8 h-8" />
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            썸네일 <span className="gradient-text">만들기</span>
          </h1>
        </div>
        <p className="text-gray-500">AI가 제안하는 전략으로 고효율 썸네일을 즉시 제작하세요.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input + Editing Tools */}
        <div className="lg:col-span-5 space-y-6">
          <section className="glass-card rounded-2xl p-6 shadow-xl border-t-4 border-t-red-500">
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">콘텐츠 분석 요청</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="영상의 핵심 내용을 입력하면 AI가 전략을 세워줍니다..."
                className="w-full h-24 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none resize-none text-gray-800 text-sm"
              />
            </div>
            <button
              onClick={generateEverything}
              disabled={loading || !input.trim()}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              <span>{loading ? 'AI 분석 중...' : '전략 및 배경 생성'}</span>
            </button>
          </section>

          {result && (
            <div className="animate-in slide-in-from-left duration-500 space-y-6">
              <div className="flex items-center gap-2 text-xl font-bold text-gray-800">
                <Edit3 size={20} className="text-red-500" /> 디자인 편집 도구
              </div>
              <ThumbnailEditor strategy={result} bgImage={generatedImageUrl} isImageLoading={loading && !generatedImageUrl} />
            </div>
          )}

          {history.length > 0 && (
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold flex items-center gap-2 text-gray-500"><History size={18} /> 최근 히스토리</h2>
                <button onClick={() => setHistory([])} className="text-xs text-gray-400 hover:text-red-500">전체 삭제</button>
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

        {/* Right Column: Large Preview Canvas */}
        <div className="lg:col-span-7 sticky top-8">
          {result ? (
            <div className="space-y-4 animate-in fade-in duration-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">실시간 고해상도 미리보기</h2>
                <div className="flex gap-2">
                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">LIVE PREVIEW</span>
                </div>
              </div>
              
              <div id="large-preview-container" className="w-full bg-white rounded-3xl p-4 shadow-2xl border border-gray-100">
                 {/* The canvas is rendered within ThumbnailEditor and moved here via the layout */}
                 <div className="text-center py-2 border-b border-gray-50 mb-4">
                   <p className="text-xs text-gray-400 font-medium tracking-tighter">다운로드 시 최적화된 1080p 고화질로 저장됩니다.</p>
                 </div>
                 {/* This container serves as the mount point for visual consistency */}
              </div>
            </div>
          ) : (
            <div className="h-[650px] rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-white shadow-inner">
              <div className="bg-gray-50 p-10 rounded-full mb-6">
                <Youtube size={80} className="text-gray-200" />
              </div>
              <p className="text-xl font-medium text-gray-400">분석을 시작하면 우측에<br/><span className="text-red-500 font-bold underline decoration-2 underline-offset-4">대형 썸네일 캔버스</span>가 활성화됩니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
