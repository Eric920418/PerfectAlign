import { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './GameCanvas';
import { FineTuneOverlay } from './FineTuneOverlay';
import { PreviewButton } from './PreviewButton';
import { WinScreen } from './WinScreen';
import { DebugPanel } from './DebugPanel';
import { ReplayPlayer } from './ReplayPlayer';
import { TargetPreview } from './TargetPreview';
import { PixelGrid } from './PixelGrid';
import { TransformControls } from './TransformControls';
import { useGameStore } from '../stores/gameStore';
import { useResponsiveScale } from '../hooks/useResponsiveScale';
import type { LevelConfig, SnapSize } from '../types';
import level1Config from '../assets/levels/level1/config.json';
import './Game.css';

export function Game() {
  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showTargetPreview, setShowTargetPreview] = useState(true);
  const [gameReady, setGameReady] = useState(false);
  const { gameState, snapEnabled, snapSize, setSnapEnabled, setSnapSize } = useGameStore();

  // 響應式縮放
  const { scale } = useResponsiveScale(
    levelConfig?.canvas.width || 375,
    levelConfig?.canvas.height || 500
  );

  useEffect(() => {
    // 載入關卡設定
    setLevelConfig(level1Config as LevelConfig);
  }, []);

  const handleTargetPreviewComplete = useCallback(() => {
    setShowTargetPreview(false);
    setGameReady(true);
  }, []);

  const handleReplay = () => {
    // 重新載入同一關卡
    setLevelConfig(null);
    setShowTargetPreview(true);
    setGameReady(false);
    setTimeout(() => {
      setLevelConfig(level1Config as LevelConfig);
    }, 100);
  };

  const handleNextLevel = () => {
    // TODO: 載入下一關
    alert('恭喜通關！下一關開發中...');
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
        <span className="level-number">Level {levelConfig.level_id}</span>
        <span className="level-type">
          {levelConfig.level_type === 'image_match' ? '圖片對齊' : '文字提示'}
        </span>
      </div>

      <div
        className="game-viewport"
        style={{
          width: levelConfig.canvas.width,
          height: levelConfig.canvas.height,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* 像素網格 */}
        <PixelGrid
          width={levelConfig.canvas.width}
          height={levelConfig.canvas.height}
          gridSize={10}
          visible={showGrid && gameReady}
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

        {/* 微調模式覆蓋層 */}
        {gameReady && (
          <FineTuneOverlay
            width={levelConfig.canvas.width}
            height={levelConfig.canvas.height}
          />
        )}

        {/* 預覽按鈕 */}
        {gameReady && (
          <PreviewButton
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

      {/* 狀態指示器 */}
      <div className="game-status">
        {gameState === 'FINE_TUNE' && (
          <div className="status-indicator fine-tune">
            微調模式 - 點擊中央退出
          </div>
        )}
      </div>

      {/* 工具列 */}
      <div className="game-toolbar">
        <button
          className={`toolbar-btn ${showGrid ? 'active' : ''}`}
          onClick={() => setShowGrid(!showGrid)}
          title="切換網格"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18" />
          </svg>
        </button>
        <button
          className={`toolbar-btn ${snapEnabled ? 'active' : ''}`}
          onClick={() => setSnapEnabled(!snapEnabled)}
          title="切換對齊格線"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 14h-5v5h5v-5zM16 19l-5-5 5-5M8 5h5v5H8V5zM13 5l-5 5 5 5" />
          </svg>
        </button>
        {snapEnabled && (
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
        )}
        <button
          className={`toolbar-btn ${showDebug ? 'active' : ''}`}
          onClick={() => setShowDebug(!showDebug)}
          title="除錯面板"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </button>
      </div>

      {/* 操作提示 */}
      <div className="game-hints">
        <div className="hint-item">拖曳移動 | 雙擊微調</div>
        <div className="hint-item">Shift+滾輪旋轉 | Ctrl+滾輪縮放</div>
      </div>

      {/* Debug 面板 */}
      {showDebug && <DebugPanel />}

      {/* 回放播放器 */}
      {showReplay && <ReplayPlayer onClose={handleCloseReplay} />}

      {/* 旋轉/縮放控制（選取方塊後顯示） */}
      {gameReady && <TransformControls />}
    </div>
  );
}
