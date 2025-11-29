import type { PieceState, Zone, WinRating } from '../types';

// ===== 角度正規化 =====
export function normalizeAngle(angle: number): number {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

// ===== 計算總誤差 =====
export function calculateError(pieces: PieceState[]): number {
  const W_POSITION = 1.0;   // 位置權重
  const W_ROTATION = 0.5;   // 旋轉權重（1° ≈ 0.5px 誤差）
  const W_SCALE = 50.0;     // 縮放權重（0.01 差異 ≈ 0.5px 誤差）

  return pieces.reduce((total, piece) => {
    const dx = Math.abs(piece.current.x - piece.target.x);
    const dy = Math.abs(piece.current.y - piece.target.y);
    const dr = Math.abs(normalizeAngle(piece.current.rotation - piece.target.rotation));
    const dsx = Math.abs(piece.current.scaleX - piece.target.scaleX);
    const dsy = Math.abs(piece.current.scaleY - piece.target.scaleY);

    return total + (dx + dy) * W_POSITION + dr * W_ROTATION + (dsx + dsy) * W_SCALE;
  }, 0);
}

// ===== 獲取勝利評級 =====
// 更嚴格的判定：必須非常精確
export function getWinRating(totalError: number): WinRating {
  if (totalError < 0.5) return 'Perfect';  // 幾乎完美
  if (totalError < 2) return 'Great';      // 非常好
  if (totalError < 5) return 'Good';       // 可以過關
  return null;
}

// ===== 微調區域判定 =====
export function getZone(px: number, py: number, w: number, h: number): Zone {
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.12;
  const distToCenter = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);

  if (distToCenter < R) return 'CENTER';

  const aboveMain = py < (h / w) * px;
  const aboveSub = py < -(h / w) * px + h;

  if (aboveMain && aboveSub) return 'TOP';
  if (!aboveMain && !aboveSub) return 'BOTTOM';
  if (!aboveMain && aboveSub) return 'LEFT';
  if (aboveMain && !aboveSub) return 'RIGHT';

  // 預設返回中央（理論上不會到達這裡）
  return 'CENTER';
}

// ===== Lerp 插值 =====
export function lerp(current: number, target: number, factor: number = 0.15): number {
  return current + (target - current) * factor;
}

// ===== 限制縮放範圍 =====
export function clampScale(scale: number): number {
  return Math.max(0.5, Math.min(2.0, scale));
}

// ===== 角度轉弧度 =====
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// ===== 弧度轉角度 =====
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}
