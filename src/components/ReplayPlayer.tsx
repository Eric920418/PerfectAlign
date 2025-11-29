import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import type { ActionLog, PieceConfig, Transform } from '../types';
import './ReplayPlayer.css';

interface ReplayPlayerProps {
  onClose: () => void;
}

export function ReplayPlayer({ onClose }: ReplayPlayerProps) {
  const { actionLogs, levelConfig } = useGameStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playbackSpeed, setPlaybackSpeed] = useState(3);
  const [replayPieces, setReplayPieces] = useState<Map<string, Transform>>(new Map());
  const timeoutRef = useRef<number | null>(null);

  // 初始化碎片位置
  useEffect(() => {
    if (levelConfig) {
      const initialPieces = new Map<string, Transform>();
      levelConfig.pieces.forEach((p: PieceConfig) => {
        initialPieces.set(p.id, { ...p.start_transform });
      });
      setReplayPieces(initialPieces);
    }
  }, [levelConfig]);

  // 應用單個動作
  const applyAction = useCallback((action: ActionLog) => {
    setReplayPieces((prev) => {
      const newPieces = new Map(prev);
      const piece = newPieces.get(action.pieceId);
      if (!piece) return prev;

      const updatedPiece = { ...piece };

      switch (action.type) {
        case 'drag':
          if (action.payload.toX !== undefined) updatedPiece.x = action.payload.toX;
          if (action.payload.toY !== undefined) updatedPiece.y = action.payload.toY;
          break;
        case 'fine_move':
          switch (action.payload.direction) {
            case 'up':
              updatedPiece.y -= 1;
              break;
            case 'down':
              updatedPiece.y += 1;
              break;
            case 'left':
              updatedPiece.x -= 1;
              break;
            case 'right':
              updatedPiece.x += 1;
              break;
          }
          break;
        case 'rotate':
          if (action.payload.toRotation !== undefined) {
            updatedPiece.rotation = action.payload.toRotation;
          }
          break;
        case 'scale':
          if (action.payload.toScaleX !== undefined) {
            updatedPiece.scaleX = action.payload.toScaleX;
          }
          if (action.payload.toScaleY !== undefined) {
            updatedPiece.scaleY = action.payload.toScaleY;
          }
          break;
      }

      newPieces.set(action.pieceId, updatedPiece);
      return newPieces;
    });
  }, []);

  // 播放邏輯
  useEffect(() => {
    if (!isPlaying || currentIndex >= actionLogs.length - 1) {
      if (currentIndex >= actionLogs.length - 1) {
        setIsPlaying(false);
      }
      return;
    }

    const currentAction = actionLogs[currentIndex + 1];
    const prevAction = actionLogs[currentIndex];

    // 計算延遲（基於 timestamp 差異）
    let delay = 100; // 預設最小延遲
    if (currentIndex >= 0 && prevAction) {
      delay = Math.max(50, (currentAction.timestamp - prevAction.timestamp) / playbackSpeed);
    }

    timeoutRef.current = window.setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      applyAction(currentAction);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, currentIndex, actionLogs, playbackSpeed, applyAction]);

  // 開始/暫停播放
  const togglePlay = () => {
    if (currentIndex >= actionLogs.length - 1) {
      // 重新開始
      resetReplay();
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // 重置回放
  const resetReplay = () => {
    setIsPlaying(false);
    setCurrentIndex(-1);
    if (levelConfig) {
      const initialPieces = new Map<string, Transform>();
      levelConfig.pieces.forEach((p: PieceConfig) => {
        initialPieces.set(p.id, { ...p.start_transform });
      });
      setReplayPieces(initialPieces);
    }
  };

  // 步進
  const stepForward = () => {
    if (currentIndex < actionLogs.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      applyAction(actionLogs[nextIndex]);
    }
  };

  const stepBackward = () => {
    if (currentIndex >= 0) {
      // 重置並重放到前一個位置
      const targetIndex = currentIndex - 1;
      resetReplay();

      // 重放到目標位置
      for (let i = 0; i <= targetIndex; i++) {
        applyAction(actionLogs[i]);
      }
      setCurrentIndex(targetIndex);
    }
  };

  if (!levelConfig) return null;

  const progress = actionLogs.length > 0
    ? ((currentIndex + 1) / actionLogs.length) * 100
    : 0;

  return (
    <div className="replay-overlay">
      <div className="replay-container">
        <div className="replay-header">
          <h2>回放</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* 回放畫布 */}
        <div
          className="replay-canvas"
          style={{
            width: levelConfig.canvas.width,
            height: levelConfig.canvas.height,
            background: levelConfig.canvas.background,
          }}
        >
          {Array.from(replayPieces.entries()).map(([id, transform]) => (
            <div
              key={id}
              className="replay-piece"
              style={{
                left: transform.x,
                top: transform.y,
                transform: `translate(-50%, -50%) rotate(${transform.rotation}deg) scale(${transform.scaleX}, ${transform.scaleY})`,
              }}
            >
              {id}
            </div>
          ))}

          {/* 目標位置指示 */}
          {levelConfig.pieces.map((p: PieceConfig) => (
            <div
              key={`target-${p.id}`}
              className="replay-target"
              style={{
                left: p.target_transform.x,
                top: p.target_transform.y,
                transform: `translate(-50%, -50%) rotate(${p.target_transform.rotation}deg) scale(${p.target_transform.scaleX}, ${p.target_transform.scaleY})`,
              }}
            />
          ))}
        </div>

        {/* 控制列 */}
        <div className="replay-controls">
          <div className="replay-progress">
            <div
              className="replay-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="replay-buttons">
            <button onClick={resetReplay} title="重置">
              ⏮
            </button>
            <button onClick={stepBackward} title="上一步" disabled={currentIndex < 0}>
              ⏪
            </button>
            <button onClick={togglePlay} className="play-btn">
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button onClick={stepForward} title="下一步" disabled={currentIndex >= actionLogs.length - 1}>
              ⏩
            </button>
          </div>

          <div className="replay-speed">
            <span>速度: {playbackSpeed}x</span>
            <input
              type="range"
              min="1"
              max="10"
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            />
          </div>

          <div className="replay-info">
            <span>動作: {currentIndex + 1} / {actionLogs.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
