// ===== 基礎變換型別 =====
export interface Transform {
  x: number;        // 像素，相對畫布左上角
  y: number;        // 像素，相對畫布左上角
  rotation: number; // 角度，順時針為正，範圍 -180 ~ 180
  scaleX: number;   // 寬度倍率，1.0 為原始大小
  scaleY: number;   // 高度倍率，1.0 為原始大小
}

// ===== 碎片狀態 =====
export interface PieceState {
  id: string;
  texture: string;
  shape?: PieceShape;  // 碎片形狀，預設 80x80
  current: Transform;
  target: Transform;
}

// ===== 碎片形狀設定 =====
export interface PieceShape {
  width: number;   // 碎片寬度（像素）
  height: number;  // 碎片高度（像素）
}

// ===== 碎片設定 (來自 JSON) =====
export interface PieceConfig {
  id: string;
  texture: string;
  shape?: PieceShape;  // 可選，預設 80x80
  start_transform: Transform;
  target_transform: Transform;
}

// ===== 關卡設定 =====
export interface LevelConfig {
  level_id: number;
  level_type: 'image_match' | 'text_hint';
  title?: string;          // 關卡標題
  uniform_scale_only?: boolean;  // 是否只允許等比例縮放
  allow_preview: boolean;
  preview_image: string;
  text_hint: string;
  canvas: {
    width: number;
    height: number;
    background: string;
  };
  win_threshold: number;
  pieces: PieceConfig[];
}

// ===== 遊戲狀態機 =====
export type GameState = 'IDLE' | 'PLAYING' | 'FINE_TUNE' | 'WIN' | 'COMPLETE';

// ===== 微調區域 =====
export type Zone = 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT' | 'CENTER';

// ===== 操作記錄 =====
export type ActionType = 'drag' | 'fine_move' | 'rotate' | 'scale';

export interface ActionPayload {
  // drag
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;

  // fine_move
  direction?: 'up' | 'down' | 'left' | 'right';

  // rotate
  fromRotation?: number;
  toRotation?: number;

  // scale
  fromScaleX?: number;
  fromScaleY?: number;
  toScaleX?: number;
  toScaleY?: number;
}

export interface ActionLog {
  timestamp: number;  // 毫秒，相對遊戲開始時間
  pieceId: string;
  type: ActionType;
  payload: ActionPayload;
}

// ===== 勝利評級 =====
export type WinRating = 'Perfect' | 'Great' | 'Good' | null;

// ===== Snap 設定 =====
export type SnapSize = 1 | 5 | 10;

// ===== 遊戲商店狀態 =====
export interface GameStoreState {
  // 遊戲狀態
  gameState: GameState;
  levelConfig: LevelConfig | null;
  pieces: PieceState[];
  selectedPieceId: string | null;

  // 操作記錄
  actionLogs: ActionLog[];
  gameStartTime: number;

  // 預覽狀態
  isPreviewActive: boolean;

  // 勝利相關
  winRating: WinRating;
  totalError: number;

  // Snap 設定
  snapEnabled: boolean;
  snapSize: SnapSize;

  // 動作方法
  loadLevel: (config: LevelConfig) => void;
  selectPiece: (id: string | null) => void;
  updatePieceTransform: (id: string, transform: Partial<Transform>) => void;
  setGameState: (state: GameState) => void;
  setPreviewActive: (active: boolean) => void;
  addActionLog: (log: Omit<ActionLog, 'timestamp'>) => void;
  checkWinCondition: () => void;
  resetLevel: () => void;
  setSnapEnabled: (enabled: boolean) => void;
  setSnapSize: (size: SnapSize) => void;
  snapToGrid: (value: number) => number;
}
