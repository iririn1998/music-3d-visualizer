# Application Overview: Music 3D Visualizer

## 概要 (Overview)
本アプリケーションは、Spotify API または ローカルの音声ファイルを利用して音楽を再生し、その楽曲のオーディオデータ（周波数やビート）に連動して、Three.jsで描画された3Dモデルが波打つように動くインタラクティブなWebアプリケーションです。

*   **Spotify連携時の制約:** Spotify Web Playback SDKは**Premiumアカウント必須**です。また、DRM制限により直接の周波数解析ができないため、Spotify Audio Analysis APIによる疑似リアルタイム解析と同期を行います。
*   **フォールバック:** Spotify連携失敗時（Premium非対応、認証切れ、ネットワーク断）は、自動的にローカルファイル再生モードへ誘導します。
*   **共通正規化インターフェース (Adapter パターン):** 音源種別（Spotify / ローカル）ごとにアダプタ層を分離し、毎フレーム `{ bass: 0.0~1.0, mid: 0.0~1.0, treble: 0.0~1.0, energy: 0.0~1.0 }` のような共通化された数値を吐き出すFacadeを実装。同一UIで同等品質のビジュアルを提供するための正規化ルールを適用します。

## 技術スタック (Tech Stack)
*   **フロントエンド:** React (TypeScript), Vite
*   **状態管理:** Zustand (高頻度の更新による再レンダリングを防ぐため) または `useFrame` 内での `ref` 直接更新
*   **3Dグラフィックス:** Three.js, React Three Fiber (`@react-three/fiber`), React Three Drei (`@react-three/drei`)
*   **シェーダー:** Custom Shader Material (GPU側での頂点計算によるパフォーマンス最適化)
*   **ポストプロセッシング:** `@react-three/postprocessing` (Bloom, Noise 効果で統一)
*   **音楽データ取得・再生:** 
    *   Spotify Web API, Web Playback SDK (要Premium)
    *   HTML5 Audio API (ローカルファイル用: MP3 / AAC / FLAC / WAV等)
*   **オーディオ解析:** Web Audio API (AnalyserNode) ※ローカルファイル専用
*   **認証方式:** OAuth 2.0 PKCE フロー (セキュアなバックエンド不要方式)
    *   *セキュリティ考慮事項:* XSS攻撃リスク低減のため、アクセストークンは可能な限りメモリ上（JavaScript変数内）に保持し、永続化の際は厳重な注意を払う。
*   **スタイリング:** Tailwind CSS (UIコンポーネント用)

## 非機能要件 (Performance & Constraints)
*   **目標パフォーマンス:** 1080p環境にて**60fps**を目標とし、最低30fpsを維持。
*   **品質自動調整 (LOD) とヒステリシス:** 実行時のFPSに応じて品質設定（Low / Medium / High）を自動降格。
    *   *ヨーヨー現象対策:* 降格は素早く行い、昇格には長い待機時間を設けるか、手動でのみ昇格させるなど、品質が頻繁に切り替わるチラつき（無限ループ）を防止する。
*   **パーティクル上限:** デバイス性能に応じ、上限値を設定（例: 最大10,000、初期値3,000等）。
*   **アクセシビリティ:**
    *   `prefers-reduced-motion` メディアクエリに対応。
    *   カメラの揺れ（Shake）機能は前庭障害に配慮し、オン/オフ設定および強度調整スライダーを実装。

## デザインコンセプト (Design Concept)
*   **テーマ:** **"Neon-Minimalist" (ネオン・ミニマリスト)**
    *   **背景:** 深い漆黒 (`#050505`) または 濃紺の宇宙的空間。
    *   **発光効果 (Bloom):** 音の強弱に合わせて3Dオブジェクトが発光し、空間に光が漏れ出すような演出。
    *   **UI:** グラスモーフィズム（半透明のぼかし背景）を採用したフローティング・コントロールパネル。モバイル・タブレット対応のレスポンシブ設計。
    *   **動的配色:** 低音の強さや楽曲のエネルギー量に基づいて、ネオンピンク、エレクトリックブルー、サイバーライムなどのカラーパレットが滑らかに遷移（`lerp`等を利用）する。
    *   **エラー状態のUX:** 認証失敗や非対応ファイル入力時に、明確なエラーメッセージと再試行導線を提示。

## ビジュアライザー・モード (Visualization Modes)
ユーザーは以下の3つのモードをリアルタイムに切り替え可能。切替時はカメラ・色・エフェクト状態を初期化します。

1.  **"The Pulsing Core" (球体モード)**
    *   中心に浮遊するワイヤーフレームまたはポイント群の球体（`IcosahedronGeometry` ＋ Noise関数）。
    *   **Bass (低音):** 球体のスケールが鼓動するように膨張。
    *   **Treble (高音):** 球体の表面が細かく波打ち、スパイク（突起）が発生。
2.  **"Digital Horizon" (グリッドモード)**
    *   無限に広がるサイバー空間の床面グリッド（`InstancedMesh`等での高速化を検討）。
    *   **Mid (中音):** グリッドの交差点が波形のように上下にうねる。
    *   **Energy:** 楽曲の盛り上がりに合わせて、グリッドの奥から手前へ光の波が走る。
3.  **"Stardust Vortex" (粒子モード)**
    *   数千のパーティクルが渦を巻く空間（GPUでのVertex Shader計算により軽量化）。
    *   **Volume:** 粒子の回転速度と拡散範囲が変化。
    *   **Peak:** ドラムのキックに合わせて粒子が一瞬外側へ弾け飛ぶ。

## オーディオ解析の連携 (Audio Mapping Logic)
各帯域の反応を安定させるため、FFT size、平滑化係数、しきい値、アタック/リリース時定数をモード間で統一的に定義します。

*   **データ構造の抽象化:** ローカル（FFTによる周波数配列）とSpotify（解析JSONデータ）の差異を吸収するオーディオ・ストアを構築。
*   **平滑化 (Smoothing):** 毎フレームの値の乱高下による視覚的疲労を防ぐため、`THREE.MathUtils.damp()` などを利用し、値の動きにイージング（遅延追従）をかける。
*   **低域 (Bass, 20-250Hz):** 衝撃、サイズ、カメラの揺れ（Shake - アクセシビリティ考慮）。
*   **中域 (Mid, 250-2000Hz):** 形状の変形（Deformation）、主要な色の変化。
*   **高域 (Treble, 2000Hz-):** 表面のテクスチャの震え、火花のような微細なパーティクル。
*   **全体音量 (RMS):** ポストプロセスのBloom（発光強度）に直結。

## システム上の重要課題と対策 (Technical Risks & Mitigations)
*   **Spotify Audio Analysis API の同期問題:** Web Audio APIがリアルタイム波形を返すのに対し、Spotifyは事前解析データを返すため、リップシンクのズレが発生しやすい。
    *   *対策:* `player.getCurrentState()` 等で正確な再生ポジションを取得し、Analysisデータの該当時点を補間（Interpolation）する堅牢な「オーディオ・シンカー（Audio Syncer）」クラスを設計する。API制限回避のためのキャッシュ戦略も考慮する。

## アプリケーション構成案 (Architecture)
*   `App`
    *   `UI/Overlay`
        *   `SourceSelector` (Spotifyログイン / ファイルアップロード)
        *   `VisualizerControls` (モード切替、カラー変更、感度・Gain調整、Auto Cameraトグル、Shake強度調整)
        *   `PlayerControls` (Play/Pause, Seek, Volume)
        *   `ErrorFeedback` (エラーメッセージ・フォールバック誘導UI)
    *   `VisualizerCanvas` (Three.js Canvas)
        *   `Experience` (Scene, Lights, Camera)
        *   `PostProcessing` (Bloom, Noise)
        *   `Stage` (選ばれたモードに応じた3Dオブジェクト)
            *   `CoreVisualizer`
            *   `GridVisualizer`
            *   `ParticleVisualizer`

## 今後のステップ (Next Steps)
開発の停滞リスクを避けるため、まずはローカルファイル環境での3D実装を優先し、視覚的な完成形を作ってからSpotify API統合を行うアプローチを推奨します。

1.  Vite + React (TypeScript) プロジェクトのセットアップ。
2.  Web Audio API を用いた `AudioAnalyzer` Hook の作成（※ローカルファイル専用として実装）。
3.  Three.js の基本シーンと各ビジュアライザー・モード（球体、グリッド、粒子）のプロトタイプ実装。
    *   ※ パフォーマンスベンチマークを取り、パーティクル上限値を決定。
4.  モード切り替え機能とUIの実装（感度調整やAuto Camera、平滑化、アクセシビリティ対応）。
5.  **【フェーズ2】Spotify API 統合:**
    *   Spotify Developer Dashboardにてアプリケーション登録、Client ID取得（環境変数 `.env` に設定）。
    *   OAuth 2.0 PKCE フローの実装とトークン管理。
    *   Spotify Web Playback SDK の統合。
    *   Spotify Audio Analysis API を用いたタイムスタンプ同期ロジック（Audio Syncer）の実装と、共通インターフェースへの繋ぎ込み。
6.  デプロイ戦略の定義（Vercel 等へのホスティング、環境変数・Spotify Callback URLの設定）。