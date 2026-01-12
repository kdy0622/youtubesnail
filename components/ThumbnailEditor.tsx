
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ThumbnailStrategy } from '../types';
import { toPng } from 'html-to-image';
import { Download, AlignLeft, AlignCenter, AlignRight, Loader2, Type as FontIcon } from 'lucide-react';

interface Props {
  strategy: ThumbnailStrategy;
  bgImage: string | null;
  isImageLoading?: boolean;
}

const FONTS = [
  { name: '검은고딕', value: 'Black Han Sans' },
  { name: '도현체', value: 'Do Hyeon' },
  { name: '주아체', value: 'Jua' },
  { name: '나눔브러쉬', value: 'Nanum Brush Script' },
  { name: 'Pretendard', value: 'Pretendard' },
];

const ThumbnailEditor: React.FC<Props> = ({ strategy, bgImage, isImageLoading }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [title, setTitle] = useState(strategy.title);
  const [subtitle, setSubtitle] = useState(strategy.subtitle);
  const [badge, setBadge] = useState(strategy.badge);
  
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [titleFont, setTitleFont] = useState('Black Han Sans');
  const [brightness, setBrightness] = useState(60);
  const [titleScale, setTitleScale] = useState(70); // 70px base

  useEffect(() => {
    setTitle(strategy.title);
    setSubtitle(strategy.subtitle);
    setBadge(strategy.badge);
  }, [strategy]);

  const saveImage = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = await toPng(canvasRef.current, { cacheBust: true });
      const link = document.createElement('a');
      link.download = `thumbnail.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert('이미지 저장에 실패했습니다. (브라우저 설정을 확인해주세요)');
    }
  };

  return (
    <div className="space-y-6">
      {/* 캔버스 영역 - 직접 렌더링 */}
      <div 
        ref={canvasRef}
        className="w-full aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden relative border-4 border-white"
      >
        {isImageLoading && (
          <div className="absolute inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center text-white">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p className="text-sm font-bold">배경 생성 중...</p>
          </div>
        )}
        
        {bgImage ? (
          <img src={bgImage} className="absolute inset-0 w-full h-full object-cover" style={{ filter: `brightness(${brightness}%)` }} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-red-900" style={{ filter: `brightness(${brightness}%)` }} />
        )}
        
        <div 
          className="absolute inset-0 flex flex-col justify-center px-12 pointer-events-none"
          style={{ 
            textAlign: textAlign,
            alignItems: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center'
          }}
        >
          <h2 
            className="font-black leading-[1.15] mb-4 drop-shadow-2xl"
            style={{ 
              fontSize: `${titleScale}px`, 
              fontFamily: titleFont, 
              color: 'white',
              textShadow: '0 4px 12px rgba(0,0,0,0.8)'
            }}
          >
            {title}
          </h2>
          <p 
            className="font-bold drop-shadow-lg"
            style={{ 
              fontSize: `${titleScale * 0.4}px`, 
              color: '#FFD700',
              textShadow: '0 2px 8px rgba(0,0,0,0.6)'
            }}
          >
            {subtitle}
          </p>
        </div>

        {badge && (
          <div className="absolute top-[8%] left-[8%]">
            <span className="bg-red-600 text-white px-3 py-1 rounded-lg font-black italic border-2 border-white shadow-xl" style={{ fontSize: `${titleScale * 0.3}px` }}>
              {badge}
            </span>
          </div>
        )}
      </div>

      {/* 편집 도구 */}
      <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 space-y-6">
        <div className="space-y-4">
          <textarea 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-red-600 outline-none"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400">정렬</label>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setTextAlign('left')} className={`flex-1 p-2 rounded-lg flex justify-center ${textAlign === 'left' ? 'bg-white shadow' : ''}`}><AlignLeft size={16}/></button>
                <button onClick={() => setTextAlign('center')} className={`flex-1 p-2 rounded-lg flex justify-center ${textAlign === 'center' ? 'bg-white shadow' : ''}`}><AlignCenter size={16}/></button>
                <button onClick={() => setTextAlign('right')} className={`flex-1 p-2 rounded-lg flex justify-center ${textAlign === 'right' ? 'bg-white shadow' : ''}`}><AlignRight size={16}/></button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-1"><FontIcon size={12}/> 폰트</label>
              <select value={titleFont} onChange={(e) => setTitleFont(e.target.value)} className="w-full p-2 bg-gray-100 rounded-xl text-xs font-bold border-none outline-none">
                {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-gray-400"><span>어둡게</span><span>밝게</span></div>
              <input type="range" min="20" max="100" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} className="w-full accent-red-600" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-gray-400"><span>작게</span><span>크게</span></div>
              <input type="range" min="30" max="120" value={titleScale} onChange={(e) => setTitleScale(parseInt(e.target.value))} className="w-full accent-red-600" />
            </div>
          </div>
        </div>

        <button onClick={saveImage} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-black transition-all">
          <Download size={20} /> 썸네일 이미지 저장
        </button>
      </div>
    </div>
  );
};

export default ThumbnailEditor;
