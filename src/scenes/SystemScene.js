// SystemScene.js (最終版 Ver.4)

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

            // 現在のノベルパートのシーンの入力を完全に無効化 (もし有効であれば)
            if (this.scene.isActive('GameScene')) {
                this.scene.get('GameScene').input.enabled = false;
            }
            if (this.scene.isActive('UIScene')) {
                this.scene.get('UIScene').input.enabled = false;
            }
            
            // シーンを停止
            this.scene.stop('GameScene');
            this.scene.stop('UIScene');

            // 新しいシーンを開始
            this.scene.start(data.to, {
                charaDefs: this.globalCharaDefs,
                // ★★★ 修正箇所: data.params を 'transitionParams' というキーで渡す ★★★
                transitionParams: data.params, 
                startScenario: data.to === 'GameScene' ? 'test_main.ks' : null, // GameSceneに戻るならシナリオ指定
                startLabel: null,
            });
        });

        // --- 2. サブシーンからノベルパートへの復帰リクエストを処理 ---
        this.events.on('return-to-novel', (data) => {
            console.log(`[SystemScene] ノベル復帰リクエスト: from ${data.from}`, data.params);

            // 戻り元のシーンの入力を無効化 (もし有効であれば)
            const fromScene = this.scene.get(data.from);
            if (fromScene) {
                fromScene.input.enabled = false;
            }
            // 戻り元のシーンを停止
            if (data.from && this.scene.isActive(data.from)) {
                this.scene.stop(data.from);
            }

            // GameSceneを「復帰モード」で再開
            this.scene.start('GameScene', {
                charaDefs: this.globalCharaDefs,
                resumedFrom: data.from,
                returnParams: data.params,
            });
            this.scene.launch('UIScene');

            // ★★★ 修正箇所: GameSceneとUISceneの入力を明示的に有効化 ★★★
            // シーンがstart/launchされた直後に実行
            this.scene.get('GameScene').input.enabled = true;
            this.scene.get('UIScene').input.enabled = true;
            console.log("SystemScene: GameSceneとUISceneの入力を再有効化しました。");
        });


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