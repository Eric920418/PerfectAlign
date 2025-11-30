import { useGameStore } from '../stores/gameStore';
import './SnapFeedback.css';

// 生成粒子 - 增加數量更誇張
const particles = Array.from({ length: 40 }, (_, i) => i);
// 第二波粒子
const particles2 = Array.from({ length: 20 }, (_, i) => i);

export function SnapFeedback() {
  const { activeFeedback, feedbackTargetPos, levelConfig } = useGameStore();

  if (!activeFeedback) return null;

  const canvasHeight = levelConfig?.canvas.height || 500;
  const canvasWidth = levelConfig?.canvas.width || 375;

  return (
    <>
      {/* 旋轉正確 */}
      {activeFeedback === 'rotation' && (
        <div className="snap-feedback rotation">
          <div className="feedback-icon rotation-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </div>
          <div className="feedback-text">角度正確!</div>
          <div className="feedback-ring" />
        </div>
      )}

      {/* 縮放正確 */}
      {activeFeedback === 'scale' && (
        <div className="snap-feedback scale">
          <div className="feedback-icon scale-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </div>
          <div className="feedback-text">大小正確!</div>
          <div className="feedback-pulse" />
        </div>
      )}

      {/* X 軸位置正確 - 垂直線 + 粒子 */}
      {activeFeedback === 'positionX' && feedbackTargetPos && (
        <div className="position-feedback positionX">
          {/* 垂直輔助線 */}
          <div
            className="axis-line vertical"
            style={{
              left: `${(feedbackTargetPos.x / canvasWidth) * 100}%`,
              height: '100%'
            }}
          />
          {/* 粒子火花 - 第一波 */}
          <div
            className="particle-container"
            style={{
              left: `${(feedbackTargetPos.x / canvasWidth) * 100}%`,
              top: '50%'
            }}
          >
            {particles.map((i) => (
              <div
                key={i}
                className="particle large"
                style={{
                  '--angle': `${(i / particles.length) * 360}deg`,
                  '--delay': `${Math.random() * 0.15}s`,
                  '--distance': `${80 + Math.random() * 150}px`,
                  '--size': `${8 + Math.random() * 8}px`,
                } as React.CSSProperties}
              />
            ))}
            {/* 第二波粒子 - 延遲爆發 */}
            {particles2.map((i) => (
              <div
                key={`wave2-${i}`}
                className="particle secondary"
                style={{
                  '--angle': `${(i / particles2.length) * 360 + 9}deg`,
                  '--delay': `${0.1 + Math.random() * 0.2}s`,
                  '--distance': `${60 + Math.random() * 100}px`,
                  '--size': `${5 + Math.random() * 5}px`,
                } as React.CSSProperties}
              />
            ))}
          </div>
          <div className="feedback-label x-label">X 軸對齊!</div>
        </div>
      )}

      {/* Y 軸位置正確 - 水平線 + 粒子 */}
      {activeFeedback === 'positionY' && feedbackTargetPos && (
        <div className="position-feedback positionY">
          {/* 水平輔助線 */}
          <div
            className="axis-line horizontal"
            style={{
              top: `${(feedbackTargetPos.y / canvasHeight) * 100}%`,
              width: '100%'
            }}
          />
          {/* 粒子火花 - 第一波 */}
          <div
            className="particle-container"
            style={{
              left: '50%',
              top: `${(feedbackTargetPos.y / canvasHeight) * 100}%`
            }}
          >
            {particles.map((i) => (
              <div
                key={i}
                className="particle large"
                style={{
                  '--angle': `${(i / particles.length) * 360}deg`,
                  '--delay': `${Math.random() * 0.15}s`,
                  '--distance': `${80 + Math.random() * 150}px`,
                  '--size': `${8 + Math.random() * 8}px`,
                } as React.CSSProperties}
              />
            ))}
            {/* 第二波粒子 - 延遲爆發 */}
            {particles2.map((i) => (
              <div
                key={`wave2-${i}`}
                className="particle secondary"
                style={{
                  '--angle': `${(i / particles2.length) * 360 + 9}deg`,
                  '--delay': `${0.1 + Math.random() * 0.2}s`,
                  '--distance': `${60 + Math.random() * 100}px`,
                  '--size': `${5 + Math.random() * 5}px`,
                } as React.CSSProperties}
              />
            ))}
          </div>
          <div className="feedback-label y-label">Y 軸對齊!</div>
        </div>
      )}
    </>
  );
}
