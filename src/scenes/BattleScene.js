// src/scenes/BattleScene.js (ActionSceneベースで再構築)

// HPバーやコインHUDは後で追加します。まずはシンプルな構造で。
// import HpBar from '../ui/HpBar.js'; 
// import CoinHud from '../ui/CoinHud.js'; 
// import StateManager from '../core/StateManager.js'; 

export default class BattleScene extends Phaser.Scene {
    constructor() {
        super('BattleScene');
        this.receivedParams = null; // ノベルから渡されたパラメータ
        // this.stateManager = null; // StateManagerへの参照は必要に応じてcreate内で取得
        // this.initialBattleParams = null; // リトライ機能は後で追加
        // this.battleEnded = false; // 二重発火防止フラグも後で追加
    }

    init(data) {
        // ノベルパートから渡されたパラメータを受け取る
        // SystemSceneで渡したキー名 ('transitionParams') と一致させる
        this.receivedParams = data.transitionParams || {}; 
        console.log("BattleScene: init 完了。受け取ったパラメータ:", this.receivedParams);

        // ★★★ この試合の初期状態を保持する (リトライ用) ★★★
        // 現時点では、ここで受け取ったパラメータをそのまま初期状態として使う
        this.initialBattleParams = {
            playerLevel: this.receivedParams.player_level || 1,
            playerName: this.receivedParams.player_name || 'プレイヤー',
            initialCoin: this.receivedParams.current_coin || 0,
            initialPlayerMaxHp: this.receivedParams.player_max_hp || 100, 
            initialPlayerHp: this.receivedParams.player_hp || this.receivedParams.receivedParams.player_max_hp || 100,
        };
        console.log("BattleScene: 初期バトルパラメータ:", this.initialBattleParams);
    }

    create() {
        console.log("BattleScene: create 開始");
        this.cameras.main.setBackgroundColor('#8a2be2'); // バトルシーンの色 (紫)

        // GameSceneのStateManagerへの参照を取得 (変数 f を更新するため)
        // 戦闘結果をfに反映させるため、ここでの参照は必須
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.stateManager) {
            this.stateManager = gameScene.stateManager;
        } else {
            console.error("BattleScene: GameSceneのStateManagerが見つかりません。ゲーム変数は更新できません。");
        }

        // --- プレイヤーと敵のプレースホルダー ---
        this.add.text(100, 360, 'PLAYER', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(this.scale.width - 100, 360, 'ENEMY', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);

        // ★★★ 受け取ったパラメータを画面に表示して確認する (テスト用、ActionSceneと同じ) ★★★
        let displayX = 100;
        let displayY = 100;
        this.add.text(displayX, displayY - 40, "Received Params:", { fontSize: '28px', fill: '#fff' });
        for (const key in this.receivedParams) {
            this.add.text(displayX, displayY, `${key}: ${this.receivedParams[key]}`, { fontSize: '24px', fill: '#fff' });
            displayY += 30;
        }

        // --- 勝利ボタン ---
        const winButton = this.add.text(320, 600, '勝利してノベルパートに戻る', { fontSize: '32px', fill: '#0c0', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        winButton.on('pointerdown', () => {
            console.log("BattleScene: 勝利ボタンクリック -> return-to-novel を発行");
            // StateManagerのf変数を更新
            if (this.stateManager) {
                this.stateManager.eval(`f.battle_result = 'win'`);
                this.stateManager.eval(`f.player_hp = ${this.stateManager.f.player_hp}`); // HPも最終値を引き継ぐ
                this.stateManager.eval(`f.coin = ${this.stateManager.f.coin}`); // コインも最終値を引き継ぐ
            }
            this.scene.get('SystemScene').events.emit('return-to-novel', {
                from: this.scene.key,
                // paramsはGameSceneのperformLoadでf変数に反映されるので、ここでは省略
                // params: { 'f.battle_result': 'win' } 
            });
        });

        // --- 敗北ボタン ---
        const loseButton = this.add.text(this.scale.width - 320, 600, '敗北してノベルパートに戻る', { fontSize: '32px', fill: '#c00', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        loseButton.on('pointerdown', () => {
            console.log("BattleScene: 敗北ボタンクリック -> return-to-novel を発行");
            // StateManagerのf変数を更新
            if (this.stateManager) {
                this.stateManager.eval(`f.battle_result = 'lose'`);
                this.stateManager.eval(`f.player_hp = ${this.stateManager.f.player_hp}`);
                this.stateManager.eval(`f.coin = ${this.stateManager.f.coin}`);
            }
            this.scene.get('SystemScene').events.emit('return-to-novel', {
                from: this.scene.key,
                // paramsはGameSceneのperformLoadでf変数に反映されるので、ここでは省略
                // params: { 'f.battle_result': 'lose' } 
            });
        });

        console.log("BattleScene: create 完了");
    }

    // ★★★ start, stop, resume メソッドは、問題の原因ではないため、ActionSceneと同じでOK ★★★
    start() {
        super.start();
        console.log("BattleScene: start されました。");
    }

    stop() {
        super.stop();
        console.log("BattleScene: stop されました。");
    }

    resume() {
        console.log("BattleScene: resume されました。入力を再有効化します。");
        this.input.enabled = true;
    }
}