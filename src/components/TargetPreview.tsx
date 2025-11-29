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

  const { width, height } = levelConfig.canvas;

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
      style={{ width, height }}
    >
      {/* 使用 SVG 確保座標系統與 PixelGrid/GameEngine 完全一致 */}
      <svg
        className="target-preview-svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        {levelConfig.pieces.map((piece) => {
          const { x, y, rotation, scaleX, scaleY } = piece.target_transform;
          const w = piece.shape?.width || 80;
          const h = piece.shape?.height || 80;

          return (
            <g
              key={piece.id}
              transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scaleX}, ${scaleY})`}
            >
              {/* 目標框（中心對齊，與 PixiJS anchor(0.5) 一致） */}
              <rect
                x={-w / 2}
                y={-h / 2}
                width={w}
                height={h}
                className="target-rect"
              />
              {/* 標籤 */}
              <text
                x={0}
                y={0}
                className="target-label"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {piece.id}
              </text>
              {/* 四角標記 */}
              <path
                d={`M${-w/2} ${-h/2 + 12} L${-w/2} ${-h/2} L${-w/2 + 12} ${-h/2}`}
                className="corner-mark"
              />
              <path
                d={`M${w/2 - 12} ${-h/2} L${w/2} ${-h/2} L${w/2} ${-h/2 + 12}`}
                className="corner-mark"
              />
              <path
                d={`M${-w/2} ${h/2 - 12} L${-w/2} ${h/2} L${-w/2 + 12} ${h/2}`}
                className="corner-mark"
              />
              <path
                d={`M${w/2 - 12} ${h/2} L${w/2} ${h/2} L${w/2} ${h/2 - 12}`}
                className="corner-mark"
              />
            </g>
          );
        })}
      </svg>

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
