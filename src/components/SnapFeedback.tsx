import { useGameStore } from '../stores/gameStore';
import './SnapFeedback.css';

export function SnapFeedback() {
  const { activeFeedback } = useGameStore();

  if (!activeFeedback) return null;

  return (
    <div className={`snap-feedback ${activeFeedback}`}>
      {activeFeedback === 'rotation' && (
        <>
          <div className="feedback-icon rotation-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </div>
          <div className="feedback-text">角度正確!</div>
          <div className="feedback-ring" />
        </>
      )}
      {activeFeedback === 'scale' && (
        <>
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
        </>
      )}
    </div>
  );
}
