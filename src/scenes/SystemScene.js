// src/scenes/SystemScene.js (最終版 - 最強の遷移管理)

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

        // --- 1. シーン遷移リクエストを処理 ---
        this.events.on('request-scene-transition', (data) => {
            if (this.isProcessingTransition) {
                console.warn(`[SystemScene] 遷移処理中。リクエスト(${data.to})をスキップ。`);
                return;
            }
            this.isProcessingTransition = true;
            console.log(`[SystemScene] シーン遷移リクエスト: ${data.from} -> ${data.to}`);

            // 現在のシーンを停止
            if (this.scene.isActive(data.from)) {
                this.scene.stop(data.from);
            }
            
            // ★★★ 新しいシーンがcreateを完了するのを待つ ★★★
            this.scene.manager.once(`scene-create-${data.to}`, (newScene) => {
                console.log(`[SystemScene] シーン[${data.to}]のCREATE完了。`);
                // ★★★ GameSceneへの復帰の場合、ここからロード処理を命令する ★★★
                if (data.to === 'GameScene') {
                    newScene.startLoading(data.returnParams); // ★ 新しいメソッド
                } else {
                    // BattleSceneなどの場合は、ここで遷移完了とする
                    this.isProcessingTransition = false;
                }
            });
            
            this.scene.start(data.to, {
                charaDefs: this.globalCharaDefs,
                transitionParams: data.params, // jump/callからのパラメータ
                resumedFrom: data.from, // どこから来たか
            });
        });

        // --- 2. GameSceneからのロード完了報告を待つ ---
        this.events.on('gameScene-ready', () => {
            console.log("[SystemScene] GameScene準備完了の報告を受信。");
            // GameSceneとUISceneの入力を有効化
            this.scene.get('GameScene').input.enabled = true;
            if (this.scene.isActive('UIScene')) {
                this.scene.get('UIScene').input.enabled = true;
            }
            this.isProcessingTransition = false; // 遷移処理完了
            console.log("[SystemScene] 遷移処理フラグをリセットしました。");
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
