
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ThumbnailStrategy } from '../types';
import { toPng } from 'html-to-image';
import { Download, Type as TypeIcon, AlignLeft, AlignCenter, AlignRight, Loader2 } from 'lucide-react';

interface Props {
  strategy: ThumbnailStrategy;
  bgImage: string | null;
  isImageLoading?: boolean;
}

const FONTS = [
  { name: 'Pretendard', value: 'Pretendard' },
  { name: '검은고딕', value: 'Black Han Sans' },
  { name: '도현체', value: 'Do Hyeon' },
  { name: '주아체', value: 'Jua' },
  { name: '나눔브러쉬', value: 'Nanum Brush Script' },
  { name: '싱글데이', value: 'Single Day' },
];

const ThumbnailEditor: React.FC<Props> = ({ strategy, bgImage, isImageLoading }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
  
  const [title, setTitle] = useState(strategy.title);
  const [subtitle, setSubtitle] = useState(strategy.subtitle);
  const [badge, setBadge] = useState(strategy.badge);
  
  const [groupX, setGroupX] = useState(50);
  const [groupY, setGroupY] = useState(50);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [titleScale, setTitleScale] = useState(12);
  const [titleFont, setTitleFont] = useState('Black Han Sans');
  const [brightness, setBrightness] = useState(60);
  const [canvasWidth, setCanvasWidth] = useState(800);

  useEffect(() => {
    setTitle(strategy.title);
    setSubtitle(strategy.subtitle);
    setBadge(strategy.badge);
  }, [strategy]);

  useEffect(() => {
    const update = () => {
      const node = document.getElementById('large-preview-container');
      if (node) {
        setPortalNode(node);
        setCanvasWidth(node.clientWidth);
      }
    };
    update();
    const interval = setInterval(update, 500);
    window.addEventListener('resize', update);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', update);
    };
  }, []);

  const tSize = useMemo(() => (canvasWidth * titleScale) / 100, [canvasWidth, titleScale]);
  const sSize = useMemo(() => tSize * 0.45, [tSize]);

  const save = async () => {
    if (!canvasRef.current) return;
    try {
      const data = await toPng(canvasRef.current, { width: 1920, height: 1080 });
      const a = document.createElement('a');
      a.download = `youtube_thumb.png`;
      a.href = data;
      a.click();
    } catch (e) { alert('저장 실패'); }
  };

  const artboard = (
    <div 
      ref={canvasRef}
      className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center"
      style={{ fontSize: `${canvasWidth / 100}px` }}
    >
      {isImageLoading && (
        <div className="absolute inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center text-white">
          <Loader2 className="animate-spin mb-2" size={40} />
          <p className="font-bold">AI 이미지 생성 중...</p>
        </div>
      )}
      
      {bgImage ? (
        <img 
          src={bgImage} 
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000" 
          style={{ filter: `brightness(${brightness}%)` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-gray-900 to-red-900" style={{ filter: `brightness(${brightness}%)` }} />
      )}
      
      <div 
        className="absolute w-full px-10 pointer-events-none"
        style={{ 
          left: `${groupX}%`, 
          top: `${groupY}%`, 
          transform: `translate(-${groupX}%, -${groupY}%)`,
          textAlign: textAlign,
          display: 'flex',
          flexDirection: 'column',
          alignItems: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center'
        }}
      >
        <h2 
          className="font-black leading-[1.1] mb-2 drop-shadow-2xl"
          style={{ 
            fontSize: `${tSize}px`, 
            fontFamily: titleFont, 
            color: 'white',
            textShadow: '0 0.1em 0.2em rgba(0,0,0,0.8)'
          }}
        >
          {title}
        </h2>
        <p 
          className="font-bold drop-shadow-lg"
          style={{ 
            fontSize: `${sSize}px`, 
            color: '#FFD700',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          {subtitle}
        </p>
      </div>

      {badge && (
        <div className="absolute top-[8%] left-[8%]">
          <span className="bg-red-600 text-white px-4 py-1 rounded-lg font-black italic border-2 border-white shadow-2xl" style={{ fontSize: `${tSize * 0.3}px` }}>
            {badge}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {portalNode && createPortal(artboard, portalNode)}

      <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100 space-y-6">
        <div>
          <label className="text-xs font-black text-gray-400 uppercase mb-3 block tracking-widest">텍스트 내용</label>
          <textarea 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm font-bold outline-none focus:ring-2 focus:ring-red-500"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400">정렬</label>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button onClick={() => setTextAlign('left')} className={`flex-1 p-2 rounded-lg flex justify-center ${textAlign === 'left' ? 'bg-white shadow' : ''}`}><AlignLeft size={16}/></button>
              <button onClick={() => setTextAlign('center')} className={`flex-1 p-2 rounded-lg flex justify-center ${textAlign === 'center' ? 'bg-white shadow' : ''}`}><AlignCenter size={16}/></button>
              <button onClick={() => setTextAlign('right')} className={`flex-1 p-2 rounded-lg flex justify-center ${textAlign === 'right' ? 'bg-white shadow' : ''}`}><AlignRight size={16}/></button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400">폰트</label>
            <select value={titleFont} onChange={(e) => setTitleFont(e.target.value)} className="w-full p-2 bg-gray-100 rounded-xl text-xs font-bold border-none outline-none">
              {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-[10px] font-bold text-gray-400">
             <span>배경 밝기</span>
             <span>제목 크기</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="range" min="20" max="100" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} className="w-full accent-red-600" />
            <input type="range" min="5" max="25" step="0.5" value={titleScale} onChange={(e) => setTitleScale(parseFloat(e.target.value))} className="w-full accent-red-600" />
          </div>
        </div>

        <button onClick={save} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-black transition-all">
          <Download size={20} /> 이미지 저장하기
        </button>
      </div>
    </div>
  );
};

export default ThumbnailEditor;
