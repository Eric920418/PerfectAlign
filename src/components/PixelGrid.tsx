import { useMemo } from 'react';
import type { ReactElement } from 'react';
import type { PieceConfig } from '../types';
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
  gridSize: number;
  // 目標預覽模式
  showTargetBoxes?: boolean;
  pieces?: PieceConfig[];
}

export function PixelGrid({
  width,
  height,
  visible,
  targetPositions = [],
  gridSize,
  showTargetBoxes = false,
  pieces = []
}: PixelGridProps) {
  const visualGridSize = gridSize;

  const gridPattern = useMemo(() => {
    const lines: ReactElement[] = [];
    const majorInterval = visualGridSize * 10;

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
          <line
            x1={pos.x}
            y1={0}
            x2={pos.x}
            y2={height}
            className="grid-line target"
          />
          <line
            x1={0}
            y1={pos.y}
            x2={width}
            y2={pos.y}
            className="grid-line target"
          />
          <circle
            cx={pos.x}
            cy={pos.y}
            r={4}
            className="target-point"
          />
        </g>
      ))}

      {/* 目標方塊預覽（與 PixiJS anchor(0.5) 完全一致的座標） */}
      {showTargetBoxes && pieces.map((piece) => {
        const { x, y, rotation, scaleX, scaleY } = piece.target_transform;
        const w = piece.shape?.width || 80;
        const h = piece.shape?.height || 80;

        return (
          <g
            key={`target-box-${piece.id}`}
            transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scaleX}, ${scaleY})`}
          >
            {/* 目標框 - 中心在原點，與 PixiJS anchor(0.5) 一致 */}
            <rect
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              className="target-box"
            />
            {/* 標籤 */}
            <text
              x={0}
              y={0}
              className="target-box-label"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {piece.id}
            </text>
            {/* 四角標記 */}
            <path
              d={`M${-w/2} ${-h/2 + 10} L${-w/2} ${-h/2} L${-w/2 + 10} ${-h/2}`}
              className="target-box-corner"
            />
            <path
              d={`M${w/2 - 10} ${-h/2} L${w/2} ${-h/2} L${w/2} ${-h/2 + 10}`}
              className="target-box-corner"
            />
            <path
              d={`M${-w/2} ${h/2 - 10} L${-w/2} ${h/2} L${-w/2 + 10} ${h/2}`}
              className="target-box-corner"
            />
            <path
              d={`M${w/2 - 10} ${h/2} L${w/2} ${h/2} L${w/2} ${h/2 - 10}`}
              className="target-box-corner"
            />
          </g>
        );
      })}

      {/* 座標標記 */}
      <text x={4} y={12} className="grid-label">0,0</text>
      <text x={width - 40} y={12} className="grid-label">{width},0</text>
      <text x={4} y={height - 4} className="grid-label">0,{height}</text>
    </svg>
  );
}
