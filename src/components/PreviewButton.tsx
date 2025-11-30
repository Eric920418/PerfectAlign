import { useCallback, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import './PreviewButton.css';

// 預覽按鈕組件 - 用於工具列
export function PreviewButton() {
  const { levelConfig, setPreviewActive, gameState } = useGameStore();

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      if (gameState !== 'WIN' && gameState !== 'COMPLETE') {
        setPreviewActive(true);
      }
    },
    [gameState, setPreviewActive]
  );

  const handlePointerUp = useCallback(() => {
    setPreviewActive(false);
  }, [setPreviewActive]);

  if (!levelConfig?.allow_preview) {
    return null;
  }

  return (
    <button
      className="preview-button toolbar-btn"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      aria-label="預覽完成圖"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  );
}

// 預覽覆蓋層組件 - 用於遊戲畫面
interface PreviewOverlayProps {
  previewImage: string;
  canvasWidth: number;
  canvasHeight: number;
}

export function PreviewOverlay({ previewImage, canvasWidth, canvasHeight }: PreviewOverlayProps) {
  const { levelConfig, isPreviewActive, setPreviewActive } = useGameStore();
  const [imageError, setImageError] = useState(false);

  const handlePointerUp = useCallback(() => {
    setPreviewActive(false);
  }, [setPreviewActive]);

  if (!levelConfig?.allow_preview || !isPreviewActive) {
    return null;
  }

  return (
    <div
      className="preview-overlay"
      style={{ width: canvasWidth, height: canvasHeight }}
      onPointerUp={handlePointerUp}
    >
      {!imageError ? (
        <img
          src={previewImage}
          alt="目標完成圖"
          style={{ width: canvasWidth, height: canvasHeight }}
          onError={() => setImageError(true)}
        />
      ) : (
        <svg
          className="preview-svg"
          width={canvasWidth}
          height={canvasHeight}
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        >
          {levelConfig.pieces.map((piece) => {
            const { x, y, rotation, scaleX, scaleY } = piece.target_transform;
            const w = piece.shape?.width ?? 80;
            const h = piece.shape?.height ?? 80;

            return (
              <g
                key={piece.id}
                transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scaleX}, ${scaleY})`}
              >
                <rect
                  x={-w / 2}
                  y={-h / 2}
                  width={w}
                  height={h}
                  className="target-marker-rect"
                />
                <text
                  x={0}
                  y={0}
                  className="target-marker-label"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {piece.id}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      {/* 提示文字 */}
      <div className="preview-hint">
        放開以關閉預覽
      </div>
    </div>
  );
}
