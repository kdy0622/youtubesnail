
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ThumbnailStrategy } from '../types';
import { toPng } from 'html-to-image';
import { Download, Type as TypeIcon, Move, Sun, Loader2, Sparkles, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface Props {
  strategy: ThumbnailStrategy;
  bgImage: string | null;
  isImageLoading?: boolean;
}

const FONTS = [
  { name: 'Pretendard (기본)', value: 'Pretendard' },
  { name: '검은고딕', value: 'Black Han Sans' },
  { name: '도현체', value: 'Do Hyeon' },
  { name: '주아체', value: 'Jua' },
  { name: '나눔브러쉬', value: 'Nanum Brush Script' },
  { name: '나눔펜', value: 'Nanum Pen Script' },
  { name: '고운돋움', value: 'Gowun Dodum' },
  { name: '고운바탕', value: 'Gowun Batang' },
  { name: '싱글데이', value: 'Single Day' },
  { name: '동글체', value: 'Dongle' },
];

const ThumbnailEditor: React.FC<Props> = ({ strategy, bgImage, isImageLoading }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [title, setTitle] = useState(strategy.title);
  const [subtitle, setSubtitle] = useState(strategy.subtitle);
  const [badge, setBadge] = useState(strategy.badge);
  
  // Group Position (Moving both title and subtitle together)
  const [groupX, setGroupX] = useState(10); // Default Left (10%)
  const [groupY, setGroupY] = useState(50); // Default Center Vertical (50%)
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

  // Individual Scales
  const [titleScale, setTitleScale] = useState(10);
  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [titleFont, setTitleFont] = useState('Pretendard'); // Default Font set to Pretendard

  const [subScale, setSubScale] = useState(4.5);
  const [subColor, setSubColor] = useState('#FFD700');
  const [subFont, setSubFont] = useState('Pretendard');

  const [brightness, setBrightness] = useState(70);
  const [bgColor, setBgColor] = useState('#000000');

  const [canvasWidth, setCanvasWidth] = useState(1280);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById('large-preview-container');
      if (container) {
        setCanvasWidth(container.offsetWidth - 32);
        setPortalElement(container);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    setTitle(strategy.title);
    setSubtitle(strategy.subtitle);
    setBadge(strategy.badge);
    // Reset positions for best default experience
    setGroupX(10);
    setGroupY(50);
    setTextAlign('left');
    setTitleFont('Pretendard');
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
      link.download = `youtube_thumb_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const canvasContent = (
    <div 
      ref={canvasRef}
      className="relative aspect-video w-full shadow-2xl overflow-hidden rounded-xl select-none bg-black group"
      style={{ backgroundColor: bgColor }}
    >
      {isImageLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-50">
           <Loader2 className="w-12 h-12 animate-spin text-red-500 mb-4" />
           <p className="text-white font-black text-xl">배경 생성 중...</p>
        </div>
      ) : bgImage ? (
        <img 
          src={bgImage} 
          className="absolute inset-0 w-full h-full object-cover" 
          alt="AI Background"
          style={{ filter: `brightness(${brightness}%)` }}
        />
      ) : null}
      
      {/* Text Group Container - Moves Together */}
      <div 
        className="absolute flex flex-col pointer-events-none"
        style={{ 
          left: `${groupX}%`,
          top: `${groupY}%`,
          transform: `translate(${textAlign === 'left' ? '0' : textAlign === 'right' ? '-100%' : '-50%'}, -50%)`,
          width: 'max-content',
          maxWidth: '85%',
          textAlign: textAlign,
          alignItems: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
          gap: `${computedTitleSize * 0.2}px`, // Fixed ratio gap to prevent overlapping
          zIndex: 20
        }}
      >
        {/* Title */}
        <div 
          style={{ 
            fontSize: `${computedTitleSize}px`, 
            color: titleColor,
            fontFamily: titleFont,
            fontWeight: '900',
            lineHeight: 1.1,
            textShadow: `0 ${computedTitleSize*0.05}px ${computedTitleSize*0.12}px rgba(0,0,0,0.95), 0 0 ${computedTitleSize*0.2}px rgba(0,0,0,0.6)`,
            whiteSpace: 'pre-wrap'
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div 
          style={{ 
            fontSize: `${computedSubSize}px`, 
            color: subColor,
            fontFamily: subFont,
            fontWeight: '700',
            lineHeight: 1.2,
            textShadow: `0 ${computedSubSize*0.05}px ${computedSubSize*0.1}px rgba(0,0,0,0.9)`,
            whiteSpace: 'pre-wrap'
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* Badge */}
      {badge && (
        <div 
          className="absolute top-[6%] left-[6%] z-30 pointer-events-none"
          style={{ fontSize: `${computedBadgeSize}px` }}
        >
          <span className="bg-red-600 text-white px-[1em] py-[0.3em] rounded-[0.2em] font-black shadow-2xl border-[0.08em] border-white inline-block tracking-tighter">
            {badge}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {portalElement && createPortal(canvasContent, portalElement)}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-8 animate-in slide-in-from-left duration-300">
        <button 
          onClick={downloadImage}
          className="w-full bg-black hover:bg-red-600 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
        >
          <Download size={22} /> 디자인 완성 및 다운로드
        </button>

        <div className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-red-500 pb-1">
              <div className="flex items-center gap-2 font-black text-gray-900 text-base">
                <TypeIcon size={18} className="text-red-500" /> 텍스트 및 정렬
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button onClick={() => setTextAlign('left')} className={`p-1.5 rounded ${textAlign === 'left' ? 'bg-white shadow-sm text-red-500' : 'text-gray-400'}`}><AlignLeft size={16}/></button>
                <button onClick={() => setTextAlign('center')} className={`p-1.5 rounded ${textAlign === 'center' ? 'bg-white shadow-sm text-red-500' : 'text-gray-400'}`}><AlignCenter size={16}/></button>
                <button onClick={() => setTextAlign('right')} className={`p-1.5 rounded ${textAlign === 'right' ? 'bg-white shadow-sm text-red-500' : 'text-gray-400'}`}><AlignRight size={16}/></button>
              </div>
            </div>
            
            <textarea 
              value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 text-sm border rounded-xl bg-gray-50 focus:ring-2 focus:ring-red-400 outline-none font-medium"
              rows={2}
              placeholder="제목 입력"
            />
            <input 
              value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
              className="w-full p-2.5 text-sm border rounded-xl bg-gray-50 focus:ring-2 focus:ring-red-400 outline-none"
              placeholder="부제목 입력"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400">제목 크기 (%)</label>
                <input type="range" min="5" max="20" step="0.1" value={titleScale} onChange={(e) => setTitleScale(parseFloat(e.target.value))} className="w-full accent-red-600" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400">제목 색상</label>
                <input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400">부제목 크기 (%)</label>
                <input type="range" min="2" max="10" step="0.1" value={subScale} onChange={(e) => setSubScale(parseFloat(e.target.value))} className="w-full accent-yellow-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400">부제목 색상</label>
                <input type="color" value={subColor} onChange={(e) => setSubColor(e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-none" />
              </div>
            </div>

            <select value={titleFont} onChange={(e) => setTitleFont(e.target.value)} className="w-full p-2.5 text-sm border rounded-xl bg-white shadow-sm font-semibold">
              {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
            </select>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 font-black text-gray-900 border-b-2 border-yellow-500 pb-1 text-base">
              <Sun size={18} className="text-yellow-500" /> 위치 및 배경 효과
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 flex items-center gap-1"><Move size={10}/> 전체 가로축 (%)</label>
                <input type="range" min="0" max="100" value={groupX} onChange={(e) => setGroupX(parseInt(e.target.value))} className="w-full accent-gray-600" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 flex items-center gap-1"><Move size={10}/> 전체 세로축 (%)</label>
                <input type="range" min="0" max="100" value={groupY} onChange={(e) => setGroupY(parseInt(e.target.value))} className="w-full accent-gray-600" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400">배경 밝기</label>
                <input type="range" min="0" max="100" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} className="w-full accent-yellow-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400">배지 텍스트</label>
                <input value={badge} onChange={(e) => setBadge(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-gray-50" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailEditor;
