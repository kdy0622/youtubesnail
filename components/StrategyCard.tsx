
import React, { useState } from 'react';
import { ThumbnailStrategy } from '../types';
import { Copy, Check, Type as TypeIcon, Tag } from 'lucide-react';

interface Props {
  strategy: ThumbnailStrategy;
  compact?: boolean;
}

const StrategyCard: React.FC<Props> = ({ strategy, compact }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={() => copyToClipboard(text, field)}
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
      title="복사하기"
    >
      {copiedField === field ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
    </button>
  );

  return (
    <div className={`bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden ${compact ? 'p-4' : 'p-8'}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Content */}
        <div className="space-y-6">
          <div className="relative group">
            <div className="flex items-center gap-2 text-red-500 font-bold mb-2">
              <TypeIcon size={18} />
              <span className="text-sm uppercase tracking-wider">텍스트 전략</span>
            </div>
            <div className="flex justify-between items-start bg-gray-50 rounded-xl p-4 border border-gray-100 group-hover:border-red-200 transition-all">
              <div className="flex-1">
                <h3 className="text-xl font-extrabold text-gray-900 leading-tight mb-2 whitespace-pre-wrap">
                  {strategy.title}
                </h3>
                <p className="text-gray-600 font-medium text-sm">{strategy.subtitle}</p>
              </div>
              <CopyButton text={`${strategy.title}\n${strategy.subtitle}`} field="title" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <div className="flex items-center gap-2 text-blue-500 font-bold mb-2">
              <Tag size={18} />
              <span className="text-sm uppercase tracking-wider">포인트 배지</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 rounded-xl p-4 border border-gray-100 group-hover:border-blue-200 transition-all">
              <span className="px-4 py-1.5 bg-blue-600 text-white font-black rounded-lg text-sm">
                {strategy.badge}
              </span>
              <CopyButton text={strategy.badge} field="badge" />
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-xl">
             <p className="text-xs text-gray-400 leading-relaxed font-medium">
               ※ 썸네일 제작 팁: 텍스트는 가급적 짧고 굵게, 배경은 어둡게 조절하여 글씨의 가독성을 높이는 것이 좋습니다.
             </p>
          </div>
        </div>
      </div>
      
      {!compact && (
        <div className="mt-8 pt-8 border-t border-gray-50 flex flex-wrap gap-3">
          <span className="text-xs font-bold text-gray-400">분석 태그:</span>
          {['High-CTR', 'Visual Hook', 'Curiosity Gap', 'Mobile-First'].map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default StrategyCard;
