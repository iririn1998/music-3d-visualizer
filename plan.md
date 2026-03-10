# Music 3D Visualizer 開発計画 (Task Breakdown) - Revised

## Phase 1: プロジェクト基盤と共通インターフェースの構築
- [ ] **1.1 プロジェクトの初期化**
  - Vite + React (TypeScript) のセットアップ。
  - 必要なライブラリのインストール (`three`, `@react-three/fiber`, `@react-three/drei`, `zustand`, `tailwindcss`, `lucide-react`, `@react-three/postprocessing` 等)。
  - Tailwind CSS の設定。
- [ ] **1.2 共通オーディオ・インターフェースの定義**
  - `AudioData` 型の定義: `{ bass: 0.0~1.0, mid: 0.0~1.0, treble: 0.0~1.0, energy: 0.0~1.0, rms: 0.0~1.0 }`。
  - `useAudioStore`: 上記データの正規化済み数値、再生状態、モード、グローバルな感度設定を管理。
  - 数値遷移の平滑化ロジック (`THREE.MathUtils.damp()` 等) の共通化。
- [ ] **1.3 オーディオ解析エンジン (Local 版) の作成**
  - Web Audio API (`AnalyserNode`) を用いた `AudioAnalyzer` クラスの実装。
  - 周波数データを定義した `AudioData` インターフェースへ変換・正規化するロジック。
  - ローカルファイル（MP3/WAV等）の読み込み・再生プロトタイプ。

## Phase 2: 3D キャンバスとグローバル・システム
- [ ] **2.1 VisualizerCanvas の基本構成**
  - R3F による基本シーン（Scene, Camera, Lights）の配置。
- [ ] **2.2 動的テーマ・カラー管理システム (`useTheme`)**
  - 楽曲のエネルギー量や低音の強さに応じ、ネオンカラーパレット間で `lerp` 遷移させるロジック。
  - ポストプロセス（Bloom）の強度を `rms` に連動させるグローバル制御。
- [ ] **2.3 品質自動調整 (LOD) とヒステリシス制御**
  - `useQualityManager`: FPS を監視し、設定を動的に変更。
  - **仕様遵守:** 降格は即時、昇格は長い待機時間を設ける（または手動のみ）ことでチラつきを防止。

## Phase 3: ビジュアライザー・モードの実装 (Neon-Minimalist)
- [ ] **3.1 モード 1: "The Pulsing Core" (球体)**
  - `IcosahedronGeometry` ＋ カスタムシェーダー（Noise関数）。
  - 低音での膨張、高音でのスパイク（突起）生成。
- [ ] **3.2 モード 2: "Digital Horizon" (グリッド)**
  - `InstancedMesh` による床面。
  - 中音域に連動した波打ちと、エネルギー量に連動した光の波（奥から手前への移動）。
- [ ] **3.3 モード 3: "Stardust Vortex" (粒子)**
  - GPU Vertex Shader によるパーティクルシステム。
  - 音量に連動した回転速度・拡散範囲、キック（Peak）時の弾け演出。

## Phase 4: UI/UX とアクセシビリティ
- [ ] **4.1 フローティング・コントロールパネル**
  - グラスモーフィズム UI（Tailwind CSS）。
  - モード切替、カラープリセット選択、感度/Gain 調整。
- [ ] **4.2 アクセシビリティ & セーフティ**
  - カメラ揺れ (Shake) のオン/オフおよび強度調整（前庭障害への配慮）。
  - `prefers-reduced-motion` メディアクエリ対応。
- [ ] **4.3 エラーフィードバックとフォールバック**
  - 認証失敗や非対応ファイル時の明確な通知と、ローカルモードへの誘導 UI。

## Phase 5: Spotify API 統合 (Audio Syncer の構築)
- [ ] **5.1 認証フロー (OAuth 2.0 PKCE)**
  - クライアントサイド完結の認証とトークン管理（メモリ保持優先）。
- [ ] **5.2 Spotify Web Playback SDK の統合**
  - プレイヤー初期化と Premium アカウントチェック。
- [ ] **5.3 精密 Audio Syncer (同期ロジック) の開発**
  - `Audio Analysis API` からのセグメント/ビートデータ取得。
  - `player.getCurrentState()` のポジションと `performance.now()` を用いた高精度な補間（Interpolation）の実装。
  - 共通の `AudioData` インターフェースへの流し込み。

## Phase 6: 最適化とデプロイ
- [ ] **6.1 パフォーマンス・チューニング**
  - シェーダー最適化、メモリリークチェック、アタック/リリース時定数の微調整。
- [ ] **6.2 デプロイメント**
  - Vercel/Netlify 等へのホスティングと Spotify Dashboard の環境設定。
