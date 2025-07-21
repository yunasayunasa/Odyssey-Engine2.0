import SoundManager from '../core/SoundManager.js';

export default class SystemScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SystemScene' });
        this.globalCharaDefs = null;
        this.isProcessingTransition = false;
        this.initialGameData = null;
    }

    init(data) {
        if (data && data.initialGameData) {
            this.initialGameData = data.initialGameData;
        }
    }

    create() {
        console.log("SystemScene: 起動・グローバルサービスのセットアップを開始。");
        const soundManager = new SoundManager(this.game);
        this.sys.registry.set('soundManager', soundManager);
        this.input.once('pointerdown', () => soundManager.resumeContext(), this);
        console.log("SystemScene: SoundManagerを生成・登録しました。");

        // --- イベントリスナーを登録 ---
        this.events.on('request-scene-transition', this._handleRequestSceneTransition, this);
        this.events.on('return-to-novel', this._handleReturnToNovel, this);
        this.events.on('request-overlay', this._handleRequestOverlay, this);
        this.events.on('end-overlay', this._handleEndOverlay, this);
        
        // ★★★ PreloadSceneから渡されたデータで初期ゲームを起動 ★★★
        if (this.initialGameData) {
            this._startInitialGame(this.initialGameData);
        }
    }

    /**
     * 初期ゲームを起動する内部メソッド
     * @param {object} initialData - PreloadSceneから渡されたデータ
     */
    _startInitialGame(initialData) {
        this.globalCharaDefs = initialData.charaDefs;
        console.log(`[SystemScene] 初期ゲーム起動リクエストを受信。`);
        this.scene.launch('UIScene');
        this._startAndMonitorScene('GameScene', {
            charaDefs: this.globalCharaDefs,
            startScenario: initialData.startScenario,
            startLabel: null,
        });
    }
    
    /**
     * [jump]などによるシーン遷移リクエストを処理
     * @param {object} data - { from: string, to: string, params: object }
     */
    _handleRequestSceneTransition(data) {
        console.log(`[SystemScene] シーン遷移リクエスト: ${data.from} -> ${data.to}`);
        if (this.scene.isActive(data.from)) {
            this.scene.stop(data.from);
        }
        if (this.scene.isActive('UIScene')) {
            this.scene.get('UIScene').setVisible(false); // UIは非表示にする
        }
        this._startAndMonitorScene(data.to, {
            charaDefs: this.globalCharaDefs,
            resumedFrom: data.from, // どこから来たかを伝える
            returnParams: data.params, // パラメータを渡す
        });
    }

    /**
     * サブシーンからノベルパートへの復帰リクエストを処理
     * @param {object} data - { from: string, params: object }
     */
    _handleReturnToNovel(data) {
        console.log(`[SystemScene] ノベル復帰リクエスト: from ${data.from}`);
        if (this.scene.isActive(data.from)) {
            this.scene.stop(data.from);
        }
        if (this.scene.isActive('UIScene')) {
            this.scene.get('UIScene').setVisible(true); // UIを再表示
        }
        this._startAndMonitorScene('GameScene', {
            charaDefs: this.globalCharaDefs,
            resumedFrom: data.from,
            returnParams: data.params,
        });
    }
// ... SystemScene.js の他のメソッド ...

    /**
     * オーバーレイ表示のリクエストを処理
     * @param {object} data - { from: string, scenario: string }
     */
    _handleRequestOverlay(data) {
        console.log(`[SystemScene] オーバーレイ表示リクエストを受信 (from: ${data.from})`);

        // オーバーレイ表示中は、背後のシーンの入力を無効化する
        const fromScene = this.scene.get(data.from);
        if (fromScene && fromScene.scene.isActive()) {
            fromScene.input.enabled = false;
        }

        // UISceneはオーバーレイの下に表示され続けるので、入力は有効のまま
        
        // NovelOverlaySceneを現在のシーンの上にlaunchする
        this.scene.launch('NovelOverlayScene', { 
            scenario: data.scenario,
            charaDefs: this.globalCharaDefs,
            returnTo: data.from // どのシーンに戻るべきかを渡す
        });
    }

    /**
     * オーバーレイ終了のリクエストを処理
     * @param {object} data - { from: 'NovelOverlayScene', returnTo: string }
     */
    _handleEndOverlay(data) {
        console.log(`[SystemScene] オーバーレイ終了リクエストを受信 (return to: ${data.returnTo})`);

        // NovelOverlaySceneを停止する
        if (this.scene.isActive(data.from)) {
            this.scene.stop(data.from); 
        }

        // 元のシーンの入力を再度有効化する
        const returnScene = this.scene.get(data.returnTo);
        if (returnScene && returnScene.scene.isActive()) { 
            returnScene.input.enabled = true; 
            console.log(`[SystemScene] シーン[${data.returnTo}]の入力を再有効化しました。`);
        }
    }

// ... SystemScene.js の他のメソッド ...
  
    /**
     * ★★★ 新しいシーンを起動し、完了まで監視するコアメソッド (改訂版) ★★★
     * @param {string} sceneKey - 起動するシーンのキー
     * @param {object} params - シーンに渡すデータ
     */
    _startAndMonitorScene(sceneKey, params) {
        if (this.isProcessingTransition) {
            console.warn(`[SystemScene] 遷移処理中に新たな遷移リクエスト(${sceneKey})がありましたが、無視されました。`);
            return;
        }

        this.isProcessingTransition = true;
        this.game.input.enabled = false;
        console.log(`[SystemScene] シーン[${sceneKey}]の起動を開始。ゲーム全体の入力を無効化。`);

        // ★★★ 修正の核心 ★★★
        // runは、指定したシーンがCREATEされた後にコールバックを実行してくれる
        this.scene.run(sceneKey, params);

        const targetScene = this.scene.get(sceneKey);
        
        // CREATEイベントを待つ必要がなくなるため、コードがシンプルになる。
        // targetSceneは確実に新しいインスタンスを指している。
        console.log(`[SystemScene] シーン[${sceneKey}]のCREATEを待機します。`);
        
        // GameSceneの場合は、さらにロード完了イベントを待つ
        if (sceneKey === 'GameScene') {
            targetScene.events.once('gameScene-load-complete', () => {
                this._onTransitionComplete(sceneKey);
            });
        } else {
            // GameScene以外はCREATE完了（runの完了）で即時遷移完了とみなしたいが、
            // 念のためCREATEイベントをリッスンする方が安全
            targetScene.events.once(Phaser.Scenes.Events.CREATE, () => {
                 this._onTransitionComplete(sceneKey);
            });
        }
    }

    /**
     * シーン遷移が完全に完了したときの処理
     * @param {string} sceneKey - 完了したシーンのキー
     */
    _onTransitionComplete(sceneKey) {
        this.isProcessingTransition = false;
        this.game.input.enabled = true;
        console.log(`[SystemScene] シーン[${sceneKey}]の遷移が完了。ゲーム全体の入力を再有効化。`);
    }
}