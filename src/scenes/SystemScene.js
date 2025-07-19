// src/scenes/SystemScene.js (最終版 - ハイブリッド待機ロ-ジック)

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
                console.warn(`[SystemScene] 遷移処理中。リクエスト(${data.to})をスキップ。`);
                return;
            }
            this.isProcessingTransition = true;
            console.log(`[SystemScene] シーン遷移リクエスト: ${data.from} -> ${data.to}`);

            // 現在のシーンを停止
            if (this.scene.isActive(data.from)) {
                this.scene.stop(data.from);
            }
            
            // ★★★ 遷移先がGameSceneの場合、カスタムイベントを待つ ★★★
            if (data.to === 'GameScene') {
                // GameSceneのperformLoad完了を待つ
                this.scene.manager.getScene('GameScene').events.once('gameScene-load-complete', () => {
                    console.log("[SystemScene] GameSceneのロード完了イベント受信。");
                    this.isProcessingTransition = false;
                });
            } else {
                // ★★★ それ以外のシーン(BattleSceneなど)の場合、PhaserのCREATEイベントを待つ ★★★
                // start()が呼ばれた後、新しいシーンのcreate()が完了すると発火する
                this.scene.manager.once(`scene-create-${data.to}`, (newScene) => {
                    console.log(`[SystemScene] シーン[${data.to}]のCREATEイベント受信。`);
                    this.isProcessingTransition = false;
                });
            }
            
            // 新しいシーンを起動
            this.scene.start(data.to, {
                charaDefs: this.globalCharaDefs,
                transitionParams: data.params, 
                startScenario: data.to === 'GameScene' ? 'test.ks' : null,
                startLabel: null,
                resumedFrom: data.from, // 復帰情報も渡す
            });
        });

        // --- 2. サブシーンからノベルパートへの復帰リクエストを処理 ---
        // このイベントは request-scene-transition に統合できるが、わかりやすさのため残す
        this.events.on('return-to-novel', (data) => {
            if (this.isProcessingTransition) {
                console.warn(`[SystemScene] 遷移処理中。復帰リクエストをスキップ。`);
                return;
            }
            this.isProcessingTransition = true;
            console.log(`[SystemScene] ノベル復帰リクエスト: from ${data.from}`);

            if (data.from && this.scene.isActive(data.from)) {
                this.scene.stop(data.from);
            }

            // GameSceneのperformLoad完了を待つ
            this.scene.manager.getScene('GameScene').events.once('gameScene-load-complete', () => {
                console.log("[SystemScene] GameSceneのロード完了イベント受信。");
                this.isProcessingTransition = false;
            });
            
            this.scene.start('GameScene', {
                charaDefs: this.globalCharaDefs,
                resumedFrom: data.from,
                returnParams: data.params,
            });
        });

        // --- 3. GameSceneからの入力有効化命令を待つリスナー ---
        // GameSceneが自身の準備ができたタイミングで、SystemSceneに入力を有効化させる
        this.events.on('enable-input', (sceneKeys) => {
            console.log(`[SystemScene] 入力有効化命令を受信:`, sceneKeys);
            sceneKeys.forEach(key => {
                if (this.scene.isActive(key)) {
                    this.scene.get(key).input.enabled = true;
                }
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
