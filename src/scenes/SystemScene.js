// src/scenes/SystemScene.js (矛盾を解消し、堅牢性を高める最終修正)

export default class SystemScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SystemScene' }); // main.jsでactive:falseに統一済み
        this.globalCharaDefs = null;
        this.isProcessingTransition = false; 
        this.targetSceneKey = null; 
        this.initialGameData = null;
        this.instanceId = Math.random(); // ★★★ 追加: デバッグ用のインスタンスID ★★★
    }

    init(data) {
        if (data && data.initialGameData) {
            this.initialGameData = data.initialGameData;
        }
    }

    create() {
        console.log(`[SystemScene ${this.instanceId}] 起動・イベント監視開始`);

        // ★★★ 修正箇所: create()冒頭の重複した起動ロジックを完全に削除 ★★★
        // if (this.initialGameData) { ... } のブロックを削除

        // --- シーン開始処理とフラグのリセットを管理する共通ヘルパー関数 ---
        const startAndMonitorScene = (sceneKey, params, waitForGameSceneLoadComplete) => {
            // ★★★ 修正箇所: isProcessingTransition フラグのコメントアウトを解除 ★★★
            if (this.isProcessingTransition || (this.targetSceneKey && this.targetSceneKey === sceneKey)) {
                console.warn(`[SystemScene ${this.instanceId}] シーン[${sceneKey}]は既に遷移処理中またはアクティブです。新しいリクエストをスキップします。`);
                return;
            }
            
            this.game.input.enabled = false; 
            console.log(`[SystemScene ${this.instanceId}] ゲーム全体の入力を無効化しました。`);

            this.isProcessingTransition = true; 
            this.targetSceneKey = sceneKey;    
            console.log(`[SystemScene ${this.instanceId}] シーン[${sceneKey}]の起動を開始します。`);

            this.scene.start(sceneKey, params);

            this.scene.get(sceneKey).events.once(Phaser.Scenes.Events.CREATE, (createdSceneInstance) => {
                console.log(`[SystemScene ${this.instanceId}] シーン[${sceneKey}]のCREATEイベント受信。`);

                if (waitForGameSceneLoadComplete && createdSceneInstance.scene.key === 'GameScene') {
                    createdSceneInstance.events.once('gameScene-load-complete', () => {
                        createdSceneInstance.input.enabled = true; 
                        const uiScene = this.scene.get('UIScene'); 
                        if (uiScene && uiScene.scene.isActive()) { 
                            uiScene.input.enabled = true;
                        } else {
                            console.warn(`[SystemScene ${this.instanceId}] GameSceneロード完了時、UISceneがアクティブではありませんでした。`);
                        }
                        console.log(`[SystemScene ${this.instanceId}] GameSceneとUISceneの入力を再有効化しました。`);

                        this.isProcessingTransition = false;
                        this.targetSceneKey = null; 
                        this.game.input.enabled = true;
                        console.log(`[SystemScene ${this.instanceId}] ゲーム全体の入力を再有効化しました。`);
                        console.log(`[SystemScene ${this.instanceId}] GameSceneのロード完了イベント受信。遷移処理フラグをリセットしました。`);
                    });
                } else {
                    this.isProcessingTransition = false;
                    this.targetSceneKey = null; 
                    this.game.input.enabled = true;
                    console.log(`[SystemScene ${this.instanceId}] ゲーム全体の入力を再有効化しました。`);
                    console.log(`[SystemScene ${this.instanceId}] シーン[${sceneKey}]のCREATEイベント受信。遷移処理フラグをリセットしました。(GameScene以外)`);
                }
            });
        };


        // --- 1. [jump] や [call] によるシーン遷移リクエストを処理 ---
        this.events.on('request-scene-transition', (data) => {
            console.log(`[SystemScene ${this.instanceId}] シーン遷移リクエスト: ${data.from} -> ${data.to}`, data.params);

            const gameSceneInstance = this.scene.get('GameScene');
            if (gameSceneInstance && gameSceneInstance.scene.isActive()) { 
                gameSceneInstance.input.enabled = false;
                gameSceneInstance.scene.stop('GameScene');
            }
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
            console.log(`[SystemScene ${this.instanceId}] ノベル復帰リクエスト: from ${data.from}`, data.params);

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

        // ★★★ 修正箇所: startInitialGameメソッドを、PreloadSceneから渡されたデータで起動するように修正 ★★★
        this.startInitialGame = (charaDefs, startScenarioKey) => {
            this.globalCharaDefs = charaDefs;
            console.log(`[SystemScene ${this.instanceId}] 初期ゲーム起動リクエストを受信しました。`);

            // UISceneを先に起動（またはアクティブ化）する
            const uiSceneInstance = this.scene.get('UIScene');
            if (!uiSceneInstance || !uiSceneInstance.scene.isActive()) { 
                this.scene.launch('UIScene'); 
            }
            
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