import { useState, useEffect } from 'react';
import type { LevelConfig } from '../types';
import './TargetPreview.css';

interface TargetPreviewProps {
  levelConfig: LevelConfig;
  onComplete: () => void;
}

export function TargetPreview({ levelConfig, onComplete }: TargetPreviewProps) {
  const [phase, setPhase] = useState<'showing' | 'fading' | 'done'>('showing');

  useEffect(() => {
    // 顯示 2 秒後開始淡出
    const showTimer = setTimeout(() => {
      setPhase('fading');
    }, 2000);

    // 淡出動畫完成後
    const fadeTimer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 2500);

    return () => {
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
      <div className="target-preview-header">
        <h2>目標位置</h2>
        <p>將碎片移動到虛線框位置</p>
      </div>

      <div className="target-preview-canvas">
        {levelConfig.pieces.map((piece) => (
          <div
            key={piece.id}
            className="target-piece"
            style={{
              left: piece.target_transform.x,
              top: piece.target_transform.y,
              transform: `translate(-50%, -50%) rotate(${piece.target_transform.rotation}deg) scale(${piece.target_transform.scaleX}, ${piece.target_transform.scaleY})`,
            }}
          >
            <div className="target-piece-inner">
              <span>{piece.id}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="target-preview-hint">
        <span>遊戲即將開始...</span>
      </div>
    </div>
  );
}
