import { useCallback, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import './PreviewButton.css';

interface PreviewButtonProps {
  previewImage: string;
  canvasWidth: number;
  canvasHeight: number;
}

export function PreviewButton({ previewImage, canvasWidth, canvasHeight }: PreviewButtonProps) {
  const { levelConfig, isPreviewActive, setPreviewActive, gameState } = useGameStore();
  const [imageError, setImageError] = useState(false);

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
    <>
      {/* 預覽按鈕 */}
      <button
        className="preview-button"
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

      {/* 預覽覆蓋層 */}
      {isPreviewActive && (
        <div
          className="preview-overlay"
          style={{ width: canvasWidth, height: canvasHeight }}
          onPointerUp={handlePointerUp}
        >
          {!imageError ? (
            <img
              src={previewImage}
              alt="目標完成圖"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="preview-placeholder">
              <span>目標位置</span>
              {levelConfig.pieces.map((piece) => (
                <div
                  key={piece.id}
                  className="target-marker"
                  style={{
                    left: piece.target_transform.x,
                    top: piece.target_transform.y,
                    width: piece.shape?.width ?? 80,
                    height: piece.shape?.height ?? 80,
                    transform: `translate(-50%, -50%) rotate(${piece.target_transform.rotation}deg) scale(${piece.target_transform.scaleX}, ${piece.target_transform.scaleY})`,
                  }}
                >
                  {piece.id}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
