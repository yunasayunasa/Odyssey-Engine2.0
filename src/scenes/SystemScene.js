// src/scenes/SystemScene.js (最終版 Ver.8 - UISceneの起動を一本化)

export default class SystemScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SystemScene', active: true });
        this.globalCharaDefs = null;
    }

    create() {
        console.log("SystemScene: 起動・イベント監視開始");

        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.charaDefs) {
            this.globalCharaDefs = gameScene.charaDefs;
        }

        // --- 1. [jump] や [call] によるシーン遷移リクエストを処理 ---
        this.events.on('request-scene-transition', (data) => {
            console.log(`[SystemScene] シーン遷移リクエスト: ${data.from} -> ${data.to}`, data.params);

            // 現在のシーンの入力を完全に無効化
            if (this.scene.isActive('GameScene')) { this.scene.get('GameScene').input.enabled = false; }
            if (this.scene.isActive('BattleScene')) { this.scene.get('BattleScene').input.enabled = false; } 
            if (this.scene.isActive('UIScene')) { this.scene.get('UIScene').input.enabled = false; } // UIも無効化

            // 現在アクティブなシーンを停止 (UISceneは停止しない)
            if (this.scene.isActive('GameScene')) { this.scene.stop('GameScene'); }
            if (this.scene.isActive('BattleScene')) { this.scene.stop('BattleScene'); }

            // 新しいシーンを起動
            this.scene.start(data.to, {
                charaDefs: this.globalCharaDefs,
                transitionParams: data.params, 
                startScenario: data.to === 'GameScene' ? 'test.ks' : null,
                startLabel: null,
            });
            // ★★★ 修正箇所: UISceneをlaunchしない！常にアクティブなものとして扱う ★★★
            // if (data.to === 'GameScene' || data.to === 'BattleScene') {
            //     this.scene.launch('UIScene'); 
            // }
            
            // ★★★ 起動したシーンの入力を有効化 ★★★
            this.scene.get(data.to).input.enabled = true;
            // UISceneは常にアクティブなので、その入力を制御する
            this.scene.get('UIScene').input.enabled = true;
            console.log(`SystemScene: シーン[${data.to}]とUISceneの入力を再有効化しました。`);
        });

        // --- 2. サブシーンからノベルパートへの復帰リクエストを処理 ---
        this.events.on('return-to-novel', (data) => {
            console.log(`[SystemScene] ノベル復帰リクエスト: from ${data.from}`, data.params);

            // 戻り元のシーンの入力を無効化・停止
            const fromScene = this.scene.get(data.from);
            if (fromScene) {
                fromScene.input.enabled = false;
                if (this.scene.isActive(data.from)) {
                    this.scene.stop(data.from);
                }
            }

            // GameSceneを「復帰モード」で起動
            this.scene.start('GameScene', {
                charaDefs: this.globalCharaDefs,
                resumedFrom: data.from,
                returnParams: data.params,
            });
            // ★★★ 修正箇所: UISceneをlaunchしない！常にアクティブなものとして扱う ★★★
            // this.scene.launch('UIScene'); 

            // ★★★ 起動したGameSceneとUISceneの入力を有効化 ★★★
            this.scene.get('GameScene').input.enabled = true;
            this.scene.get('UIScene').input.enabled = true;
            console.log("SystemScene: GameSceneとUISceneの入力を再有効化しました。");
        });


        // --- オーバーレイ関連のイベントリスナー ---
        this.events.on('request-overlay', (data) => {
            console.log("[SystemScene] オーバーレイ表示リクエスト", data);
            
            const requestScene = this.scene.get(data.from);
            if (requestScene) {
                requestScene.input.enabled = false; // リクエスト元の入力を無効化
                console.log(`SystemScene: シーン[${data.from}]の入力を無効化しました。`);
            }
            // ★★★ 修正箇所: UISceneの入力を無効化 ★★★
            this.scene.get('UIScene').input.enabled = false;

            this.scene.launch('NovelOverlayScene', { 
                scenario: data.scenario,
                charaDefs: this.globalCharaDefs,
                returnTo: data.from
            });
        });
        
        this.events.on('end-overlay', (data) => {
            console.log(`[SystemScene] オーバーレイ終了`, data);
            
            this.scene.stop(data.from); // NovelOverlaySceneを停止
            
            // ★★★ 戻り先のシーンとUISceneの入力を有効化 ★★★
            const returnScene = this.scene.get(data.returnTo);
            if (returnScene) {
                returnScene.input.enabled = true;
                console.log(`SystemScene: シーン[${data.returnTo}]の入力を再有効化しました。`);
            }
            this.scene.get('UIScene').input.enabled = true; // UISceneの入力を有効化
        });
    }}