
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ThumbnailStrategy } from '../types';
import { toPng } from 'html-to-image';
import { Download, Type as TypeIcon, Move, Sun, Loader2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

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
  { name: '나눔펜', value: 'Nanum Pen Script' },
  { name: '고운돋움', value: 'Gowun Dodum' },
  { name: '싱글데이', value: 'Single Day' },
];

const ThumbnailEditor: React.FC<Props> = ({ strategy, bgImage, isImageLoading }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [title, setTitle] = useState(strategy.title);
  const [subtitle, setSubtitle] = useState(strategy.subtitle);
  const [badge, setBadge] = useState(strategy.badge);
  
  const [groupX, setGroupX] = useState(10);
  const [groupY, setGroupY] = useState(50);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

  const [titleScale, setTitleScale] = useState(10);
  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [titleFont, setTitleFont] = useState('Pretendard');

  const [subScale, setSubScale] = useState(4.5);
  const [subColor, setSubColor] = useState('#FFD700');
  const [subFont, setSubFont] = useState('Pretendard');

  const [brightness, setBrightness] = useState(70);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const updateContainer = () => {
      const container = document.getElementById('large-preview-container');
      if (container) {
        setPortalElement(container);
        setCanvasWidth(container.offsetWidth - 32 || 800);
      }
    };

    updateContainer();
    const timer = setInterval(updateContainer, 500); // 주기적으로 체크하여 백지 현상 방지
    
    window.addEventListener('resize', updateContainer);
    return () => {
      window.removeEventListener('resize', updateContainer);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    setTitle(strategy.title);
    setSubtitle(strategy.subtitle);
    setBadge(strategy.badge);
  }, [strategy]);

  const computedTitleSize = useMemo(() => (canvasWidth * titleScale) / 100, [canvasWidth, titleScale]);
  const computedSubSize = useMemo(() => (canvasWidth * subScale) / 100, [canvasWidth, subScale]);
  const computedBadgeSize = useMemo(() => (canvasWidth * 4.2) / 100, [canvasWidth]);

  const downloadImage = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = await toPng(canvasRef.current, { 
        width: 1920,
        height: 1080,
        style: { width: '1920px', height: '1080px', transform: 'none' }
      });
      const link = document.createElement('a');
      link.download = `thumb_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert('다운로드 중 오류가 발생했습니다.');
    }
  };

  const canvasContent = (
    <div 
      ref={canvasRef}
      className="relative aspect-video w-full shadow-2xl overflow-hidden rounded-xl bg-black"
    >
      {isImageLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-50">
           <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-2" />
           <p className="text-white font-bold">배경 생성 중...</p>
        </div>
      ) : bgImage ? (
        <img 
          src={bgImage} 
          className="absolute inset-0 w-full h-full object-cover" 
          alt="BG"
          style={{ filter: `brightness(${brightness}%)` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black"></div>
      )}
      
      <div 
        className="absolute flex flex-col"
        style={{ 
          left: `${groupX}%`,
          top: `${groupY}%`,
          transform: `translate(${textAlign === 'left' ? '0' : textAlign === 'right' ? '-100%' : '-50%'}, -50%)`,
          width: 'max-content',
          maxWidth: '85%',
          textAlign: textAlign,
          alignItems: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
          gap: `${computedTitleSize * 0.15}px`,
          zIndex: 20
        }}
      >
        <div 
          style={{ 
            fontSize: `${computedTitleSize}px`, 
            color: titleColor,
            fontFamily: titleFont,
            fontWeight: '900',
            lineHeight: 1.1,
            textShadow: `0 ${computedTitleSize*0.05}px ${computedTitleSize*0.12}px rgba(0,0,0,0.9)`,
            whiteSpace: 'pre-wrap'
          }}
        >
          {title}
        </div>
        <div 
          style={{ 
            fontSize: `${computedSubSize}px`, 
            color: subColor,
            fontFamily: subFont,
            fontWeight: '700',
            textShadow: `0 2px 8px rgba(0,0,0,0.8)`,
            whiteSpace: 'pre-wrap'
          }}
        >
          {subtitle}
        </div>
      </div>

      {badge && (
        <div 
          className="absolute top-[6%] left-[6%] z-30"
          style={{ fontSize: `${computedBadgeSize}px` }}
        >
          <span className="bg-red-600 text-white px-[0.8em] py-[0.2em] rounded-[0.2em] font-black shadow-xl border border-white">
            {badge}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {portalElement && createPortal(canvasContent, portalElement)}

      <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-6">
        <button 
          onClick={downloadImage}
          className="w-full bg-black hover:bg-red-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
        >
          <Download size={20} /> 이미지 다운로드
        </button>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-1">
            <span className="font-bold flex items-center gap-2"><TypeIcon size={16}/> 텍스트 편집</span>
            <div className="flex bg-gray-100 rounded p-1 scale-90">
              <button onClick={() => setTextAlign('left')} className={`p-1 ${textAlign === 'left' ? 'bg-white shadow rounded' : ''}`}><AlignLeft size={14}/></button>
              <button onClick={() => setTextAlign('center')} className={`p-1 ${textAlign === 'center' ? 'bg-white shadow rounded' : ''}`}><AlignCenter size={14}/></button>
              <button onClick={() => setTextAlign('right')} className={`p-1 ${textAlign === 'right' ? 'bg-white shadow rounded' : ''}`}><AlignRight size={14}/></button>
            </div>
          </div>
          
          <textarea 
            value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 text-sm border rounded-lg bg-gray-50 outline-none"
            rows={2}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400">제목 크기</label>
              <input type="range" min="5" max="20" step="0.5" value={titleScale} onChange={(e) => setTitleScale(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400">제목 폰트</label>
              <select value={titleFont} onChange={(e) => setTitleFont(e.target.value)} className="w-full p-1 text-xs border rounded">
                {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400">위치 가로 (%)</label>
              <input type="range" min="0" max="100" value={groupX} onChange={(e) => setGroupX(parseInt(e.target.value))} className="w-full" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400">배경 밝기</label>
              <input type="range" min="0" max="100" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailEditor;
