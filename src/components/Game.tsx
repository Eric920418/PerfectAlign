import { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './GameCanvas';
import { PreviewButton, PreviewOverlay } from './PreviewButton';
import { WinScreen } from './WinScreen';
import { ReplayPlayer } from './ReplayPlayer';
import { TargetPreview } from './TargetPreview';
import { PixelGrid } from './PixelGrid';
import { TransformControls } from './TransformControls';
import { SnapFeedback } from './SnapFeedback';
import { useGameStore } from '../stores/gameStore';
import { useResponsiveScale } from '../hooks/useResponsiveScale';
import { usePinchZoom } from '../hooks/usePinchZoom';
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
  const { snapSize, setSnapSize, resetLevel, isPreviewActive, gameState } = useGameStore();

  // 響應式縮放
  const { scale: baseScale } = useResponsiveScale(
    levelConfig?.canvas.width || 375,
    levelConfig?.canvas.height || 500
  );

  // 雙指縮放
  const {
    scale: userScale,
    translateX,
    translateY,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetView,
    isZoomed,
  } = usePinchZoom({ minScale: 1, maxScale: 5 });

  useEffect(() => {
    // 載入關卡設定
    setLevelConfig(levels[currentLevelIndex]);
  }, [currentLevelIndex]);

  // 過關時自動重置視圖
  useEffect(() => {
    if (gameState === 'WIN') {
      resetView();
    }
  }, [gameState, resetView]);

  const handleTargetPreviewComplete = useCallback(() => {
    setShowTargetPreview(false);
    setGameReady(true);
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
      alert('恭喜通關所有關卡！');
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
    <div className="game-container">
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

      {/* 縮放容器 - 處理雙指縮放 */}
      <div
        className="zoom-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `scale(${userScale}) translate(${translateX / userScale}px, ${translateY / userScale}px)`,
          transformOrigin: 'center center',
        }}
      >
        <div
          className="game-viewport"
          style={{
            width: levelConfig.canvas.width,
            height: levelConfig.canvas.height,
            transform: `scale(${baseScale})`,
            transformOrigin: 'center center',
          }}
        >
        {/* 像素網格 */}
        <PixelGrid
          width={levelConfig.canvas.width}
          height={levelConfig.canvas.height}
          visible={true}
          gridSize={snapSize === 1 ? 5 : snapSize === 5 ? 10 : 20}
          targetPositions={isPreviewActive ? levelConfig.pieces.map(p => ({
            x: p.target_transform.x,
            y: p.target_transform.y,
          })) : []}
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

        {/* 預覽覆蓋層 - 疊加在遊戲畫面上 */}
        {gameReady && (
          <PreviewOverlay
            previewImage={levelConfig.preview_image}
            canvasWidth={levelConfig.canvas.width}
            canvasHeight={levelConfig.canvas.height}
          />
        )}

        {/* 勝利畫面 */}
        <WinScreen
          onReplay={handleReplay}
          onNextLevel={handleNextLevel}
          onWatchReplay={handleWatchReplay}
        />
        </div>
      </div>

      {/* 縮放指示器 */}
      {isZoomed && (
        <div className="zoom-indicator">
          {Math.round(userScale * 100)}%
        </div>
      )}

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
        {gameReady && <PreviewButton />}
        {/* 重置視圖按鈕 */}
        {isZoomed && (
          <button className="reset-view-btn" onClick={resetView}>
            重置
          </button>
        )}
      </div>

      {/* 回放播放器 */}
      {showReplay && <ReplayPlayer onClose={handleCloseReplay} />}

      {/* 旋轉/縮放控制（選取方塊後顯示） */}
      {gameReady && <TransformControls />}

      {/* 視覺回饋效果 */}
      <SnapFeedback />
    </div>
  );
}
