import { useCallback, useRef, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getZone } from '../utils';
import type { Zone } from '../types';
import './FineTuneOverlay.css';

interface FineTuneOverlayProps {
  width: number;
  height: number;
}

type ControlAction = 'rotate-left' | 'rotate-right' | 'scale-up' | 'scale-down';

export function FineTuneOverlay({ width, height }: FineTuneOverlayProps) {
  const {
    gameState,
    selectedPieceId,
    setGameState,
    updatePieceTransform,
    addActionLog,
    checkWinCondition,
    pieces,
    snapSize,
  } = useGameStore();

  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [activeControl, setActiveControl] = useState<ControlAction | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressIntervalRef = useRef<number | null>(null);
  const controlIntervalRef = useRef<number | null>(null);

  const handleZoneAction = useCallback(
    (zone: Zone) => {
      if (!selectedPieceId) return;

      const piece = pieces.find((p) => p.id === selectedPieceId);
      if (!piece) return;

      if (zone === 'CENTER') {
        setGameState('PLAYING');
        return;
      }

      // 位移操作（使用 snapSize 作為步長）
      const direction = zone.toLowerCase() as 'up' | 'down' | 'left' | 'right';
      let dx = 0;
      let dy = 0;

      switch (zone) {
        case 'TOP':
          dy = -snapSize;
          break;
        case 'BOTTOM':
          dy = snapSize;
          break;
        case 'LEFT':
          dx = -snapSize;
          break;
        case 'RIGHT':
          dx = snapSize;
          break;
      }

      updatePieceTransform(selectedPieceId, {
        x: piece.current.x + dx,
        y: piece.current.y + dy,
      });

      addActionLog({
        pieceId: selectedPieceId,
        type: 'fine_move',
        payload: { direction },
      });

      checkWinCondition();
    },
    [selectedPieceId, pieces, setGameState, updatePieceTransform, addActionLog, checkWinCondition, snapSize]
  );

  // 長按持續旋轉/縮放
  const handleLongPressAction = useCallback(
    (zone: Zone) => {
      if (!selectedPieceId) return;

      const piece = pieces.find((p) => p.id === selectedPieceId);
      if (!piece) return;

      // 長按上/下區縮放，左/右區旋轉
      if (zone === 'TOP') {
        const newScale = piece.current.scale + 0.01;
        updatePieceTransform(selectedPieceId, { scale: newScale });
      } else if (zone === 'BOTTOM') {
        const newScale = piece.current.scale - 0.01;
        updatePieceTransform(selectedPieceId, { scale: newScale });
      } else if (zone === 'LEFT') {
        const newRotation = piece.current.rotation - 1;
        updatePieceTransform(selectedPieceId, { rotation: newRotation });
      } else if (zone === 'RIGHT') {
        const newRotation = piece.current.rotation + 1;
        updatePieceTransform(selectedPieceId, { rotation: newRotation });
      }
    },
    [selectedPieceId, pieces, updatePieceTransform]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const zone = getZone(x, y, width, height);

      setActiveZone(zone);
      handleZoneAction(zone);

      // 設定長按計時器
      if (zone !== 'CENTER') {
        longPressTimerRef.current = window.setTimeout(() => {
          longPressIntervalRef.current = window.setInterval(() => {
            handleLongPressAction(zone);
          }, 100);
        }, 500);
      }
    },
    [width, height, handleZoneAction, handleLongPressAction]
  );

  const handlePointerUp = useCallback(() => {
    setActiveZone(null);

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (longPressIntervalRef.current) {
      clearInterval(longPressIntervalRef.current);
      longPressIntervalRef.current = null;

      // 記錄旋轉/縮放操作結束
      if (selectedPieceId) {
        checkWinCondition();
      }
    }
  }, [selectedPieceId, checkWinCondition]);

  // 旋轉/縮放控制按鈕
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

  if (gameState !== 'FINE_TUNE') {
    return null;
  }

  return (
    <div
      className="fine-tune-overlay"
      style={{ width, height }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* 方向指示箭頭 */}
      <div className={`zone-indicator top ${activeZone === 'TOP' ? 'active' : ''}`}>
        <span className="arrow">↑</span>
      </div>
      <div className={`zone-indicator bottom ${activeZone === 'BOTTOM' ? 'active' : ''}`}>
        <span className="arrow">↓</span>
      </div>
      <div className={`zone-indicator left ${activeZone === 'LEFT' ? 'active' : ''}`}>
        <span className="arrow">←</span>
      </div>
      <div className={`zone-indicator right ${activeZone === 'RIGHT' ? 'active' : ''}`}>
        <span className="arrow">→</span>
      </div>
      <div className={`zone-indicator center ${activeZone === 'CENTER' ? 'active' : ''}`}>
        <span className="icon">✕</span>
      </div>

      {/* 區域視覺提示 */}
      {activeZone && activeZone !== 'CENTER' && (
        <div className={`ripple ${activeZone.toLowerCase()}`} />
      )}

      {/* 旋轉控制按鈕 */}
      <div
        className={`control-btn rotate-left ${activeControl === 'rotate-left' ? 'active' : ''}`}
        onPointerDown={(e) => handleControlDown('rotate-left', e)}
        onPointerUp={handleControlUp}
        onPointerLeave={handleControlUp}
      >
        <span>↺</span>
        <span className="control-label">-5°</span>
      </div>
      <div
        className={`control-btn rotate-right ${activeControl === 'rotate-right' ? 'active' : ''}`}
        onPointerDown={(e) => handleControlDown('rotate-right', e)}
        onPointerUp={handleControlUp}
        onPointerLeave={handleControlUp}
      >
        <span>↻</span>
        <span className="control-label">+5°</span>
      </div>

      {/* 縮放控制按鈕 */}
      <div
        className={`control-btn scale-down ${activeControl === 'scale-down' ? 'active' : ''}`}
        onPointerDown={(e) => handleControlDown('scale-down', e)}
        onPointerUp={handleControlUp}
        onPointerLeave={handleControlUp}
      >
        <span>−</span>
        <span className="control-label">縮小</span>
      </div>
      <div
        className={`control-btn scale-up ${activeControl === 'scale-up' ? 'active' : ''}`}
        onPointerDown={(e) => handleControlDown('scale-up', e)}
        onPointerUp={handleControlUp}
        onPointerLeave={handleControlUp}
      >
        <span>+</span>
        <span className="control-label">放大</span>
      </div>
    </div>
  );
}
