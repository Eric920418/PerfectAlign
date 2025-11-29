import type { PieceState, WinRating } from '../types';

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
// 零誤差判定：必須完全精確
export function getWinRating(totalError: number): WinRating {
  if (totalError === 0) return 'Perfect';  // 完全精確
  if (totalError < 0.01) return 'Great';   // 幾乎完美（浮點數誤差容許）
  if (totalError < 0.1) return 'Good';     // 非常接近
  return null;  // 不過關
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
