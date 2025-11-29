import { useState, useEffect, useCallback } from 'react';

interface ResponsiveScaleResult {
  scale: number;
  containerWidth: number;
  containerHeight: number;
}

export function useResponsiveScale(
  baseWidth: number,
  baseHeight: number,
  padding: number = 32
): ResponsiveScaleResult {
  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(baseWidth);
  const [containerHeight, setContainerHeight] = useState(baseHeight);

  const calculateScale = useCallback(() => {
    const viewportWidth = window.innerWidth - padding * 2;
    // 預留更多垂直空間給 header (80px) 和 toolbar (80px)
    const reservedHeight = 160;
    const viewportHeight = window.innerHeight - reservedHeight;

    const scaleX = viewportWidth / baseWidth;
    const scaleY = viewportHeight / baseHeight;

    // 使用較小的縮放值以確保完全可見，限制最大 0.9 避免邊緣被切掉
    const newScale = Math.min(scaleX, scaleY, 0.9);

    setScale(newScale);
    setContainerWidth(baseWidth * newScale);
    setContainerHeight(baseHeight * newScale);
  }, [baseWidth, baseHeight, padding]);

  useEffect(() => {
    calculateScale();

    const handleResize = () => {
      calculateScale();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [calculateScale]);

  return { scale, containerWidth, containerHeight };
}
