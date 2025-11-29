import { create } from 'zustand';
import type {
  GameStoreState,
  GameState,
  LevelConfig,
  PieceState,
  Transform,
  ActionLog,
  SnapSize,
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
  snapEnabled: true,  // 預設開啟 snap
  snapSize: 5,        // 預設 5px 為一格

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
    });
  },

  // 選取碎片
  selectPiece: (id: string | null) => {
    const { gameState } = get();

    // 如果正在微調模式，選取其他碎片時退出微調
    if (gameState === 'FINE_TUNE' && id !== get().selectedPieceId) {
      set({ gameState: 'PLAYING', selectedPieceId: id });
    } else {
      set({ selectedPieceId: id });
    }
  },

  // 更新碎片變換
  updatePieceTransform: (id: string, transform: Partial<Transform>) => {
    set((state) => ({
      pieces: state.pieces.map((piece) => {
        if (piece.id !== id) return piece;

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

        return { ...piece, current: newCurrent };
      }),
    }));
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
  setSnapEnabled: (enabled: boolean) => {
    set({ snapEnabled: enabled });
  },

  setSnapSize: (size: SnapSize) => {
    set({ snapSize: size });
  },

  // 將數值對齊到格線
  snapToGrid: (value: number): number => {
    const { snapEnabled, snapSize } = get();
    if (!snapEnabled) return value;
    return Math.round(value / snapSize) * snapSize;
  },
}));
