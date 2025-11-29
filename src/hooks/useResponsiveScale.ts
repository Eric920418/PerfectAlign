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
    const viewportHeight = window.innerHeight - padding * 2;

    const scaleX = viewportWidth / baseWidth;
    const scaleY = viewportHeight / baseHeight;

    // 使用較小的縮放值以確保完全可見
    const newScale = Math.min(scaleX, scaleY, 1); // 最大不超過 1

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
