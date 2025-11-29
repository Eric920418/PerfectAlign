import { useMemo } from 'react';
import type { ReactElement } from 'react';
import './PixelGrid.css';

interface PixelGridProps {
  width: number;
  height: number;
  gridSize?: number;
  visible: boolean;
}

export function PixelGrid({ width, height, gridSize = 10, visible }: PixelGridProps) {
  const gridPattern = useMemo(() => {
    // 計算網格線
    const lines: ReactElement[] = [];

    // 垂直線
    for (let x = 0; x <= width; x += gridSize) {
      const isMajor = x % 50 === 0;
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          className={isMajor ? 'grid-line major' : 'grid-line minor'}
        />
      );
    }

    // 水平線
    for (let y = 0; y <= height; y += gridSize) {
      const isMajor = y % 50 === 0;
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          className={isMajor ? 'grid-line major' : 'grid-line minor'}
        />
      );
    }

    return lines;
  }, [width, height, gridSize]);

  if (!visible) return null;

  return (
    <svg
      className="pixel-grid"
      width={width}
      height={height}
      style={{ width, height }}
    >
      {gridPattern}

      {/* 中心十字線 */}
      <line
        x1={width / 2}
        y1={0}
        x2={width / 2}
        y2={height}
        className="grid-line center"
      />
      <line
        x1={0}
        y1={height / 2}
        x2={width}
        y2={height / 2}
        className="grid-line center"
      />

      {/* 座標標記 */}
      <text x={4} y={12} className="grid-label">0,0</text>
      <text x={width - 40} y={12} className="grid-label">{width},0</text>
      <text x={4} y={height - 4} className="grid-label">0,{height}</text>
    </svg>
  );
}
