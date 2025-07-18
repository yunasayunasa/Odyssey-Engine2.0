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
        // この関数がシーンを実際に開始し、完了イベントを待ち、フラグをリセットする
        const startAndMonitorScene = (sceneKey, params, waitForGameSceneLoadComplete) => {
            // すでに遷移処理中の場合、またはターゲットシーンが既にアクティブ/遷移中の場合
            if (this.isProcessingTransition || (this.targetSceneKey && this.targetSceneKey === sceneKey)) {
                console.warn(`[SystemScene] シーン[${sceneKey}]は既に遷移処理中またはアクティブです。新しいリクエストをスキップします。`);
                return;
            }

            this.isProcessingTransition = true; // 遷移処理開始
            this.targetSceneKey = sceneKey;    // ターゲットシーンを設定

            // ターゲットシーンを実際に開始
            this.scene.start(sceneKey, params);

            // 遷移完了イベントを購読してフラグをリセット
            if (waitForGameSceneLoadComplete) {
                // GameSceneへの遷移の場合、GameSceneからのカスタムイベントを待つ
                this.scene.get('GameScene').events.once('gameScene-load-complete', () => {
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
            
            // 共通ヘルパー関数でシーン遷移を開始
            startAndMonitorScene(data.to, {
                charaDefs: this.globalCharaDefs,
                transitionParams: data.params, 
                startScenario: data.to === 'GameScene' ? 'test_main.ks' : null,
                startLabel: null,
            }, data.to === 'GameScene'); // GameSceneの場合はgameScene-load-completeを待つ
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

            // GameSceneとUISceneの入力を明示的に有効化 (ここではまだ isProcessingTransition は true のまま)
            // これはシーンが完全に安定した後に発生するべきだが、Phaserの入力はすぐに有効化する必要がある場合がある
            // なので、この位置は維持する
            this.scene.get('GameScene').input.enabled = true;
            if (this.scene.isActive('UIScene')) { 
                this.scene.get('UIScene').input.enabled = true;
            }
            console.log("SystemScene: GameSceneとUISceneの入力を再有効化しました。");

            // 共通ヘルパー関数でGameSceneへの復帰を開始 (GameSceneの場合は常にload-completeを待つ)
            startAndMonitorScene('GameScene', {
                charaDefs: this.globalCharaDefs,
                resumedFrom: data.from,
                returnParams: data.params,
            }, true);
        });


        // --- オーバーレイ関連のイベントリスナー (ここでは isProcessingTransition フラグは使用しない) ---
        // オーバーレイは既存シーンを停止しないため、遷移とは別の扱い
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
