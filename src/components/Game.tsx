import { useState, useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from './GameCanvas';
import { PreviewButton } from './PreviewButton';
import { WinScreen } from './WinScreen';
import { ReplayPlayer } from './ReplayPlayer';
import { TargetPreview } from './TargetPreview';
import { PixelGrid } from './PixelGrid';
import { TransformControls } from './TransformControls';
import { useGameStore } from '../stores/gameStore';
import { useResponsiveScale } from '../hooks/useResponsiveScale';
import type { LevelConfig, SnapSize } from '../types';
import level1Config from '../assets/levels/level1/config.json';
import level2Config from '../assets/levels/level2/config.json';
import level3Config from '../assets/levels/level3/config.json';
import './Game.css';

// 關卡列表
const levels: LevelConfig[] = [
  level1Config as LevelConfig,
  level2Config as LevelConfig,
  level3Config as LevelConfig,
];

export function Game() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);
  const [showReplay, setShowReplay] = useState(false);
  const [showTargetPreview, setShowTargetPreview] = useState(true);
  const [gameReady, setGameReady] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const { snapSize, setSnapSize, resetLevel } = useGameStore();

  // 實際 snap 值：1px→5, 5px→10, 10px→20
  const actualSnapSize = snapSize === 1 ? 5 : snapSize === 5 ? 10 : 20;

  // 雙指手勢控制視窗（不影響元素操作）
  const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: 1 });
  const gestureRef = useRef<{ x: number; y: number; dist: number } | null>(null);
  const isTwoFingerRef = useRef(false);

  // 響應式縮放
  const { scale } = useResponsiveScale(
    levelConfig?.canvas.width || 375,
    levelConfig?.canvas.height || 500
  );

  useEffect(() => {
    // 載入關卡設定
    setLevelConfig(levels[currentLevelIndex]);
  }, [currentLevelIndex]);

  const handleTargetPreviewComplete = useCallback(() => {
    setShowTargetPreview(false);
    setGameReady(true);
  }, []);

  // 雙指手勢處理（只控制視窗，不控制元素）
  const handleContainerTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isTwoFingerRef.current = true;
      const t1 = e.touches[0], t2 = e.touches[1];
      gestureRef.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
        dist: Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      };
    }
  }, []);

  const handleContainerTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && gestureRef.current && isTwoFingerRef.current) {
      e.preventDefault(); // 阻止頁面滾動
      const t1 = e.touches[0], t2 = e.touches[1];
      const cx = (t1.clientX + t2.clientX) / 2;
      const cy = (t1.clientY + t2.clientY) / 2;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

      const dx = cx - gestureRef.current.x;
      const dy = cy - gestureRef.current.y;
      const scaleFactor = dist / gestureRef.current.dist;

      setViewTransform(prev => ({
        x: prev.x + dx,
        y: prev.y + dy,
        scale: Math.max(0.5, Math.min(3, prev.scale * scaleFactor))
      }));

      gestureRef.current = { x: cx, y: cy, dist };
    }
  }, []);

  const handleContainerTouchEnd = useCallback(() => {
    gestureRef.current = null;
    isTwoFingerRef.current = false;
  }, []);

  const resetView = useCallback(() => {
    setViewTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  const handleReplay = () => {
    // 重新載入同一關卡
    resetLevel();
    setLevelConfig(null);
    setShowTargetPreview(true);
    setGameReady(false);
    setTimeout(() => {
      setLevelConfig(levels[currentLevelIndex]);
    }, 100);
  };

  const handleNextLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      // 載入下一關
      resetLevel();
      setLevelConfig(null);
      setShowTargetPreview(true);
      setGameReady(false);
      setCurrentLevelIndex(currentLevelIndex + 1);
    } else {
      // 已經是最後一關
      alert('🎉 恭喜通關所有關卡！');
    }
  };

  const handleSelectLevel = (index: number) => {
    resetLevel();
    setLevelConfig(null);
    setShowTargetPreview(true);
    setGameReady(false);
    setShowLevelSelect(false);
    setCurrentLevelIndex(index);
  };

  const handleWatchReplay = () => {
    setShowReplay(true);
  };

  const handleCloseReplay = () => {
    setShowReplay(false);
  };

  if (!levelConfig) {
    return (
      <div className="game-loading">
        <span>載入中...</span>
      </div>
    );
  }

  return (
    <div
      className="game-container"
      onTouchStart={handleContainerTouchStart}
      onTouchMove={handleContainerTouchMove}
      onTouchEnd={handleContainerTouchEnd}
    >
      {/* 關卡標題 */}
      <div className="level-header">
        <button
          className="level-select-btn"
          onClick={() => setShowLevelSelect(!showLevelSelect)}
        >
          Level {levelConfig.level_id}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <span className="level-title">
          {levelConfig.title || (levelConfig.level_type === 'image_match' ? '圖片對齊' : '文字提示')}
        </span>
      </div>

      {/* 關卡選擇面板 */}
      {showLevelSelect && (
        <div className="level-select-panel">
          {levels.map((level, index) => (
            <button
              key={level.level_id}
              className={`level-option ${index === currentLevelIndex ? 'active' : ''}`}
              onClick={() => handleSelectLevel(index)}
            >
              <span className="level-option-number">Level {level.level_id}</span>
              <span className="level-option-title">{level.title}</span>
            </button>
          ))}
        </div>
      )}

      <div
        className="game-viewport"
        style={{
          width: levelConfig.canvas.width,
          height: levelConfig.canvas.height,
          transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${scale * viewTransform.scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* 像素網格 - 間距 = 實際 snap 大小 */}
        <PixelGrid
          width={levelConfig.canvas.width}
          height={levelConfig.canvas.height}
          visible={true}
          gridSize={actualSnapSize}
          targetPositions={levelConfig.pieces.map(p => ({
            x: p.target_transform.x,
            y: p.target_transform.y,
          }))}
        />

        {/* 遊戲畫布 */}
        <GameCanvas levelConfig={levelConfig} />

        {/* 目標位置預覽（遊戲開始時） */}
        {showTargetPreview && (
          <TargetPreview
            levelConfig={levelConfig}
            onComplete={handleTargetPreviewComplete}
          />
        )}

        {/* 勝利畫面 */}
        <WinScreen
          onReplay={handleReplay}
          onNextLevel={handleNextLevel}
          onWatchReplay={handleWatchReplay}
        />
      </div>


      {/* 工具列 */}
      <div className="game-toolbar">
        <div className="snap-size-selector">
          {([1, 5, 10] as SnapSize[]).map((size) => (
            <button
              key={size}
              className={`snap-size-btn ${snapSize === size ? 'active' : ''}`}
              onClick={() => setSnapSize(size)}
            >
              {size}px
            </button>
          ))}
        </div>
        {/* 預覽按鈕 */}
        {gameReady && (
          <PreviewButton
            previewImage={levelConfig.preview_image}
            canvasWidth={levelConfig.canvas.width}
            canvasHeight={levelConfig.canvas.height}
          />
        )}
        {/* 重置視圖（有縮放或平移時顯示） */}
        {(viewTransform.scale !== 1 || viewTransform.x !== 0 || viewTransform.y !== 0) && (
          <button className="reset-view-btn" onClick={resetView}>
            重置
          </button>
        )}
      </div>

     

      {/* 回放播放器 */}
      {showReplay && <ReplayPlayer onClose={handleCloseReplay} />}

      {/* 旋轉/縮放控制（選取方塊後顯示） */}
      {gameReady && <TransformControls />}
    </div>
  );
}
