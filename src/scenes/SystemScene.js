// src/scenes/SystemScene.js (二重起動問題を解決するための修正 - ステップ1-3)

export default class SystemScene extends Phaser.Scene {
    constructor() {
        // ★★★ 修正箇所: active:true を削除し、active:false に変更 ★★★
        super(  'SystemScene' ); 
        this.instanceId = Math.random(); 
        this.globalCharaDefs = null;
        this.isProcessingTransition = false; 
        this.targetSceneKey = null; 
         this.initialGameData = null; 
    }
 // ★★★ 追加: init() メソッドでPreloadSceneからのデータを受け取る ★★★
    init(data) {
        if (data && data.initialGameData) {
            this.initialGameData = data.initialGameData;
        }
    }
   create() {
        console.log("SystemScene: 起動・イベント監視開始");

        // ★★★ 修正箇所: create()内で、渡されたデータを使って初期ゲーム起動を行う ★★★
        if (this.initialGameData) {
            console.log("SystemScene: 初期ゲーム起動データを受信しました。");
            this.globalCharaDefs = this.initialGameData.charaDefs;

            // UISceneをlaunchする
              this.scene.launch('UIScene');
            const uiScene = this.scene.get('UIScene');

            if (uiScene) {
                uiScene.events.once(Phaser.Scenes.Events.CREATE, () => {
                    console.log("SystemScene: UISceneのCREATEイベント受信。GameSceneを起動します。");
                    
                    // ★★★ UISceneのCREATE完了後にGameSceneをstartする ★★★
                    this.scene.start('GameScene', { 
                        charaDefs: this.globalCharaDefs,
                        startScenario: this.initialGameData.startScenario,
                        startLabel: null,
                    });
                    console.log("SystemScene: 初期ゲーム起動処理を開始しました。");
                });
            } else {
                console.error("SystemScene: UISceneのインスタンスが取得できませんでした。");
            }

            this.initialGameData = null; 
        }

        // --- シーン開始処理とフラグのリセットを管理する共通ヘルパー関数 ---
        const startAndMonitorScene = (sceneKey, params, waitForGameSceneLoadComplete) => {
            // (isProcessingTransition フラグのコメントアウトは、一旦そのままにしておきます。
            // これにより、後続のデバッグでこの部分が実際にどう機能するかを確認しやすくなります。)
            if (this.isProcessingTransition || (this.targetSceneKey && this.targetSceneKey === sceneKey)) {
                console.warn(`[SystemScene] シーン[${sceneKey}]は既に遷移処理中またはアクティブです。新しいリクエストをスキップします。`);
                return;
            }
            // ★★★ 追加: シーン遷移開始時に、ゲーム全体の入力を無効化 ★★★
            this.game.input.enabled = false; 
            console.log("SystemScene: ゲーム全体の入力を無効化しました。");


            this.isProcessingTransition = true; 
            this.targetSceneKey = sceneKey;    
             console.log(`[SystemScene ${this.instanceId}] シーン[${sceneKey}]の起動を開始します。`);

            this.scene.start(sceneKey, params);

            // ★★★ 修正箇所: GameSceneのCREATEイベントを待ってから、カスタムイベントを購読する ★★★
            this.scene.get(sceneKey).events.once(Phaser.Scenes.Events.CREATE, (createdSceneInstance) => {
                    console.log(`[SystemScene ${this.instanceId}] シーン[${sceneKey}]のCREATEイベント受信。`);
                if (waitForGameSceneLoadComplete && createdSceneInstance.scene.key === 'GameScene') {
                    createdSceneInstance.events.once('gameScene-load-complete', () => {
                        // GameSceneとUISceneの入力をここで有効化
                        createdSceneInstance.input.enabled = true; // GameSceneの入力
                        const uiScene = this.scene.get('UIScene'); 
                        if (uiScene && uiScene.scene.isActive()) { 
                            uiScene.input.enabled = true;
                        } else {
                            // UIシーンがアクティブでない場合は警告を出すが、ゲームの進行は妨げない
                            console.warn("SystemScene: GameSceneロード完了時、UISceneがアクティブではありませんでした。");
                        }
                        console.log("SystemScene: GameSceneとUISceneの入力を再有効化しました。");

                        this.isProcessingTransition = false;
                        this.targetSceneKey = null; 
                        // ★★★ 追加: 全ての遷移処理完了後にゲーム全体の入力を再有効化 ★★★
                        this.game.input.enabled = true;
                        console.log("SystemScene: ゲーム全体の入力を再有効化しました。");
                        console.log(`[SystemScene] GameSceneのロード完了イベント受信。遷移処理フラグをリセットしました。`);
                    });
                } else {
                    // GameScene以外への遷移の場合、CREATEイベント受信でフラグをリセット
                    this.isProcessingTransition = false;
                    this.targetSceneKey = null; 
                    // ★★★ 追加: 全ての遷移処理完了後にゲーム全体の入力を再有効化 ★★★
                    this.game.input.enabled = true;
                    console.log("SystemScene: ゲーム全体の入力を再有効化しました。");
                    console.log(`[SystemScene] シーン[${sceneKey}]のCREATEイベント受信。遷移処理フラグをリセットしました。(GameScene以外)`);
                }
            });
        };


        // --- 1. [jump] や [call] によるシーン遷移リクエストを処理 ---
        this.events.on('request-scene-transition', (data) => {
            console.log(`[SystemScene] シーン遷移リクエスト: ${data.from} -> ${data.to}`, data.params);

            // 現在のノベルパートのシーンの入力を完全に無効化し、停止
            const gameSceneInstance = this.scene.get('GameScene');
            if (gameSceneInstance && gameSceneInstance.scene.isActive()) { 
                gameSceneInstance.input.enabled = false;
                gameSceneInstance.scene.stop('GameScene');
            }
            // UISceneは停止しない。入力だけ無効化。
            const uiSceneInstance = this.scene.get('UIScene');
            if (uiSceneInstance && uiSceneInstance.scene.isActive()) { 
                uiSceneInstance.input.enabled = false;
            }
            
            startAndMonitorScene(data.to, {
                charaDefs: this.globalCharaDefs, 
                transitionParams: data.params, 
                startScenario: data.to === 'GameScene' ? 'test_main.ks' : null,
                startLabel: null,
            }, data.to === 'GameScene'); 
        });

        // --- 2. サブシーンからノベルパートへの復帰リクエストを処理 ---
        this.events.on('return-to-novel', (data) => {
            console.log(`[SystemScene] ノベル復帰リクエスト: from ${data.from}`, data.params);

            // 戻り元のシーンの入力を無効化し、停止
            const fromScene = this.scene.get(data.from);
            if (fromScene) { 
                fromScene.input.enabled = false;
            }
            if (data.from && this.scene.isActive(data.from)) { 
                this.scene.stop(data.from);
            }
            
            startAndMonitorScene('GameScene', {
                charaDefs: this.globalCharaDefs,
                resumedFrom: data.from,
                returnParams: data.params,
            }, true); 
        });

        /**
         * ゲーム初期起動時のGameSceneとUISceneの起動を処理する
         * PreloadSceneから一度だけ呼び出されることを想定
         * @param {Object} charaDefs - ロード済みのcharaDefsオブジェクト
         * @param {string} startScenarioKey - GameSceneで最初にロードするシナリオキー
         */
        this.startInitialGame = (charaDefs, startScenarioKey) => {
            this.globalCharaDefs = charaDefs;
             console.log(`[SystemScene ${this.instanceId}] 初期ゲーム起動リクエストを受信しました。`);

            // UISceneを先に起動（またはアクティブ化）する
            const uiSceneInstance = this.scene.get('UIScene');
            if (!uiSceneInstance || !uiSceneInstance.scene.isActive()) { 
                this.scene.launch('UIScene'); 
            }
            
            // ★★★ 追加: 初期起動時はSystemSceneのstartInitialGameが呼ばれるため、
            // その中で全体入力を有効化する前に、一度無効化して安定させる。
            this.game.input.enabled = false; 
            console.log("SystemScene: 初期ゲーム起動時、ゲーム全体の入力を一時無効化しました。");


            startAndMonitorScene('GameScene', { 
                charaDefs: this.globalCharaDefs,
                startScenario: startScenarioKey,
                startLabel: null,
            }, true); 
            
             console.log(`[SystemScene ${this.instanceId}] 初期ゲーム起動処理を開始しました。`);
        };

        // --- オーバーレイ関連のイベントリスナー ---
        this.events.on('request-overlay', (data) => {
            console.log("[SystemScene] オーバーレイ表示リクエスト", data);
            // オーバーレイ表示中は、現在のシーンの入力を無効化
            const fromScene = this.scene.get(data.from);
            if (fromScene) {
                fromScene.input.enabled = false; 
            }
            // UISceneの入力は無効化しない (オーバーレイはUI上に重なるため)
            
            this.scene.launch('NovelOverlayScene', { 
                scenario: data.scenario,
                charaDefs: this.globalCharaDefs,
                returnTo: data.from
            });
        });
        
        this.events.on('end-overlay', (data) => {
            console.log(`[SystemScene] オーバーレイ終了`, data);
            this.scene.stop(data.from); 
            const returnScene = this.scene.get(data.returnTo);
            if (returnScene) { 
                returnScene.input.enabled = true; 
                console.log(`SystemScene: シーン[${data.returnTo}]の入力を再有効化しました。`);
            }
        });
    }
}