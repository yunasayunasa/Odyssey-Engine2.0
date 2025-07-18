export default class SystemScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SystemScene', active: true });
        this.globalCharaDefs = null;
        this.isProcessingTransition = false; // ★★★ フラグの追加済みを確認 ★★★
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
                console.warn("[SystemScene] 遷移処理中。新しいリクエストをスキップします。", data);
                return;
            }
            this.isProcessingTransition = true; // 処理開始
            console.log(`[SystemScene] シーン遷移リクエスト: ${data.from} -> ${data.to}`, data.params);

            if (this.scene.isActive('GameScene')) {
                this.scene.get('GameScene').input.enabled = false;
                this.scene.stop('GameScene');
            }
            if (this.scene.isActive('UIScene')) {
                this.scene.get('UIScene').input.enabled = false;
            }
            
            this.scene.start(data.to, {
                charaDefs: this.globalCharaDefs,
                transitionParams: data.params, 
                startScenario: data.to === 'GameScene' ? 'test_main.ks' : null,
                startLabel: null,
            });

            // ★★★ 修正箇所: シーンの起動完了イベントを待つ ★★★
            // targetSceneが完全に起動し、create()が完了した後にフラグをリセットする
            this.scene.get(data.to).events.once(Phaser.Scenes.Events.CREATE, () => {
                // GameSceneの場合はperformLoad完了後のnext()まで考慮する必要がある
                // しかし、PhaserのCREATEイベントでフラグ解除するのが安全。
                // GameScene側でperformLoadが完了したことをSystemSceneに通知する仕組みがあればより理想的だが、
                // 現状はCREATEイベントで一旦解除し、次のクリックまで待つロジックで試す。
                this.isProcessingTransition = false;
                console.log(`[SystemScene] シーン[${data.to}]のCREATEイベント受信。遷移処理フラグをリセットしました。`);
            });
        });

        // --- 2. サブシーンからノベルパートへの復帰リクエストを処理 ---
        this.events.on('return-to-novel', (data) => {
            if (this.isProcessingTransition) {
                console.warn("[SystemScene] 遷移処理中。新しいノベル復帰リクエストをスキップします。", data);
                return;
            }
            this.isProcessingTransition = true; // 処理開始
            console.log(`[SystemScene] ノベル復帰リクエスト: from ${data.from}`, data.params);

            const fromScene = this.scene.get(data.from);
            if (fromScene) {
                fromScene.input.enabled = false;
            }
            if (data.from && this.scene.isActive(data.from)) {
                this.scene.stop(data.from);
            }

            this.scene.start('GameScene', {
                charaDefs: this.globalCharaDefs,
                resumedFrom: data.from,
                returnParams: data.params,
            });
            
            this.scene.get('GameScene').input.enabled = true;
            if (this.scene.isActive('UIScene')) { 
                this.scene.get('UIScene').input.enabled = true;
            }
            console.log("SystemScene: GameSceneとUISceneの入力を再有効化しました。");

            // ★★★ 修正箇所: GameSceneの起動完了イベントを待つ ★★★
            this.scene.get('GameScene').events.once(Phaser.Scenes.Events.CREATE, () => {
                this.isProcessingTransition = false;
                console.log("[SystemScene] GameSceneのCREATEイベント受信。遷移処理フラグをリセットしました。");
            });
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
    }
}
