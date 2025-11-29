import { useCallback, useRef, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import './TransformControls.css';

type ControlAction = 'rotate-left' | 'rotate-right' | 'scale-up' | 'scale-down';

export function TransformControls() {
  const {
    selectedPieceId,
    pieces,
    updatePieceTransform,
    checkWinCondition,
    gameState,
  } = useGameStore();

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
          updatePieceTransform(selectedPieceId, { scale: piece.current.scale + 0.05 });
          break;
        case 'scale-down':
          updatePieceTransform(selectedPieceId, { scale: piece.current.scale - 0.05 });
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
          <span className="btn-label">-5°</span>
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
          <span className="btn-label">+5°</span>
        </button>
      </div>

      {/* 縮放控制 */}
      <div className="control-group scale-group">
        <button
          className={`transform-btn ${activeControl === 'scale-down' ? 'active' : ''}`}
          onPointerDown={(e) => handleControlDown('scale-down', e)}
          onPointerUp={handleControlUp}
          onPointerLeave={handleControlUp}
          onPointerCancel={handleControlUp}
        >
          <span className="btn-icon">−</span>
          <span className="btn-label">縮小</span>
        </button>
        <span className="group-label">縮放</span>
        <button
          className={`transform-btn ${activeControl === 'scale-up' ? 'active' : ''}`}
          onPointerDown={(e) => handleControlDown('scale-up', e)}
          onPointerUp={handleControlUp}
          onPointerLeave={handleControlUp}
          onPointerCancel={handleControlUp}
        >
          <span className="btn-icon">+</span>
          <span className="btn-label">放大</span>
        </button>
      </div>
    </div>
  );
}
