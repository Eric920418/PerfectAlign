import { useState, useCallback, useRef } from 'react';

interface PinchZoomState {
  scale: number;
  translateX: number;
  translateY: number;
}

interface UsePinchZoomOptions {
  minScale?: number;
  maxScale?: number;
}

interface UsePinchZoomResult extends PinchZoomState {
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
  resetView: () => void;
  isZoomed: boolean;
}

export function usePinchZoom(options: UsePinchZoomOptions = {}): UsePinchZoomResult {
  const { minScale = 1, maxScale = 4 } = options;

  const [state, setState] = useState<PinchZoomState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });

  // 用于追踪手势状态
  const gestureRef = useRef({
    isPinching: false,
    isPanning: false,
    startDistance: 0,
    startScale: 1,
    startX: 0,
    startY: 0,
    startTranslateX: 0,
    startTranslateY: 0,
    lastTouchCount: 0,
  });

  // 计算两个触摸点之间的距离
  const getDistance = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // 计算两个触摸点的中心
  const getCenter = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;
    const gesture = gestureRef.current;

    if (touches.length === 2) {
      // 双指：开始缩放
      gesture.isPinching = true;
      gesture.isPanning = false;
      gesture.startDistance = getDistance(touches[0], touches[1]);
      gesture.startScale = state.scale;

      const center = getCenter(touches[0], touches[1]);
      gesture.startX = center.x;
      gesture.startY = center.y;
      gesture.startTranslateX = state.translateX;
      gesture.startTranslateY = state.translateY;
    } else if (touches.length === 1 && state.scale > 1) {
      // 单指且已放大：开始平移
      gesture.isPanning = true;
      gesture.isPinching = false;
      gesture.startX = touches[0].clientX;
      gesture.startY = touches[0].clientY;
      gesture.startTranslateX = state.translateX;
      gesture.startTranslateY = state.translateY;
    }

    gesture.lastTouchCount = touches.length;
  }, [state.scale, state.translateX, state.translateY, getDistance, getCenter]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;
    const gesture = gestureRef.current;

    if (gesture.isPinching && touches.length === 2) {
      // 双指缩放 + 平移
      const currentDistance = getDistance(touches[0], touches[1]);
      const scaleChange = currentDistance / gesture.startDistance;
      let newScale = gesture.startScale * scaleChange;

      // 限制缩放范围
      newScale = Math.max(minScale, Math.min(maxScale, newScale));

      // 计算新的中心点偏移（跟随手指）
      const center = getCenter(touches[0], touches[1]);
      const dx = center.x - gesture.startX;
      const dy = center.y - gesture.startY;

      setState({
        scale: newScale,
        translateX: gesture.startTranslateX + dx,
        translateY: gesture.startTranslateY + dy,
      });
    } else if (gesture.isPanning && touches.length === 1 && state.scale > 1) {
      // 单指平移（仅在放大状态）
      const dx = touches[0].clientX - gesture.startX;
      const dy = touches[0].clientY - gesture.startY;

      setState(prev => ({
        ...prev,
        translateX: gesture.startTranslateX + dx,
        translateY: gesture.startTranslateY + dy,
      }));
    }
  }, [state.scale, minScale, maxScale, getDistance, getCenter]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;
    const gesture = gestureRef.current;

    if (touches.length === 0) {
      // 所有手指离开
      gesture.isPinching = false;
      gesture.isPanning = false;

      // 如果缩放接近 1，自动重置
      if (state.scale < 1.1) {
        setState({ scale: 1, translateX: 0, translateY: 0 });
      }
    } else if (touches.length === 1 && gesture.isPinching) {
      // 从双指变成单指，切换到平移模式
      gesture.isPinching = false;
      gesture.isPanning = state.scale > 1;
      gesture.startX = touches[0].clientX;
      gesture.startY = touches[0].clientY;
      gesture.startTranslateX = state.translateX;
      gesture.startTranslateY = state.translateY;
    }

    gesture.lastTouchCount = touches.length;
  }, [state.scale, state.translateX, state.translateY]);

  const resetView = useCallback(() => {
    setState({ scale: 1, translateX: 0, translateY: 0 });
  }, []);

  return {
    ...state,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetView,
    isZoomed: state.scale > 1.05,
  };
}
