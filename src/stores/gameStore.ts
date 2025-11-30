import { create } from 'zustand';
import type {
  GameStoreState,
  GameState,
  LevelConfig,
  PieceState,
  Transform,
  ActionLog,
  SnapSize,
  FeedbackType,
} from '../types';
import { calculateError, getWinRating, normalizeAngle, clampScale } from '../utils';

export const useGameStore = create<GameStoreState>((set, get) => ({
  // 初始狀態
  gameState: 'IDLE',
  levelConfig: null,
  pieces: [],
  selectedPieceId: null,
  actionLogs: [],
  gameStartTime: 0,
  isPreviewActive: false,
  winRating: null,
  totalError: 0,
  snapSize: 1,        // 預設 1px（實際 5px）
  activeFeedback: null,
  feedbackPieceId: null,
  feedbackTargetPos: null,

  // 載入關卡
  loadLevel: (config: LevelConfig) => {
    const pieces: PieceState[] = config.pieces.map((p) => ({
      id: p.id,
      texture: p.texture,
      current: { ...p.start_transform },
      target: { ...p.target_transform },
    }));

    set({
      levelConfig: config,
      pieces,
      gameState: 'PLAYING',
      selectedPieceId: null,
      actionLogs: [],
      gameStartTime: Date.now(),
      isPreviewActive: false,
      winRating: null,
      totalError: 0,
      activeFeedback: null,
      feedbackPieceId: null,
      feedbackTargetPos: null,
    });
  },

  // 選取碎片
  selectPiece: (id: string | null) => {
    set({ selectedPieceId: id });
  },

  // 更新碎片變換
  updatePieceTransform: (id: string, transform: Partial<Transform>) => {
    const { pieces, activeFeedback } = get();
    const piece = pieces.find(p => p.id === id);
    if (!piece) return;

    const ROTATION_THRESHOLD = 0.5; // 角度容差
    const SCALE_THRESHOLD = 0.02;   // 縮放容差
    const POSITION_THRESHOLD = 2;   // 位置容差（像素）

    // 更新前的狀態
    const wasRotationCorrect = Math.abs(piece.current.rotation - piece.target.rotation) < ROTATION_THRESHOLD;
    const wasScaleCorrect =
      Math.abs(piece.current.scaleX - piece.target.scaleX) < SCALE_THRESHOLD &&
      Math.abs(piece.current.scaleY - piece.target.scaleY) < SCALE_THRESHOLD;
    const wasXCorrect = Math.abs(piece.current.x - piece.target.x) < POSITION_THRESHOLD;
    const wasYCorrect = Math.abs(piece.current.y - piece.target.y) < POSITION_THRESHOLD;

    // 計算新值
    const newCurrent = { ...piece.current };
    if (transform.x !== undefined) newCurrent.x = transform.x;
    if (transform.y !== undefined) newCurrent.y = transform.y;
    if (transform.rotation !== undefined) {
      newCurrent.rotation = normalizeAngle(transform.rotation);
    }
    if (transform.scaleX !== undefined) {
      newCurrent.scaleX = clampScale(transform.scaleX);
    }
    if (transform.scaleY !== undefined) {
      newCurrent.scaleY = clampScale(transform.scaleY);
    }

    // 更新後的狀態
    const isRotationCorrect = Math.abs(newCurrent.rotation - piece.target.rotation) < ROTATION_THRESHOLD;
    const isScaleCorrect =
      Math.abs(newCurrent.scaleX - piece.target.scaleX) < SCALE_THRESHOLD &&
      Math.abs(newCurrent.scaleY - piece.target.scaleY) < SCALE_THRESHOLD;
    const isXCorrect = Math.abs(newCurrent.x - piece.target.x) < POSITION_THRESHOLD;
    const isYCorrect = Math.abs(newCurrent.y - piece.target.y) < POSITION_THRESHOLD;

    // 檢測是否剛達到正確值（優先級：位置 > 旋轉 > 縮放）
    let feedback: FeedbackType = null;
    let targetPos = { x: piece.target.x, y: piece.target.y };

    // 如果已有反饋在播放，不覆蓋
    if (!activeFeedback) {
      if (!wasXCorrect && isXCorrect) {
        feedback = 'positionX';
      } else if (!wasYCorrect && isYCorrect) {
        feedback = 'positionY';
      } else if (!wasRotationCorrect && isRotationCorrect) {
        feedback = 'rotation';
      } else if (!wasScaleCorrect && isScaleCorrect) {
        feedback = 'scale';
      }
    }

    set((state) => ({
      pieces: state.pieces.map((p) =>
        p.id === id ? { ...p, current: newCurrent } : p
      ),
      activeFeedback: feedback || state.activeFeedback,
      feedbackPieceId: feedback ? id : state.feedbackPieceId,
      feedbackTargetPos: feedback ? targetPos : state.feedbackTargetPos,
    }));

    // 自動清除回饋
    if (feedback) {
      setTimeout(() => {
        set({ activeFeedback: null, feedbackPieceId: null, feedbackTargetPos: null });
      }, 1500);
    }
  },

  // 設定遊戲狀態
  setGameState: (state: GameState) => {
    set({ gameState: state });
  },

  // 設定預覽狀態
  setPreviewActive: (active: boolean) => {
    set({ isPreviewActive: active });
  },

  // 添加操作記錄
  addActionLog: (log: Omit<ActionLog, 'timestamp'>) => {
    const { gameStartTime } = get();
    const timestamp = Date.now() - gameStartTime;

    set((state) => ({
      actionLogs: [...state.actionLogs, { ...log, timestamp }],
    }));
  },

  // 檢查勝利條件
  checkWinCondition: () => {
    const { pieces, levelConfig } = get();
    if (!levelConfig) return;

    const totalError = calculateError(pieces);
    const rating = getWinRating(totalError);

    set({ totalError });

    if (rating) {
      set({
        winRating: rating,
        gameState: 'WIN',
      });
    }
  },

  // 重置關卡
  resetLevel: () => {
    const { levelConfig } = get();
    if (levelConfig) {
      get().loadLevel(levelConfig);
    }
  },

  // Snap 設定
  setSnapSize: (size: SnapSize) => {
    set({ snapSize: size });
  },

  // 將數值對齊到格線
  // 玩家選擇 1px → 實際 5px, 5px → 10px, 10px → 20px
  snapToGrid: (value: number): number => {
    const { snapSize } = get();
    const actualSnap = snapSize === 1 ? 5 : snapSize === 5 ? 10 : 20;
    return Math.round(value / actualSnap) * actualSnap;
  },
}));
