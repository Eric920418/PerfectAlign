import { useMemo } from 'react';
import type { ReactElement } from 'react';
import './PixelGrid.css';

interface TargetPosition {
  x: number;
  y: number;
}

interface PixelGridProps {
  width: number;
  height: number;
  visible: boolean;
  targetPositions?: TargetPosition[];
  zoom?: number;
}

export function PixelGrid({ width, height, visible, targetPositions = [], zoom = 1 }: PixelGridProps) {
  // 格線視覺間距：最小 5px，不會更細（太細看不清）
  // zoom=2 時顯示 5px 格線，zoom=1 時顯示 10px 格線
  const visualGridSize = zoom >= 2 ? 5 : 10;

  const gridPattern = useMemo(() => {
    // 計算網格線
    const lines: ReactElement[] = [];
    // 每 10 格顯示粗線 (如果是 10px 格子，就是 100px 一條粗線)
    const majorInterval = visualGridSize * 10;

    // 垂直線
    for (let x = 0; x <= width; x += visualGridSize) {
      const isMajor = x % majorInterval === 0;
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
    for (let y = 0; y <= height; y += visualGridSize) {
      const isMajor = y % majorInterval === 0;
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
  }, [width, height, visualGridSize]);

  if (!visible) return null;

  return (
    <svg
      className="pixel-grid"
      width={width}
      height={height}
      style={{ width, height }}
      shapeRendering="geometricPrecision"
    >
      {gridPattern}

      {/* 目標位置輔助線 */}
      {targetPositions.map((pos, index) => (
        <g key={`target-${index}`}>
          {/* 垂直輔助線 */}
          <line
            x1={pos.x}
            y1={0}
            x2={pos.x}
            y2={height}
            className="grid-line target"
          />
          {/* 水平輔助線 */}
          <line
            x1={0}
            y1={pos.y}
            x2={width}
            y2={pos.y}
            className="grid-line target"
          />
          {/* 目標點 */}
          <circle
            cx={pos.x}
            cy={pos.y}
            r={4}
            className="target-point"
          />
        </g>
      ))}

      {/* 座標標記 */}
      <text x={4} y={12} className="grid-label">0,0</text>
      <text x={width - 40} y={12} className="grid-label">{width},0</text>
      <text x={4} y={height - 4} className="grid-label">0,{height}</text>
    </svg>
  );
}
