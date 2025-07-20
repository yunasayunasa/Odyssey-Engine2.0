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

        const startAndMonitorScene = (sceneKey, params) => { 
            // isProcessingTransitionフラグは、再ジャンプの問題を解決するために必要です。
          

          //  this.game.input.enabled = false; 
            console.log("SystemScene: ゲーム全体の入力を無効化しました。");

            this.isProcessingTransition = true; 
            this.targetSceneKey = sceneKey;    
            console.log(`[SystemScene] シーン[${sceneKey}]の起動を開始します。`);

            this.scene.start(sceneKey, params);

            this.time.delayedCall(0, () => {
                const newSceneInstance = this.scene.get(sceneKey);
                if (!newSceneInstance) {
                    console.error(`[SystemScene] シーン[${sceneKey}]のインスタンスが取得できませんでした。`);
                    this.isProcessingTransition = false;
                    this.targetSceneKey = null;
                    this.game.input.enabled = true;
                    return;
                }

                newSceneInstance.events.once(Phaser.Scenes.Events.CREATE, (createdSceneInstance) => {
                    console.log(`[SystemScene] シーン[${sceneKey}]のCREATEイベント受信。`);
createdSceneInstance.input.enabled = true;
                    if (createdSceneInstance.scene.key === 'GameScene') {
                        createdSceneInstance.events.once('gameScene-load-complete', () => {
                            createdSceneInstance.input.enabled = true;
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
                        // ★★★ 修正箇所: GameScene以外でも、遷移完了後に入力を再有効化する ★★★
                        this.isProcessingTransition = false;
                        this.targetSceneKey = null; 
                        this.game.input.enabled = true; // ★★★ この行を追加 ★★★
                        console.log("SystemScene: ゲーム全体の入力を再有効化しました。");
                        console.log(`[SystemScene] シーン[${sceneKey}]のCREATEイベント受信。遷移処理フラグをリセットしました。(GameScene以外)`);
                    }
                });
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
           
               // ★★★ 修正箇所: UISceneがisActiveであれば、入力だけでなく表示も無効化する ★★★
        const uiSceneInstance = this.scene.get('UIScene');
        if (uiSceneInstance && uiSceneInstance.scene.isActive()) { 
            uiSceneInstance.input.enabled = false;
            uiSceneInstance.setVisible(false); // ★★★ UISceneの表示も無効化する ★★★
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