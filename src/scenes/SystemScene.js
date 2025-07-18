// src/scenes/SystemScene.js

export default class SystemScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SystemScene', active: true });
        this.globalCharaDefs = null;
        this.isProcessingTransition = false; // ★★★ 新しいフラグを追加 ★★★
    }

    create() {
        console.log("SystemScene: 起動・イベント監視開始");

        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.charaDefs) {
            this.globalCharaDefs = gameScene.charaDefs;
        }

        // --- 1. [jump] や [call] によるシーン遷移リクエストを処理 ---
        this.events.on('request-scene-transition', (data) => {
            // ★★★ 修正箇所: 処理中の場合はスキップ ★★★
            if (this.isProcessingTransition) {
                console.warn("[SystemScene] 遷移処理中。新しいリクエストをスキップします。", data);
                return;
            }
            this.isProcessingTransition = true; // 処理開始

            console.log(`[SystemScene] シーン遷移リクエスト: ${data.from} -> ${data.to}`, data.params);

            // 現在のノベルパートのシーンの入力を完全に無効化 (もし有効であれば)
            if (this.scene.isActive('GameScene')) {
                this.scene.get('GameScene').input.enabled = false;
            }
            // UISceneは停止しない。入力だけ無効化。
            if (this.scene.isActive('UIScene')) {
                this.scene.get('UIScene').input.enabled = false;
                // this.scene.stop('UIScene'); // 削除済みのはず
            }
            
            // GameSceneを停止
            this.scene.stop('GameScene'); // GameSceneは停止して再起動

            // 新しいシーンを開始
            this.scene.start(data.to, {
                charaDefs: this.globalCharaDefs,
                transitionParams: data.params, 
                startScenario: data.to === 'GameScene' ? 'test_main.ks' : null,
                startLabel: null,
            });

            // ★★★ 追加: 遷移完了を待ってフラグをリセットする ★★★
            // scene.start() は非同期なので、少し遅延させてフラグをリセット
            this.time.delayedCall(100, () => { // 例: 100msの遅延
                this.isProcessingTransition = false;
                console.log("[SystemScene] 遷移処理フラグをリセットしました。");
            });
        });

        // --- 2. サブシーンからノベルパートへの復帰リクエストを処理 ---
        this.events.on('return-to-novel', (data) => {
            // ★★★ 修正箇所: 処理中の場合はスキップ ★★★
            if (this.isProcessingTransition) {
                console.warn("[SystemScene] 遷移処理中。新しいノベル復帰リクエストをスキップします。", data);
                return;
            }
            this.isProcessingTransition = true; // 処理開始

            console.log(`[SystemScene] ノベル復帰リクエスト: from ${data.from}`, data.params);

            // 戻り元のシーンの入力を無効化し、停止 (例: BattleSceneを停止)
            const fromScene = this.scene.get(data.from);
            if (fromScene) {
                fromScene.input.enabled = false;
            }
            if (data.from && this.scene.isActive(data.from)) {
                this.scene.stop(data.from);
            }

            // GameSceneを「復帰モード」で再開
            this.scene.start('GameScene', {
                charaDefs: this.globalCharaDefs,
                resumedFrom: data.from,
                returnParams: data.params,
            });
            // this.scene.launch('UIScene'); // 削除済みのはず

            // GameSceneとUISceneの入力を明示的に有効化
            this.scene.get('GameScene').input.enabled = true;
            if (this.scene.isActive('UIScene')) { 
                this.scene.get('UIScene').input.enabled = true;
            }
            console.log("SystemScene: GameSceneとUISceneの入力を再有効化しました。");

            // ★★★ 追加: 遷移完了を待ってフラグをリセットする ★★★
            this.time.delayedCall(100, () => { // 例: 100msの遅延
                this.isProcessingTransition = false;
                console.log("[SystemScene] 遷移処理フラグをリセットしました。");
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
