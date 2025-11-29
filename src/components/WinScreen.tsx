import { useGameStore } from '../stores/gameStore';
import './WinScreen.css';

interface WinScreenProps {
  onReplay: () => void;
  onNextLevel: () => void;
  onWatchReplay: () => void;
}

export function WinScreen({ onReplay, onNextLevel, onWatchReplay }: WinScreenProps) {
  const { gameState, winRating, totalError, resetLevel, actionLogs } = useGameStore();

  if (gameState !== 'WIN') {
    return null;
  }

  const getRatingStyle = () => {
    switch (winRating) {
      case 'Perfect':
        return 'rating-perfect';
      case 'Great':
        return 'rating-great';
      case 'Good':
        return 'rating-good';
      default:
        return '';
    }
  };

  const handleReplay = () => {
    resetLevel();
    onReplay();
  };

  return (
    <div className="win-screen">
      <div className={`win-content ${getRatingStyle()}`}>
        <h1 className="win-rating">{winRating}</h1>
        <p className="win-error">誤差: {totalError.toFixed(2)}px</p>

        <div className="win-stars">
          {winRating === 'Perfect' && '★★★'}
          {winRating === 'Great' && '★★☆'}
          {winRating === 'Good' && '★☆☆'}
        </div>

        <div className="win-stats">
          <span>操作次數: {actionLogs.length}</span>
        </div>

        <div className="win-buttons">
          <button className="btn btn-secondary" onClick={handleReplay}>
            重玩
          </button>
          {actionLogs.length > 0 && (
            <button className="btn btn-outline" onClick={onWatchReplay}>
              觀看回放
            </button>
          )}
          <button className="btn btn-primary" onClick={onNextLevel}>
            下一關
          </button>
        </div>
      </div>
    </div>
  );
}
