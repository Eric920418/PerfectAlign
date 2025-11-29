import * as PIXI from 'pixi.js';
import type { LevelConfig, PieceState } from '../types';
import { lerp, degToRad, radToDeg, clampScale, normalizeAngle } from '../utils';

export interface GameEngineOptions {
  container: HTMLElement;
  levelConfig: LevelConfig;
  onPieceSelect: (id: string | null) => void;
  onPieceTransformEnd: (id: string, x: number, y: number) => void;
  onDoubleTap: (pieceId: string) => void;
  onRotate: (pieceId: string, rotation: number) => void;
  onScale: (pieceId: string, scaleX: number, scaleY: number) => void;
  snapToGrid: (value: number) => number;
  getSnapEnabled: () => boolean;
}

export class GameEngine {
  private app: PIXI.Application;
  private container: HTMLElement;
  private levelConfig: LevelConfig;
  private pieceSprites: Map<string, PIXI.Sprite> = new Map();
  private pieceGraphics: Map<string, PIXI.Graphics> = new Map();
  private selectedPieceId: string | null = null;
  private isDragging = false;
  private draggingPieceId: string | null = null; // 正在拖曳的方塊 ID
  private dragOffset = { x: 0, y: 0 };
  private targetPosition = { x: 0, y: 0 };
  private lastTapTime = 0;
  private animationFrameId: number | null = null;

  // 雙指手勢狀態
  private pinchStartDistance = 0;
  private pinchStartRotation = 0;
  private pinchStartScale = 1;
  private pinchStartAngle = 0;
  private activeTouches: Map<number, { x: number; y: number }> = new Map();

  // 回調函數
  private onPieceSelect: (id: string | null) => void;
  private onPieceTransformEnd: (id: string, x: number, y: number) => void;
  private onDoubleTap: (pieceId: string) => void;
  private onRotate: (pieceId: string, rotation: number) => void;
  private onScale: (pieceId: string, scaleX: number, scaleY: number) => void;
  private snapToGrid: (value: number) => number;
  private getSnapEnabled: () => boolean;

  constructor(options: GameEngineOptions) {
    this.container = options.container;
    this.levelConfig = options.levelConfig;
    this.onPieceSelect = options.onPieceSelect;
    this.onPieceTransformEnd = options.onPieceTransformEnd;
    this.onDoubleTap = options.onDoubleTap;
    this.onRotate = options.onRotate;
    this.onScale = options.onScale;
    this.snapToGrid = options.snapToGrid;
    this.getSnapEnabled = options.getSnapEnabled;

    // 建立 Pixi 應用
    this.app = new PIXI.Application({
      width: options.levelConfig.canvas.width,
      height: options.levelConfig.canvas.height,
      backgroundColor: options.levelConfig.canvas.background,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.container.appendChild(this.app.view as HTMLCanvasElement);
    this.setupInteraction();
    this.setupWheelHandler();
    this.setupTouchGestures();
  }

  private setupInteraction() {
    // 點擊空白區域取消選取
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = new PIXI.Rectangle(
      0,
      0,
      this.levelConfig.canvas.width,
      this.levelConfig.canvas.height
    );

    this.app.stage.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
      if (e.target === this.app.stage) {
        this.onPieceSelect(null);
        this.selectedPieceId = null;
        this.updateSelectionVisuals();
      }
    });
  }

  // PC 滾輪操作
  private setupWheelHandler() {
    const canvas = this.app.view as HTMLCanvasElement;

    canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();

      if (!this.selectedPieceId) return;

      const sprite = this.pieceSprites.get(this.selectedPieceId);
      if (!sprite) return;

      const delta = e.deltaY > 0 ? -1 : 1;

      if (e.shiftKey) {
        // Shift + 滾輪：旋轉 ±5°
        const currentRotation = radToDeg(sprite.rotation);
        const newRotation = normalizeAngle(currentRotation + delta * 5);
        sprite.rotation = degToRad(newRotation);
        this.onRotate(this.selectedPieceId, newRotation);
        this.updateSelectionBox(this.selectedPieceId);
      } else if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd + 滾輪：等比例縮放 ±0.05
        const newScaleX = clampScale(sprite.scale.x + delta * 0.05);
        const newScaleY = clampScale(sprite.scale.y + delta * 0.05);
        sprite.scale.set(newScaleX, newScaleY);
        this.onScale(this.selectedPieceId, newScaleX, newScaleY);
        this.updateSelectionBox(this.selectedPieceId);
      }
    }, { passive: false });
  }

  // 觸控雙指手勢
  private setupTouchGestures() {
    const canvas = this.app.view as HTMLCanvasElement;

    canvas.addEventListener('touchstart', (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        this.activeTouches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
      }

      if (this.activeTouches.size === 2 && this.selectedPieceId) {
        e.preventDefault();
        this.startPinchGesture();
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        this.activeTouches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
      }

      if (this.activeTouches.size === 2 && this.selectedPieceId) {
        e.preventDefault();
        this.handlePinchGesture();
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        this.activeTouches.delete(e.changedTouches[i].identifier);
      }

      if (this.activeTouches.size < 2) {
        this.endPinchGesture();
      }
    });

    canvas.addEventListener('touchcancel', () => {
      this.activeTouches.clear();
      this.endPinchGesture();
    });
  }

  private getTouchPoints(): { p1: { x: number; y: number }; p2: { x: number; y: number } } | null {
    const touches = Array.from(this.activeTouches.values());
    if (touches.length < 2) return null;
    return { p1: touches[0], p2: touches[1] };
  }

  private getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  }

  private getAngle(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  private startPinchGesture() {
    const points = this.getTouchPoints();
    if (!points || !this.selectedPieceId) return;

    const sprite = this.pieceSprites.get(this.selectedPieceId);
    if (!sprite) return;

    this.pinchStartDistance = this.getDistance(points.p1, points.p2);
    this.pinchStartAngle = this.getAngle(points.p1, points.p2);
    this.pinchStartScale = sprite.scale.x;
    this.pinchStartRotation = sprite.rotation;
    this.isDragging = false; // 停止拖曳
  }

  private handlePinchGesture() {
    const points = this.getTouchPoints();
    if (!points || !this.selectedPieceId) return;

    const sprite = this.pieceSprites.get(this.selectedPieceId);
    if (!sprite) return;

    const currentDistance = this.getDistance(points.p1, points.p2);
    const currentAngle = this.getAngle(points.p1, points.p2);

    // 等比例縮放
    const scaleRatio = currentDistance / this.pinchStartDistance;
    const newScale = clampScale(this.pinchStartScale * scaleRatio);
    sprite.scale.set(newScale, newScale);

    // 旋轉
    const angleDelta = currentAngle - this.pinchStartAngle;
    const newRotation = this.pinchStartRotation + angleDelta;
    sprite.rotation = newRotation;

    this.updateSelectionBox(this.selectedPieceId);
  }

  private endPinchGesture() {
    if (!this.selectedPieceId) return;

    const sprite = this.pieceSprites.get(this.selectedPieceId);
    if (!sprite) return;

    // 通知外部旋轉和縮放變化
    const finalRotation = normalizeAngle(radToDeg(sprite.rotation));
    sprite.rotation = degToRad(finalRotation);

    this.onRotate(this.selectedPieceId, finalRotation);
    this.onScale(this.selectedPieceId, sprite.scale.x, sprite.scale.y);
  }

  private updateSelectionBox(pieceId: string) {
    const sprite = this.pieceSprites.get(pieceId);
    const graphics = this.pieceGraphics.get(pieceId);
    if (sprite && graphics && graphics.visible) {
      this.drawSelectionBox(graphics, sprite);
    }
  }

  // 載入碎片（使用圖形替代圖片，便於測試）
  async loadPieces(pieces: PieceState[]) {
    for (const piece of pieces) {
      await this.createPiece(piece);
    }
    this.startRenderLoop();
  }

  private async createPiece(piece: PieceState) {
    // 嘗試載入紋理，如果失敗則創建圖形
    let sprite: PIXI.Sprite;

    try {
      const texture = await PIXI.Assets.load(piece.texture);
      sprite = new PIXI.Sprite(texture);
    } catch {
      // 使用圖形作為占位符
      const graphics = new PIXI.Graphics();
      graphics.beginFill(this.getColorForPiece(piece.id));
      graphics.drawRoundedRect(-40, -40, 80, 80, 8);
      graphics.endFill();

      // 添加 ID 文字
      const text = new PIXI.Text(piece.id, {
        fontSize: 16,
        fill: 0xffffff,
        fontWeight: 'bold',
      });
      text.anchor.set(0.5);
      graphics.addChild(text);

      const texture = this.app.renderer.generateTexture(graphics);
      sprite = new PIXI.Sprite(texture);
      graphics.destroy();
    }

    sprite.anchor.set(0.5);
    sprite.x = piece.current.x;
    sprite.y = piece.current.y;
    sprite.rotation = degToRad(piece.current.rotation);
    sprite.scale.set(piece.current.scaleX, piece.current.scaleY);

    // 設定互動
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';

    // 儲存碎片 ID
    (sprite as PIXI.Sprite & { pieceId: string }).pieceId = piece.id;

    this.setupPieceInteraction(sprite, piece.id);

    // 建立選取框
    const selectionGraphics = new PIXI.Graphics();
    selectionGraphics.visible = false;
    this.pieceGraphics.set(piece.id, selectionGraphics);

    this.app.stage.addChild(sprite);
    this.app.stage.addChild(selectionGraphics);
    this.pieceSprites.set(piece.id, sprite);
  }

  private getColorForPiece(id: string): number {
    const colors = [0xe94560, 0x0f3460, 0x16c79a, 0xf9a825, 0x7b2cbf, 0x00bcd4];
    const index = parseInt(id.replace(/\D/g, ''), 10) || 0;
    return colors[index % colors.length];
  }

  private setupPieceInteraction(sprite: PIXI.Sprite, pieceId: string) {
    sprite.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
      e.stopPropagation();

      // 忽略多點觸控的第二個觸點
      if (this.activeTouches.size > 1) return;

      const now = Date.now();
      const isDoubleTap = now - this.lastTapTime < 300 && this.selectedPieceId === pieceId;

      if (isDoubleTap) {
        this.onDoubleTap(pieceId);
        this.lastTapTime = 0;
        return;
      }

      this.lastTapTime = now;
      this.selectedPieceId = pieceId;
      this.onPieceSelect(pieceId);
      this.updateSelectionVisuals();

      // 開始拖曳
      this.isDragging = true;
      this.draggingPieceId = pieceId; // 記錄正在拖曳的方塊
      const globalPos = e.global;
      this.targetPosition = { x: sprite.x, y: sprite.y };
      this.dragOffset = {
        x: sprite.x - globalPos.x,
        y: sprite.y - globalPos.y,
      };
    });

    sprite.on('globalpointermove', (e: PIXI.FederatedPointerEvent) => {
      if (!this.isDragging || this.draggingPieceId !== pieceId) return;
      if (this.activeTouches.size > 1) return; // 雙指手勢時不拖曳

      const globalPos = e.global;
      // 拖動過程中就 snap 到格線，產生段落感
      this.targetPosition = {
        x: this.snapToGrid(globalPos.x + this.dragOffset.x),
        y: this.snapToGrid(globalPos.y + this.dragOffset.y),
      };
    });

    sprite.on('pointerup', () => {
      if (this.isDragging && this.draggingPieceId === pieceId) {
        this.isDragging = false;
        this.draggingPieceId = null;
        // Snap 到格線
        const snappedX = this.snapToGrid(sprite.x);
        const snappedY = this.snapToGrid(sprite.y);
        sprite.x = snappedX;
        sprite.y = snappedY;
        this.updateSelectionBox(pieceId);
        this.onPieceTransformEnd(pieceId, snappedX, snappedY);
      }
    });

    sprite.on('pointerupoutside', () => {
      if (this.isDragging && this.draggingPieceId === pieceId) {
        this.isDragging = false;
        this.draggingPieceId = null;
        // Snap 到格線
        const snappedX = this.snapToGrid(sprite.x);
        const snappedY = this.snapToGrid(sprite.y);
        sprite.x = snappedX;
        sprite.y = snappedY;
        this.updateSelectionBox(pieceId);
        this.onPieceTransformEnd(pieceId, snappedX, snappedY);
      }
    });
  }

  private updateSelectionVisuals() {
    this.pieceSprites.forEach((sprite, id) => {
      const graphics = this.pieceGraphics.get(id);
      if (graphics) {
        graphics.visible = id === this.selectedPieceId;
        if (graphics.visible) {
          this.drawSelectionBox(graphics, sprite);
        }
      }
    });
  }

  private drawSelectionBox(_graphics: PIXI.Graphics, _sprite: PIXI.Sprite) {
    // 不繪製選取框，避免影響對齊判斷
    // 保留方法以維持程式結構
  }

  private startRenderLoop() {
    const animate = () => {
      // 只移動正在拖曳的那個方塊
      if (this.isDragging && this.draggingPieceId) {
        const sprite = this.pieceSprites.get(this.draggingPieceId);
        if (sprite) {
          if (this.getSnapEnabled()) {
            // Snap 開啟時：直接跳到目標位置，產生段落感
            sprite.x = this.targetPosition.x;
            sprite.y = this.targetPosition.y;
          } else {
            // Snap 關閉時：Lerp 平滑移動
            sprite.x = lerp(sprite.x, this.targetPosition.x);
            sprite.y = lerp(sprite.y, this.targetPosition.y);
          }

          // 更新選取框
          const graphics = this.pieceGraphics.get(this.draggingPieceId);
          if (graphics && graphics.visible) {
            this.drawSelectionBox(graphics, sprite);
          }
        }
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  // 更新碎片變換（供外部調用）
  updatePiece(id: string, transform: { x?: number; y?: number; rotation?: number; scaleX?: number; scaleY?: number }) {
    const sprite = this.pieceSprites.get(id);
    if (!sprite) return;

    if (transform.x !== undefined) sprite.x = transform.x;
    if (transform.y !== undefined) sprite.y = transform.y;
    if (transform.rotation !== undefined) sprite.rotation = degToRad(transform.rotation);
    if (transform.scaleX !== undefined || transform.scaleY !== undefined) {
      sprite.scale.set(
        transform.scaleX ?? sprite.scale.x,
        transform.scaleY ?? sprite.scale.y
      );
    }

    // 更新選取框
    const graphics = this.pieceGraphics.get(id);
    if (graphics && graphics.visible) {
      this.drawSelectionBox(graphics, sprite);
    }
  }

  // 設定選取狀態
  setSelectedPiece(id: string | null) {
    this.selectedPieceId = id;
    this.updateSelectionVisuals();
  }

  // 獲取畫布尺寸
  getCanvasSize() {
    return {
      width: this.levelConfig.canvas.width,
      height: this.levelConfig.canvas.height,
    };
  }

  // 銷毀引擎
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.pieceSprites.clear();
    this.pieceGraphics.clear();
    this.activeTouches.clear();
    this.app.destroy(true, { children: true, texture: true });
  }
}
