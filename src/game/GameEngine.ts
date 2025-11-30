import * as PIXI from 'pixi.js';
import type { LevelConfig, PieceState } from '../types';
import { degToRad, radToDeg, clampScale, normalizeAngle } from '../utils';

export interface GameEngineOptions {
  container: HTMLElement;
  levelConfig: LevelConfig;
  onPieceSelect: (id: string | null) => void;
  onPieceTransformEnd: (id: string, x: number, y: number) => void;
  onDoubleTap: (pieceId: string) => void;
  onRotate: (pieceId: string, rotation: number) => void;
  onScale: (pieceId: string, scaleX: number, scaleY: number) => void;
  getSnapState: () => { enabled: boolean; size: number };
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

  // 用於 Sticky Snap
  private lastSnappedX: number = 0;
  private lastSnappedY: number = 0;

  // 觸控追蹤（用於判斷單指/多指）
  private activeTouches: Map<number, { x: number; y: number }> = new Map();

  // 選取框顯示狀態
  private hideSelectionBox = false;

  // 回調函數
  private onPieceSelect: (id: string | null) => void;
  private onPieceTransformEnd: (id: string, x: number, y: number) => void;
  private onDoubleTap: (pieceId: string) => void;
  private onRotate: (pieceId: string, rotation: number) => void;
  private onScale: (pieceId: string, scaleX: number, scaleY: number) => void;
  private getSnapState: () => { enabled: boolean; size: number };

  constructor(options: GameEngineOptions & { getSnapState: () => { enabled: boolean; size: number } }) {
    this.container = options.container;
    this.levelConfig = options.levelConfig;
    this.onPieceSelect = options.onPieceSelect;
    this.onPieceTransformEnd = options.onPieceTransformEnd;
    this.onDoubleTap = options.onDoubleTap;
    this.onRotate = options.onRotate;
    this.onScale = options.onScale;
    this.getSnapState = options.getSnapState;

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

  // 觸控追蹤（用於判斷單指/多指，避免多指時誤觸拖曳）
  private setupTouchGestures() {
    const canvas = this.app.view as HTMLCanvasElement;

    canvas.addEventListener('touchstart', (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        this.activeTouches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
      }
    }, { passive: true });

    canvas.addEventListener('touchend', (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        this.activeTouches.delete(e.changedTouches[i].identifier);
      }
    });

    canvas.addEventListener('touchcancel', () => {
      this.activeTouches.clear();
    });
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
      const width = piece.shape?.width ?? 80;
      const height = piece.shape?.height ?? 80;

      graphics.beginFill(this.getColorForPiece(piece.id));
      graphics.drawRect(-width / 2, -height / 2, width, height);
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
      
      // 初始化 lastSnappedPosition
      this.lastSnappedX = sprite.x;
      this.lastSnappedY = sprite.y;
      this.targetPosition = { x: sprite.x, y: sprite.y }; // 初始目標位置為當前方塊位置

      this.dragOffset = {
        x: sprite.x - globalPos.x,
        y: sprite.y - globalPos.y,
      };
    });

    sprite.on('globalpointermove', (e: PIXI.FederatedPointerEvent) => {
      if (!this.isDragging || this.draggingPieceId !== pieceId) return;
      if (this.activeTouches.size > 1) return; // 雙指手勢時不拖曳

      const globalPos = e.global;
      const { size: snapSize } = this.getSnapState(); // snapEnabled is always true now

      // 計算原始的目標位置 (未吸附)
      const newRawX = globalPos.x + this.dragOffset.x;
      const newRawY = globalPos.y + this.dragOffset.y;

      let nextSnappedX = this.lastSnappedX;
      let nextSnappedY = this.lastSnappedY;

      if (snapSize > 0) {
        // 判斷是否超過了吸附閾值
        const threshold = snapSize / 2;

        // X 軸
        if (Math.abs(newRawX - this.lastSnappedX) >= threshold) {
          // 已經移動超過半個吸附距離，計算下一個吸附點
          nextSnappedX = Math.round(newRawX / snapSize) * snapSize;
        }
        
        // Y 軸
        if (Math.abs(newRawY - this.lastSnappedY) >= threshold) {
          nextSnappedY = Math.round(newRawY / snapSize) * snapSize;
        }

        // 如果計算出的下一個吸附點與當前不同，則更新
        if (nextSnappedX !== this.lastSnappedX || nextSnappedY !== this.lastSnappedY) {
          this.lastSnappedX = nextSnappedX;
          this.lastSnappedY = nextSnappedY;
        }
      } else { // snapSize is 0 or negative, which shouldn't happen, but just in case
        this.lastSnappedX = newRawX;
        this.lastSnappedY = newRawY;
      }
      
      this.targetPosition = { x: this.lastSnappedX, y: this.lastSnappedY };
    });

    sprite.on('pointerup', () => {
      if (this.isDragging && this.draggingPieceId === pieceId) {
        this.isDragging = false;
        this.draggingPieceId = null;
        
        // 確保最後位置也對齊（使用最新的 lastSnappedX/Y）
        // 由於已經在 move 時處理了吸附，這裡只需要更新 sprite 位置
        sprite.x = this.lastSnappedX;
        sprite.y = this.lastSnappedY;
        
        this.updateSelectionBox(pieceId);
        this.onPieceTransformEnd(pieceId, sprite.x, sprite.y);
      }
    });

    sprite.on('pointerupoutside', () => {
      if (this.isDragging && this.draggingPieceId === pieceId) {
        this.isDragging = false;
        this.draggingPieceId = null;
        
        sprite.x = this.lastSnappedX;
        sprite.y = this.lastSnappedY;

        this.updateSelectionBox(pieceId);
        this.onPieceTransformEnd(pieceId, sprite.x, sprite.y);
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

  private drawSelectionBox(graphics: PIXI.Graphics, sprite: PIXI.Sprite) {
    graphics.clear();

    // 如果隱藏選取框（對答案時），不繪製
    if (this.hideSelectionBox) {
      return;
    }

    // 同步 graphics 的變換與 sprite
    graphics.x = sprite.x;
    graphics.y = sprite.y;
    graphics.rotation = sprite.rotation;
    graphics.scale.set(sprite.scale.x, sprite.scale.y);

    // 繪製選取框（使用本地座標）
    const bounds = sprite.getLocalBounds();
    const padding = 4;

    graphics.lineStyle(2, 0x00ff88, 0.8);
    graphics.drawRect(
      bounds.x - padding,
      bounds.y - padding,
      bounds.width + padding * 2,
      bounds.height + padding * 2
    );

    // 繪製角落小方塊
    const cornerSize = 6;
    graphics.beginFill(0x00ff88);
    // 左上
    graphics.drawRect(bounds.x - padding - cornerSize / 2, bounds.y - padding - cornerSize / 2, cornerSize, cornerSize);
    // 右上
    graphics.drawRect(bounds.x + bounds.width + padding - cornerSize / 2, bounds.y - padding - cornerSize / 2, cornerSize, cornerSize);
    // 左下
    graphics.drawRect(bounds.x - padding - cornerSize / 2, bounds.y + bounds.height + padding - cornerSize / 2, cornerSize, cornerSize);
    // 右下
    graphics.drawRect(bounds.x + bounds.width + padding - cornerSize / 2, bounds.y + bounds.height + padding - cornerSize / 2, cornerSize, cornerSize);
    graphics.endFill();
  }

  // 設定是否隱藏選取框（對答案時使用）
  setHideSelectionBox(hide: boolean) {
    this.hideSelectionBox = hide;
    // 更新當前選取框的顯示狀態
    if (this.selectedPieceId) {
      const sprite = this.pieceSprites.get(this.selectedPieceId);
      const graphics = this.pieceGraphics.get(this.selectedPieceId);
      if (sprite && graphics) {
        this.drawSelectionBox(graphics, sprite);
      }
    }
  }

  private startRenderLoop() {
    const animate = () => {
      // 只移動正在拖曳的那個方塊
      if (this.isDragging && this.draggingPieceId) {
        const sprite = this.pieceSprites.get(this.draggingPieceId);
        if (sprite) {
          // 直接移動到計算好的位置 (無論是否 Snap，目標位置已經在 pointermove 中計算好)
          // 移除 lerp 以確保 "無 Snap" 時是真正的原始跟隨，而 "有 Snap" 時是明確的跳動
          sprite.x = this.targetPosition.x;
          sprite.y = this.targetPosition.y;

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
