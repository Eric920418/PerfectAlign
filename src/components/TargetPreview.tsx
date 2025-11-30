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

  const { width: canvasW, height: canvasH } = levelConfig.canvas;

  return (
    <div
      className={`target-preview ${phase}`}
      style={{
        width: canvasW,
        height: canvasH,
      }}
    >
      {/* 螢光燈條邊框 */}
      <svg className="border-light-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect
          className="border-light-path light-1"
          x="0.5"
          y="0.5"
          width="99"
          height="99"
          rx="2"
          ry="2"
        />
        <rect
          className="border-light-path light-2"
          x="0.5"
          y="0.5"
          width="99"
          height="99"
          rx="2"
          ry="2"
        />
      </svg>

      {/* 頂部標籤 */}
      <div className="preview-badge">
        <span className="badge-dot" />
        <span>TARGET</span>
      </div>

      {/* 主標題區 */}
      <div className="preview-title-area">
        <h1 className="preview-title">目標位置</h1>
        <p className="preview-subtitle">記住碎片的目標位置</p>
      </div>

      {/* 目標預覽區 - 使用 SVG 避免縮放問題 */}
      <div className="preview-canvas-wrapper">
        <svg
          className="preview-canvas-svg"
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 背景網格 */}
          <defs>
            <pattern id="previewGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,243,255,0.05)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width={canvasW} height={canvasH} fill="url(#previewGrid)" />

          {/* 邊框 */}
          <rect
            x="1"
            y="1"
            width={canvasW - 2}
            height={canvasH - 2}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
            rx="4"
          />

          {/* 目標碎片 */}
          {levelConfig.pieces.map((piece) => {
            const { x, y, rotation, scaleX, scaleY } = piece.target_transform;
            const w = piece.shape?.width || 80;
            const h = piece.shape?.height || 80;

            return (
              <g
                key={piece.id}
                transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scaleX}, ${scaleY})`}
              >
                {/* 虛線框 */}
                <rect
                  x={-w / 2}
                  y={-h / 2}
                  width={w}
                  height={h}
                  fill="rgba(0, 243, 255, 0.08)"
                  stroke="var(--neon-primary)"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  className="target-box-animate"
                />
                {/* 四角標記 */}
                <path
                  d={`M${-w/2} ${-h/2 + 12} L${-w/2} ${-h/2} L${-w/2 + 12} ${-h/2}`}
                  fill="none"
                  stroke="var(--neon-primary)"
                  strokeWidth="2"
                />
                <path
                  d={`M${w/2 - 12} ${-h/2} L${w/2} ${-h/2} L${w/2} ${-h/2 + 12}`}
                  fill="none"
                  stroke="var(--neon-primary)"
                  strokeWidth="2"
                />
                <path
                  d={`M${-w/2} ${h/2 - 12} L${-w/2} ${h/2} L${-w/2 + 12} ${h/2}`}
                  fill="none"
                  stroke="var(--neon-primary)"
                  strokeWidth="2"
                />
                <path
                  d={`M${w/2 - 12} ${h/2} L${w/2} ${h/2} L${w/2} ${h/2 - 12}`}
                  fill="none"
                  stroke="var(--neon-primary)"
                  strokeWidth="2"
                />
                {/* 標籤 */}
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--neon-primary)"
                  fontSize="20"
                  fontWeight="700"
                  fontFamily="'SF Mono', Consolas, monospace"
                >
                  {piece.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 底部倒數 */}
      <div className="preview-countdown">
        <div className="countdown-ring">
          <span className="countdown-number">{countdown}</span>
        </div>
        <span className="countdown-text">秒後開始</span>
      </div>
    </div>
  );
}
