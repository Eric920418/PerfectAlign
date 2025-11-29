import { useCallback, useRef, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import './TransformControls.css';

type ControlAction =
  | 'rotate-left' | 'rotate-right'
  | 'scale-up' | 'scale-down'
  | 'width-up' | 'width-down'
  | 'height-up' | 'height-down';

export function TransformControls() {
  const {
    selectedPieceId,
    pieces,
    updatePieceTransform,
    checkWinCondition,
    gameState,
    levelConfig,
  } = useGameStore();

  // 是否只允許等比例縮放
  const uniformScaleOnly = levelConfig?.uniform_scale_only ?? false;

  const [activeControl, setActiveControl] = useState<ControlAction | null>(null);
  const controlIntervalRef = useRef<number | null>(null);

  const handleControlAction = useCallback(
    (action: ControlAction) => {
      if (!selectedPieceId) return;

      const piece = pieces.find((p) => p.id === selectedPieceId);
      if (!piece) return;

      switch (action) {
        case 'rotate-left':
          updatePieceTransform(selectedPieceId, { rotation: piece.current.rotation - 5 });
          break;
        case 'rotate-right':
          updatePieceTransform(selectedPieceId, { rotation: piece.current.rotation + 5 });
          break;
        case 'scale-up':
          updatePieceTransform(selectedPieceId, {
            scaleX: piece.current.scaleX + 0.05,
            scaleY: piece.current.scaleY + 0.05
          });
          break;
        case 'scale-down':
          updatePieceTransform(selectedPieceId, {
            scaleX: piece.current.scaleX - 0.05,
            scaleY: piece.current.scaleY - 0.05
          });
          break;
        case 'width-up':
          updatePieceTransform(selectedPieceId, { scaleX: piece.current.scaleX + 0.05 });
          break;
        case 'width-down':
          updatePieceTransform(selectedPieceId, { scaleX: piece.current.scaleX - 0.05 });
          break;
        case 'height-up':
          updatePieceTransform(selectedPieceId, { scaleY: piece.current.scaleY + 0.05 });
          break;
        case 'height-down':
          updatePieceTransform(selectedPieceId, { scaleY: piece.current.scaleY - 0.05 });
          break;
      }
      checkWinCondition();
    },
    [selectedPieceId, pieces, updatePieceTransform, checkWinCondition]
  );

  const handleControlDown = useCallback(
    (action: ControlAction, e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setActiveControl(action);
      handleControlAction(action);

      // 長按持續執行
      controlIntervalRef.current = window.setInterval(() => {
        handleControlAction(action);
      }, 100);
    },
    [handleControlAction]
  );

  const handleControlUp = useCallback(() => {
    setActiveControl(null);
    if (controlIntervalRef.current) {
      clearInterval(controlIntervalRef.current);
      controlIntervalRef.current = null;
    }
  }, []);

  // 只在選取方塊且不在勝利狀態時顯示
  if (!selectedPieceId || gameState === 'WIN') {
    return null;
  }

  return (
    <div className="transform-controls">
      {/* 旋轉控制 */}
      <div className="control-group rotate-group">
        <button
          className={`transform-btn ${activeControl === 'rotate-left' ? 'active' : ''}`}
          onPointerDown={(e) => handleControlDown('rotate-left', e)}
          onPointerUp={handleControlUp}
          onPointerLeave={handleControlUp}
          onPointerCancel={handleControlUp}
        >
          <span className="btn-icon">↺</span>
        </button>
        <span className="group-label">旋轉</span>
        <button
          className={`transform-btn ${activeControl === 'rotate-right' ? 'active' : ''}`}
          onPointerDown={(e) => handleControlDown('rotate-right', e)}
          onPointerUp={handleControlUp}
          onPointerLeave={handleControlUp}
          onPointerCancel={handleControlUp}
        >
          <span className="btn-icon">↻</span>
        </button>
      </div>

      {uniformScaleOnly ? (
        /* 等比例縮放控制 */
        <div className="control-group scale-group">
          <button
            className={`transform-btn small ${activeControl === 'scale-down' ? 'active' : ''}`}
            onPointerDown={(e) => handleControlDown('scale-down', e)}
            onPointerUp={handleControlUp}
            onPointerLeave={handleControlUp}
            onPointerCancel={handleControlUp}
          >
            <span className="btn-icon">−</span>
          </button>
          <span className="group-label">大小</span>
          <button
            className={`transform-btn small ${activeControl === 'scale-up' ? 'active' : ''}`}
            onPointerDown={(e) => handleControlDown('scale-up', e)}
            onPointerUp={handleControlUp}
            onPointerLeave={handleControlUp}
            onPointerCancel={handleControlUp}
          >
            <span className="btn-icon">+</span>
          </button>
        </div>
      ) : (
        <>
          {/* 寬度控制 */}
          <div className="control-group width-group">
            <button
              className={`transform-btn small ${activeControl === 'width-down' ? 'active' : ''}`}
              onPointerDown={(e) => handleControlDown('width-down', e)}
              onPointerUp={handleControlUp}
              onPointerLeave={handleControlUp}
              onPointerCancel={handleControlUp}
            >
              <span className="btn-icon">−</span>
            </button>
            <span className="group-label">寬</span>
            <button
              className={`transform-btn small ${activeControl === 'width-up' ? 'active' : ''}`}
              onPointerDown={(e) => handleControlDown('width-up', e)}
              onPointerUp={handleControlUp}
              onPointerLeave={handleControlUp}
              onPointerCancel={handleControlUp}
            >
              <span className="btn-icon">+</span>
            </button>
          </div>

          {/* 高度控制 */}
          <div className="control-group height-group">
            <button
              className={`transform-btn small ${activeControl === 'height-down' ? 'active' : ''}`}
              onPointerDown={(e) => handleControlDown('height-down', e)}
              onPointerUp={handleControlUp}
              onPointerLeave={handleControlUp}
              onPointerCancel={handleControlUp}
            >
              <span className="btn-icon">−</span>
            </button>
            <span className="group-label">高</span>
            <button
              className={`transform-btn small ${activeControl === 'height-up' ? 'active' : ''}`}
              onPointerDown={(e) => handleControlDown('height-up', e)}
              onPointerUp={handleControlUp}
              onPointerLeave={handleControlUp}
              onPointerCancel={handleControlUp}
            >
              <span className="btn-icon">+</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
