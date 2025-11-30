import { useEffect, useState, useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import './WinTransition.css';

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
  delay: number;
}

export function WinTransition() {
  const { gameState, winRating, pieces } = useGameStore();
  const [showFlash, setShowFlash] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [showRating, setShowRating] = useState(false);

  // 根據評級選擇顏色
  const ratingColor = useMemo(() => {
    switch (winRating) {
      case 'Perfect': return '#ffe600';
      case 'Great': return '#00f3ff';
      case 'Good': return '#ff0055';
      default: return '#ffffff';
    }
  }, [winRating]);

  // 生成粒子（從所有方塊位置發射）
  const particles = useMemo(() => {
    if (gameState !== 'WINNING') return [];

    const result: Particle[] = [];
    const colors = ['#ffe600', '#00f3ff', '#ff0055', '#ffffff', '#00ff88'];
    let id = 0;

    // 從每個方塊位置發射粒子
    pieces.forEach((piece) => {
      const centerX = piece.target.x;
      const centerY = piece.target.y;

      // 每個方塊發射 30 個粒子
      for (let i = 0; i < 30; i++) {
        result.push({
          id: id++,
          x: centerX,
          y: centerY,
          angle: Math.random() * 360,
          speed: 150 + Math.random() * 200,
          size: 4 + Math.random() * 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.3,
        });
      }
    });

    // 從畫面中心也發射一波
    const canvasCenter = { x: 187, y: 250 };
    for (let i = 0; i < 50; i++) {
      result.push({
        id: id++,
        x: canvasCenter.x,
        y: canvasCenter.y,
        angle: Math.random() * 360,
        speed: 200 + Math.random() * 300,
        size: 6 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: 0.2 + Math.random() * 0.2,
      });
    }

    return result;
  }, [gameState, pieces]);

  // 動畫序列
  useEffect(() => {
    if (gameState === 'WINNING') {
      // 立即閃白
      setShowFlash(true);

      // 100ms 後開始粒子
      setTimeout(() => setShowParticles(true), 100);

      // 500ms 後顯示評級
      setTimeout(() => setShowRating(true), 500);

      // 清理
      return () => {
        setShowFlash(false);
        setShowParticles(false);
        setShowRating(false);
      };
    }
  }, [gameState]);

  if (gameState !== 'WINNING') {
    return null;
  }

  return (
    <div className="win-transition">
      {/* 閃白效果 */}
      {showFlash && <div className="flash-overlay" />}

      {/* 粒子效果 */}
      {showParticles && (
        <div className="particles-container">
          {particles.map((p) => (
            <div
              key={p.id}
              className="particle"
              style={{
                '--start-x': `${p.x}px`,
                '--start-y': `${p.y}px`,
                '--angle': `${p.angle}deg`,
                '--speed': `${p.speed}px`,
                '--size': `${p.size}px`,
                '--color': p.color,
                '--delay': `${p.delay}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* 光環效果 */}
      <div className="glow-rings">
        {pieces.map((piece) => (
          <div
            key={piece.id}
            className="glow-ring"
            style={{
              left: piece.target.x,
              top: piece.target.y,
              '--color': ratingColor,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* 評級預覽 */}
      {showRating && (
        <div className="rating-preview" style={{ '--color': ratingColor } as React.CSSProperties}>
          <span className="rating-text">{winRating}!</span>
        </div>
      )}
    </div>
  );
}
