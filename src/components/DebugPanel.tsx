import { useGameStore } from '../stores/gameStore';
import { calculateError } from '../utils';
import './DebugPanel.css';

export function DebugPanel() {
  const {
    gameState,
    selectedPieceId,
    pieces,
    actionLogs,
  } = useGameStore();

  const currentError = calculateError(pieces);
  const selectedPiece = pieces.find((p) => p.id === selectedPieceId);

  return (
    <div className="debug-panel">
      <h3>Debug Info</h3>

      <div className="debug-section">
        <strong>遊戲狀態:</strong> {gameState}
      </div>

      <div className="debug-section">
        <strong>當前誤差:</strong> {currentError.toFixed(2)}px
      </div>

      <div className="debug-section">
        <strong>選取碎片:</strong> {selectedPieceId || '無'}
      </div>

      {selectedPiece && (
        <div className="debug-section">
          <strong>碎片位置:</strong>
          <div className="debug-values">
            <span>X: {selectedPiece.current.x.toFixed(1)}</span>
            <span>Y: {selectedPiece.current.y.toFixed(1)}</span>
            <span>R: {selectedPiece.current.rotation.toFixed(1)}°</span>
            <span>W: {selectedPiece.current.scaleX.toFixed(2)}</span>
            <span>H: {selectedPiece.current.scaleY.toFixed(2)}</span>
          </div>
          <strong>目標位置:</strong>
          <div className="debug-values">
            <span>X: {selectedPiece.target.x.toFixed(1)}</span>
            <span>Y: {selectedPiece.target.y.toFixed(1)}</span>
            <span>R: {selectedPiece.target.rotation.toFixed(1)}°</span>
            <span>W: {selectedPiece.target.scaleX.toFixed(2)}</span>
            <span>H: {selectedPiece.target.scaleY.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="debug-section">
        <strong>操作記錄:</strong> {actionLogs.length} 筆
      </div>

      <div className="debug-section pieces-list">
        <strong>所有碎片:</strong>
        {pieces.map((piece) => {
          const dx = Math.abs(piece.current.x - piece.target.x);
          const dy = Math.abs(piece.current.y - piece.target.y);
          const posError = dx + dy;
          return (
            <div
              key={piece.id}
              className={`piece-item ${piece.id === selectedPieceId ? 'selected' : ''}`}
            >
              <span className="piece-id">{piece.id}</span>
              <span className="piece-error">Δ{posError.toFixed(1)}px</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
