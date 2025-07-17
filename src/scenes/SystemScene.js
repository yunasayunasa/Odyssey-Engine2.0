// SystemScene.js (最終版 Ver.4)

export default class SystemScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SystemScene', active: true });
        this.globalCharaDefs = null;
    }

  // src/scenes/SystemScene.js の create メソッド内 (最終版 Ver.7)

    create() {
        console.log("SystemScene: 起動・イベント監視開始");

        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.charaDefs) {
            this.globalCharaDefs = gameScene.charaDefs;
        }

        // --- 1. [jump] や [call] によるシーン遷移リクエストを処理 ---
        this.events.on('request-scene-transition', (data) => {
            console.log(`[SystemScene] シーン遷移リクエスト: ${data.from} -> ${data.to}`, data.params);

            // 現在のシーンの入力を完全に無効化 (安全のため)
            if (this.scene.isActive('GameScene')) { this.scene.get('GameScene').input.enabled = false; }
            if (this.scene.isActive('UIScene')) { this.scene.get('UIScene').input.enabled = false; }
            if (this.scene.isActive('BattleScene')) { this.scene.get('BattleScene').input.enabled = false; } // BattleSceneも考慮

            // 現在アクティブなシーンを停止
            if (this.scene.isActive('GameScene')) { this.scene.stop('GameScene'); }
            if (this.scene.isActive('UIScene')) { this.scene.stop('UIScene'); }
            if (this.scene.isActive('BattleScene')) { this.scene.stop('BattleScene'); }

            // 新しいシーンを起動
            this.scene.start(data.to, {
                charaDefs: this.globalCharaDefs,
                transitionParams: data.params, 
                startScenario: data.to === 'GameScene' ? 'test.ks' : null,
                startLabel: null,
            });
            // ★ UISceneは、GameSceneが起動するなら、ここで起動する ★
            if (data.to === 'GameScene' || data.to === 'BattleScene') { // BattleSceneでもUISceneが必要なら
                this.scene.launch('UIScene'); 
            }
            
            // ★★★ 起動したシーンの入力を有効化 ★★★
            this.scene.get(data.to).input.enabled = true;
            if (data.to === 'GameScene' || data.to === 'BattleScene') {
                 this.scene.get('UIScene').input.enabled = true;
            }
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
            this.scene.launch('UIScene'); // UISceneも起動

            // ★★★ 起動したシーンの入力を有効化 ★★★
            this.scene.get('GameScene').input.enabled = true;
            this.scene.get('UIScene').input.enabled = true;
            console.log("SystemScene: GameSceneとUISceneの入力を再有効化しました。");
        });


        // --- オーバーレイ関連のイベントリスナー ---
        // (request-overlayとend-overlayリスナーは変更なし)
        // ...
    


              // --- オーバーレイ関連のイベントリスナー ---

        this.events.on('request-overlay', (data) => {
            console.log("[SystemScene] オーバーレイ表示リクエスト", data);
            
            // ★★★ 修正箇所: ここで requestScene.scene.pause() を呼び出さない ★★★
            // ActionSceneは実行状態のままにする。入力はNovelOverlaySceneがブロックする。
            // const requestScene = this.scene.get(data.from);
            // if (requestScene) {
            //     requestScene.scene.pause(); 
            // }

            this.scene.launch('NovelOverlayScene', { 
                scenario: data.scenario,
                charaDefs: this.globalCharaDefs,
                returnTo: data.from
            });
        });
        
        this.events.on('end-overlay', (data) => {
            console.log(`[SystemScene] オーバーレイ終了`, data);
            
            this.scene.stop(data.from); // NovelOverlaySceneを停止
            
            // ★★★ 修正箇所: 戻り先のシーンを resume しない ★★★
            // ActionSceneはpauseされていないのでresume不要。入力を再有効化する
            const returnScene = this.scene.get(data.returnTo);
            if (returnScene) {
                // 明示的に入力を有効化する
                returnScene.input.enabled = true; 
                console.log(`SystemScene: シーン[${data.returnTo}]の入力を再有効化しました。`);
            }
        });
    }}
