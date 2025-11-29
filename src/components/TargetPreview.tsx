import { useState, useEffect } from 'react';
import type { LevelConfig } from '../types';
import './TargetPreview.css';

interface TargetPreviewProps {
  levelConfig: LevelConfig;
  onComplete: () => void;
}

export function TargetPreview({ levelConfig, onComplete }: TargetPreviewProps) {
  const [phase, setPhase] = useState<'showing' | 'fading' | 'done'>('showing');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // 倒數計時
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 顯示 3 秒後開始淡出
    const showTimer = setTimeout(() => {
      setPhase('fading');
    }, 3000);

    // 淡出動畫完成後
    const fadeTimer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 3500);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
    };
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <div
      className={`target-preview ${phase}`}
      style={{
        width: levelConfig.canvas.width,
        height: levelConfig.canvas.height,
      }}
    >
      {/* 直接在畫布上顯示目標位置 */}
      {levelConfig.pieces.map((piece) => (
        <div
          key={piece.id}
          className="target-piece"
          style={{
            left: piece.target_transform.x,
            top: piece.target_transform.y,
            width: piece.shape?.width || 80,
            height: piece.shape?.height || 80,
            transform: `translate(-50%, -50%) rotate(${piece.target_transform.rotation}deg) scale(${piece.target_transform.scaleX}, ${piece.target_transform.scaleY})`,
          }}
        >
          <div className="target-piece-inner">
            <span className="piece-label">{piece.id}</span>
          </div>
        </div>
      ))}

      {/* 倒數計時 */}
      <div className="preview-countdown">
        <div className="countdown-ring">
          <span className="countdown-number">{countdown}</span>
        </div>
        <span className="countdown-text">秒後開始</span>
      </div>
    </div>
  );
}
