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

  // 用於追蹤手勢狀態
  const gestureRef = useRef({
    isGesturing: false,
    startDistance: 0,
    startScale: 1,
    startCenterX: 0,
    startCenterY: 0,
    startTranslateX: 0,
    startTranslateY: 0,
  });

  // 計算兩個觸摸點之間的距離
  const getDistance = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // 計算兩個觸摸點的中心
  const getCenter = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;

    // 只處理雙指手勢
    if (touches.length === 2) {
      const gesture = gestureRef.current;
      gesture.isGesturing = true;
      gesture.startDistance = getDistance(touches[0], touches[1]);
      gesture.startScale = state.scale;

      const center = getCenter(touches[0], touches[1]);
      gesture.startCenterX = center.x;
      gesture.startCenterY = center.y;
      gesture.startTranslateX = state.translateX;
      gesture.startTranslateY = state.translateY;
    }
  }, [state.scale, state.translateX, state.translateY, getDistance, getCenter]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;
    const gesture = gestureRef.current;

    // 只處理雙指手勢
    if (gesture.isGesturing && touches.length === 2) {
      // 計算縮放
      const currentDistance = getDistance(touches[0], touches[1]);
      const scaleChange = currentDistance / gesture.startDistance;
      let newScale = gesture.startScale * scaleChange;

      // 限制縮放範圍
      newScale = Math.max(minScale, Math.min(maxScale, newScale));

      // 計算平移（雙指中心點移動）
      const center = getCenter(touches[0], touches[1]);
      const dx = center.x - gesture.startCenterX;
      const dy = center.y - gesture.startCenterY;

      setState({
        scale: newScale,
        translateX: gesture.startTranslateX + dx,
        translateY: gesture.startTranslateY + dy,
      });
    }
  }, [minScale, maxScale, getDistance, getCenter]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;
    const gesture = gestureRef.current;

    // 雙指結束
    if (touches.length < 2) {
      gesture.isGesturing = false;

      // 如果縮放接近 1，自動重置
      if (state.scale < 1.1) {
        setState({ scale: 1, translateX: 0, translateY: 0 });
      }
    }
  }, [state.scale]);

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
