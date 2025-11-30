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
    addActionLog,
  } = useGameStore();

  // 記錄操作開始時的值
  const startValuesRef = useRef<{
    rotation: number;
    scaleX: number;
    scaleY: number;
  } | null>(null);

  // 是否只允許等比例縮放
  const uniformScaleOnly = levelConfig?.uniform_scale_only ?? false;

  const [activeControl, setActiveControl] = useState<ControlAction | null>(null);
  const controlIntervalRef = useRef<number | null>(null);

  const handleControlAction = useCallback(
    (action: ControlAction) => {
      if (!selectedPieceId) return;

      const piece = pieces.find((p) => p.id === selectedPieceId);
      if (!piece) return;

      // 等比縮放：固定 0.1 步長
      const uniformScaleStep = 0.1;

      // 單獨調整寬高：根據基礎尺寸計算步長，確保每邊增加 5px（一格）
      // 100px → 10/100 = 0.1 → 每邊 +5px
      // 50px → 10/50 = 0.2 → 每邊 +5px
      const baseWidth = piece.shape?.width ?? 100;
      const baseHeight = piece.shape?.height ?? 100;
      const widthScaleStep = 10 / baseWidth;
      const heightScaleStep = 10 / baseHeight;

      switch (action) {
        case 'rotate-left':
          updatePieceTransform(selectedPieceId, { rotation: piece.current.rotation - 5 });
          break;
        case 'rotate-right':
          updatePieceTransform(selectedPieceId, { rotation: piece.current.rotation + 5 });
          break;
        case 'scale-up':
          updatePieceTransform(selectedPieceId, {
            scaleX: piece.current.scaleX + uniformScaleStep,
            scaleY: piece.current.scaleY + uniformScaleStep
          });
          break;
        case 'scale-down':
          updatePieceTransform(selectedPieceId, {
            scaleX: piece.current.scaleX - uniformScaleStep,
            scaleY: piece.current.scaleY - uniformScaleStep
          });
          break;
        case 'width-up':
          updatePieceTransform(selectedPieceId, { scaleX: piece.current.scaleX + widthScaleStep });
          break;
        case 'width-down':
          updatePieceTransform(selectedPieceId, { scaleX: piece.current.scaleX - widthScaleStep });
          break;
        case 'height-up':
          updatePieceTransform(selectedPieceId, { scaleY: piece.current.scaleY + heightScaleStep });
          break;
        case 'height-down':
          updatePieceTransform(selectedPieceId, { scaleY: piece.current.scaleY - heightScaleStep });
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

      // 記錄操作開始時的值
      if (selectedPieceId) {
        const piece = pieces.find((p) => p.id === selectedPieceId);
        if (piece) {
          startValuesRef.current = {
            rotation: piece.current.rotation,
            scaleX: piece.current.scaleX,
            scaleY: piece.current.scaleY,
          };
        }
      }

      setActiveControl(action);
      handleControlAction(action);

      // 長按持續執行
      controlIntervalRef.current = window.setInterval(() => {
        handleControlAction(action);
      }, 100);
    },
    [handleControlAction, selectedPieceId, pieces]
  );

  const handleControlUp = useCallback(() => {
    // 記錄操作到 actionLogs
    if (selectedPieceId && startValuesRef.current && activeControl) {
      const piece = pieces.find((p) => p.id === selectedPieceId);
      if (piece) {
        const isRotateAction = activeControl.startsWith('rotate');
        const isScaleAction = activeControl.includes('scale') ||
                              activeControl.includes('width') ||
                              activeControl.includes('height');

        if (isRotateAction && startValuesRef.current.rotation !== piece.current.rotation) {
          addActionLog({
            pieceId: selectedPieceId,
            type: 'rotate',
            payload: {
              fromRotation: startValuesRef.current.rotation,
              toRotation: piece.current.rotation,
            },
          });
        }

        if (isScaleAction && (
          startValuesRef.current.scaleX !== piece.current.scaleX ||
          startValuesRef.current.scaleY !== piece.current.scaleY
        )) {
          addActionLog({
            pieceId: selectedPieceId,
            type: 'scale',
            payload: {
              fromScaleX: startValuesRef.current.scaleX,
              fromScaleY: startValuesRef.current.scaleY,
              toScaleX: piece.current.scaleX,
              toScaleY: piece.current.scaleY,
            },
          });
        }
      }
    }

    startValuesRef.current = null;
    setActiveControl(null);
    if (controlIntervalRef.current) {
      clearInterval(controlIntervalRef.current);
      controlIntervalRef.current = null;
    }
  }, [selectedPieceId, pieces, activeControl, addActionLog]);

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
