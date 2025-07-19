// src/scenes/SystemScene.js (最終版 - 最強のイベント待機ロジック)

export default class SystemScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SystemScene', active: true });
        this.globalCharaDefs = null;
        this.isProcessingTransition = false; // 遷移処理中フラグ
    }

    create() {
        console.log("SystemScene: 起動・イベント監視開始");

        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.charaDefs) {
            this.globalCharaDefs = gameScene.charaDefs;
        }

        // --- 1. [jump] や [call] によるシーン遷移リクエストを処理 ---
        this.events.on('request-scene-transition', (data) => {
            if (this.isProcessingTransition) {
                console.warn(`[SystemScene] 現在、別のシーン遷移を処理中です。リクエスト(${data.to})をスキップします。`);
                return;
            }
            this.isProcessingTransition = true;
            console.log(`[SystemScene] シーン遷移リクエスト: ${data.from} -> ${data.to}`, data.params);

            // 現在のシーンを停止
            if (this.scene.isActive(data.from)) {
                this.scene.stop(data.from);
            }
            // UISceneはstopしない

            // ★★★ 修正箇所: Phaserのシーンマネージャーのイベントを直接リッスン ★★★
            // 新しいシーンが完全に起動し、createが完了したことを示すイベント
            this.scene.manager.once(`scene-create-${data.to}`, (scene) => {
                console.log(`[SystemScene] シーン[${data.to}]のCREATEイベント受信。`);
                // 遷移先のシーンとUISceneの入力を有効化
                scene.input.enabled = true;
                if (this.scene.isActive('UIScene')) {
                    this.scene.get('UIScene').input.enabled = true;
                }
                this.isProcessingTransition = false; // 遷移処理完了
                console.log("[SystemScene] 遷移処理フラグをリセットしました。");
            });

            // 新しいシーンを起動
            this.scene.start(data.to, {
                charaDefs: this.globalCharaDefs,
                transitionParams: data.params, 
                startScenario: data.to === 'GameScene' ? 'test.ks' : null,
                startLabel: null,
            });
        });

        // --- 2. サブシーンからノベルパートへの復帰リクエストを処理 ---
        this.events.on('return-to-novel', (data) => {
            if (this.isProcessingTransition) {
                console.warn(`[SystemScene] 現在、別のシーン遷移を処理中です。復帰リクエストをスキップします。`);
                return;
            }
            this.isProcessingTransition = true;
            console.log(`[SystemScene] ノベル復帰リクエスト: from ${data.from}`, data.params);

            // 戻り元のシーンを停止
            if (data.from && this.scene.isActive(data.from)) {
                this.scene.stop(data.from);
            }

            // ★★★ 修正箇所: GameSceneのCREATEイベントを待つ ★★★
            this.scene.manager.once('scene-create-GameScene', (scene) => {
                console.log("[SystemScene] GameSceneのCREATEイベント受信。");
                // GameSceneとUISceneの入力を有効化
                scene.input.enabled = true;
                if (this.scene.isActive('UIScene')) {
                    this.scene.get('UIScene').input.enabled = true;
                }
                this.isProcessingTransition = false;
                console.log("[SystemScene] 遷移処理フラグをリセットしました。");
            });
            
            // GameSceneを「復帰モード」で起動
            this.scene.start('GameScene', {
                charaDefs: this.globalCharaDefs,
                resumedFrom: data.from,
                returnParams: data.params,
            });
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
