import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { GameEngine } from '../game/GameEngine';
import type { LevelConfig } from '../types';

interface GameCanvasProps {
  levelConfig: LevelConfig;
}

export function GameCanvas({ levelConfig }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const {
    pieces,
    selectedPieceId,
    isPreviewActive,
    loadLevel,
    selectPiece,
    updatePieceTransform,
    addActionLog,
    checkWinCondition,
  } = useGameStore();

  // 初始化遊戲引擎
  useEffect(() => {
    if (!containerRef.current) return;

    // 載入關卡
    loadLevel(levelConfig);

    const engine = new GameEngine({
      container: containerRef.current,
      levelConfig,
      onPieceSelect: (id) => {
        selectPiece(id);
      },
      onPieceTransformEnd: (id, x, y) => {
        const piece = useGameStore.getState().pieces.find((p) => p.id === id);
        if (piece) {
          addActionLog({
            pieceId: id,
            type: 'drag',
            payload: {
              fromX: piece.current.x,
              fromY: piece.current.y,
              toX: x,
              toY: y,
            },
          });
        }
        updatePieceTransform(id, { x, y });
        checkWinCondition();
      },
      onDoubleTap: (pieceId) => {
        // 雙擊選中方塊
        selectPiece(pieceId);
      },
      onRotate: (pieceId, rotation) => {
        const piece = useGameStore.getState().pieces.find((p) => p.id === pieceId);
        if (piece) {
          addActionLog({
            pieceId,
            type: 'rotate',
            payload: {
              fromRotation: piece.current.rotation,
              toRotation: rotation,
            },
          });
        }
        updatePieceTransform(pieceId, { rotation });
        checkWinCondition();
      },
      onScale: (pieceId, scaleX, scaleY) => {
        const piece = useGameStore.getState().pieces.find((p) => p.id === pieceId);
        if (piece) {
          addActionLog({
            pieceId,
            type: 'scale',
            payload: {
              fromScaleX: piece.current.scaleX,
              fromScaleY: piece.current.scaleY,
              toScaleX: scaleX,
              toScaleY: scaleY,
            },
          });
        }
        updatePieceTransform(pieceId, { scaleX, scaleY });
        checkWinCondition();
      },
      getSnapState: () => {
        const state = useGameStore.getState();
        // 實際 snap：1px→5, 5px→10, 10px→20
        const actualSnap = state.snapSize === 1 ? 5 : state.snapSize === 5 ? 10 : 20;
        return {
          enabled: true,
          size: actualSnap,
        };
      },
    });

    engineRef.current = engine;

    // 載入碎片
    const loadPieces = async () => {
      const initialPieces = levelConfig.pieces.map((p) => ({
        id: p.id,
        texture: p.texture,
        shape: p.shape,
        current: { ...p.start_transform },
        target: { ...p.target_transform },
      }));
      await engine.loadPieces(initialPieces);
    };

    loadPieces();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [levelConfig]);

  // 同步選取狀態
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSelectedPiece(selectedPieceId);
    }
  }, [selectedPieceId]);

  // 同步碎片變換
  useEffect(() => {
    if (engineRef.current) {
      pieces.forEach((piece) => {
        engineRef.current?.updatePiece(piece.id, piece.current);
      });
    }
  }, [pieces]);

  // 對答案時隱藏選取框
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setHideSelectionBox(isPreviewActive);
    }
  }, [isPreviewActive]);

  return (
    <div
      ref={containerRef}
      style={{
        width: levelConfig.canvas.width,
        height: levelConfig.canvas.height,
        touchAction: 'none',
        userSelect: 'none',
      }}
    />
  );
}
