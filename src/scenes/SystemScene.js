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
        console.log("SystemScene: 起動・イベント監視開始");

        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.charaDefs) {
            this.globalCharaDefs = gameScene.charaDefs;
        }

        const startAndMonitorScene = (sceneKey, params) => { // waitForGameSceneLoadComplete引数を削除
            // isProcessingTransitionフラグは、再ジャンプの問題を解決するために必要です。
            if (this.isProcessingTransition || (this.targetSceneKey && this.targetSceneKey === sceneKey)) {
                console.warn(`[SystemScene] シーン[${sceneKey}]は既に遷移処理中またはアクティブです。新しいリクエストをスキップします。`);
                return;
            }

            this.game.input.enabled = false; 
            console.log("SystemScene: ゲーム全体の入力を無効化しました。");

            this.isProcessingTransition = true; 
            this.targetSceneKey = sceneKey;    
            console.log(`[SystemScene] シーン[${sceneKey}]の起動を開始します。`);

            // ★★★ 修正箇所: シーンをstartする前に、グローバルなシーンマネージャーでイベントを購読する ★★★
            // これにより、これから作成される新しいインスタンスのCREATEイベントを確実にキャッチできる
            this.scene.manager.events.once(Phaser.Scenes.Events.CREATE, (createdSceneInstance) => {
                // このイベントは「どのシーンでも」CREATEされたら発火するので、
                // 目的のシーンかどうかをキーで確認する
                if (createdSceneInstance.scene.key !== sceneKey) {
                    return; // 目的のシーンでなければ何もしない
                }

                console.log(`[SystemScene] シーン[${sceneKey}]のCREATEイベント受信。`);

                if (sceneKey === 'GameScene') {
                    // ★★★ ここが重要: 新しく作成されたcreatedSceneInstanceのイベントを購読 ★★★
                    createdSceneInstance.events.once('gameScene-load-complete', () => {
                        createdSceneInstance.input.enabled = true; // GameSceneの入力
                        const uiScene = this.scene.get('UIScene'); 
                        if (uiScene && uiScene.scene.isActive()) { 
                            uiScene.input.enabled = true;
                        }
                        console.log("SystemScene: GameSceneとUISceneの入力を再有効化しました。");

                        this.isProcessingTransition = false;
                        this.targetSceneKey = null; 
                        this.game.input.enabled = true;
                        console.log("SystemScene: ゲーム全体の入力を再有効化しました。");
                        console.log(`[SystemScene] GameSceneのロード完了イベント受信。遷移処理フラグをリセットしました。`);
                    });
                } else {
                    // GameScene以外への遷移の場合、CREATEイベント受信でフラグをリセット
                    this.isProcessingTransition = false;
                    this.targetSceneKey = null; 
                    this.game.input.enabled = true;
                    console.log("SystemScene: ゲーム全体の入力を再有効化しました。");
                    console.log(`[SystemScene] シーン[${sceneKey}]のCREATEイベント受信。遷移処理フラグをリセットしました。(GameScene以外)`);
                }
            });

            // イベント購読を設定した後に、シーンをstartする
            this.scene.start(sceneKey, params);
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