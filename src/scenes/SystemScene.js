// src/scenes/SystemScene.js

export default class SystemScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SystemScene', active: true });
        this.globalCharaDefs = null;
        this.isProcessingTransition = false; // 遷移処理中フラグ
        this.targetSceneKey = null; // 現在遷移を試みているターゲットシーンのキーを保持
    }

    create() {
        console.log("SystemScene: 起動・イベント監視開始");

        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.charaDefs) {
            this.globalCharaDefs = gameScene.charaDefs;
        }

        // --- シーン開始処理とフラグのリセットを管理する共通ヘルパー関数 ---
        const startAndMonitorScene = (sceneKey, params, waitForGameSceneLoadComplete) => {
            if (this.isProcessingTransition || (this.targetSceneKey && this.targetSceneKey === sceneKey)) {
                console.warn(`[SystemScene] シーン[${sceneKey}]は既に遷移処理中またはアクティブです。新しいリクエストをスキップします。`);
                return;
            }

            this.isProcessingTransition = true; // 遷移処理開始
            this.targetSceneKey = sceneKey;    // ターゲットシーンを設定

            this.scene.start(sceneKey, params);

            if (waitForGameSceneLoadComplete) {
                // GameSceneへの遷移の場合、GameSceneからのカスタムイベントを待つ
                this.scene.get('GameScene').events.once('gameScene-load-complete', () => {
                    // ★★★ 修正箇所: GameSceneとUISceneの入力をここで有効化 ★★★
                    this.scene.get('GameScene').input.enabled = true;
                    if (this.scene.isActive('UIScene')) { 
                        this.scene.get('UIScene').input.enabled = true;
                    }
                    console.log("SystemScene: GameSceneとUISceneの入力を再有効化しました。");

                    this.isProcessingTransition = false;
                    this.targetSceneKey = null; // ターゲットシーンをクリア
                    console.log("[SystemScene] GameSceneのロード完了イベント受信。遷移処理フラグをリセットしました。");
                });
            } else {
                // その他のシーンへの遷移の場合、PhaserのCREATEイベントを待つ
                this.scene.get(sceneKey).events.once(Phaser.Scenes.Events.CREATE, () => {
                    this.isProcessingTransition = false;
                    this.targetSceneKey = null; // ターゲットシーンをクリア
                    console.log(`[SystemScene] シーン[${sceneKey}]のCREATEイベント受信。遷移処理フラグをリセットしました。`);
                });
            }
        };


        // --- 1. [jump] や [call] によるシーン遷移リクエストを処理 ---
        this.events.on('request-scene-transition', (data) => {
            console.log(`[SystemScene] シーン遷移リクエスト: ${data.from} -> ${data.to}`, data.params);

            // 現在のノベルパートのシーンの入力を完全に無効化し、停止
            if (this.scene.isActive('GameScene')) {
                this.scene.get('GameScene').input.enabled = false;
                this.scene.stop('GameScene');
            }
            // UISceneは停止しない。入力だけ無効化。
            if (this.scene.isActive('UIScene')) {
                this.scene.get('UIScene').input.enabled = false;
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

            // ★★★ 削除: ここにあった GameSceneとUISceneの入力有効化を削除 ★★★
            // this.scene.get('GameScene').input.enabled = true;
            // if (this.scene.isActive('UIScene')) { 
            //     this.scene.get('UIScene').input.enabled = true;
            // }
            // console.log("SystemScene: GameSceneとUISceneの入力を再有効化しました。");

            startAndMonitorScene('GameScene', {
                charaDefs: this.globalCharaDefs,
                resumedFrom: data.from,
                returnParams: data.params,
            }, true); // GameSceneへの復帰なので、常にgameScene-load-completeを待つ
        });


        // --- オーバーレイ関連のイベントリスナー (ここでは isProcessingTransition フラグは使用しない) ---
        this.events.on('request-overlay', (data) => {
            console.log("[SystemScene] オーバーレイ表示リクエスト", data);
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
