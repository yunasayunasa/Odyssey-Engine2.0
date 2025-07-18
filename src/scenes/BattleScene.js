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

    // src/scenes/BattleScene.js の init() メソッド (最終版)

    init(data) {
        // ノベルパートから渡されたパラメータを受け取る
        // data.transitionParams が undefined の場合を考慮して {} をデフォルトとする
        this.receivedParams = data.transitionParams || {};
        console.log("BattleScene: init 完了。受け取ったパラメータ:", this.receivedParams);

        // ★★★ 修正箇所: this.receivedParams の参照を修正 ★★★
        this.initialBattleParams = {
            playerLevel: this.receivedParams.player_level || 1,
            playerName: this.receivedParams.player_name || 'プレイヤー',
            initialCoin: this.receivedParams.current_coin || 0,
            initialPlayerMaxHp: this.receivedParams.player_max_hp || 100, 
            // 修正: this.receivedParams.player_hp を直接参照する
            initialPlayerHp: this.receivedParams.player_hp || this.receivedParams.player_max_hp || 100, 
        };
        console.log("BattleScene: 初期バトルパラメータ:", this.initialBattleParams);

        // シーンが再利用される可能性があるため、init時にbattleEndedフラグをリセット
        this.battleEnded = false; 
    }

  create() {
        console.log("BattleScene: create 開始");
        this.cameras.main.setBackgroundColor('#8a2be2');

        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.stateManager) {
            this.stateManager = gameScene.stateManager;
        } else {
            console.error("BattleScene: GameSceneのStateManagerが見つかりません。ゲーム変数は更新できません。");
        }

        this.add.text(100, 360, 'PLAYER', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(this.scale.width - 100, 360, 'ENEMY', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);

        this.playerHpBar = new HpBar(this, 20, 20, 250, 30, 'player');
        this.enemyHpBar = new HpBar(this, this.scale.width - 20, 20, 250, 30, 'enemy');
        this.enemyHpBar.x -= this.enemyHpBar.barWidth;
        
        this.stateManager.f.player_max_hp = this.initialBattleParams.initialPlayerMaxHp; 
        this.stateManager.f.player_hp = this.initialBattleParams.initialPlayerHp;
        this.playerHpBar.setHp(this.stateManager.f.player_hp, this.stateManager.f.player_max_hp);

        this.stateManager.f.enemy_max_hp = 500;
        this.stateManager.f.enemy_hp = 500;
        this.enemyHpBar.setHp(this.stateManager.f.enemy_hp, this.stateManager.f.enemy_max_hp);

        this.coinHud = new CoinHud(this, 100, 50);
        this.coinHud.setCoin(this.initialBattleParams.initialCoin);

        // --- テスト用のバトル進行ボタン ---
        this.winButton = this.add.text(320, 600, '勝利してノベルパートに戻る', { fontSize: '32px', fill: '#0c0', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        // ★★★ 修正箇所: endBattleにresultと戻りパラメータを直接渡す ★★★
        this.winButton.on('pointerdown', () => this.endBattle('win', {
            'f.battle_result': 'win',
            'f.player_hp': this.stateManager.f.player_hp, // 最終HPをノベルに戻す
            'f.coin': this.stateManager.f.coin // 最終コイン数をノベルに戻す
        }));

        this.loseButton = this.add.text(this.scale.width - 320, 600, '敗北してゲームオーバー', { fontSize: '32px', fill: '#c00', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        // ★★★ 修正箇所: endBattleにresultと戻りパラメータを直接渡す ★★★
        this.loseButton.on('pointerdown', () => this.endBattle('lose', {
            'f.battle_result': 'lose',
            'f.player_hp': this.stateManager.f.player_hp,
            'f.coin': this.stateManager.f.coin
        }));

        console.log("BattleScene: create 完了");
    }

    // (star// ★★★ start, stop, resume メソッドは、問題の原因ではないため、ActionSceneと同じでOK ★★★
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
    // src/scenes/BattleScene.js の endBattle メソッド

    /**
     * バトルを終了し、結果に応じて次のシーンへ遷移する
     * @param {string} result - 'win' or 'lose'
     * @param {Object} [returnParams] - GameSceneに引き渡す変数オブジェクト (optional)
     */
    endBattle(result, returnParams = {}) { // returnParams を引数に追加
        // バトル終了処理が複数回呼ばれるのを防ぐためのフラグ
        if (this.battleEnded) {
            console.warn(`BattleScene: バトル終了処理が複数回呼ばれました (結果: ${result})。スキップします。`);
            return;
        }
        this.battleEnded = true; // 終了処理開始フラグを立てる

        console.log(`BattleScene: バトル終了。結果: ${result}`);
        
        // まず入力を無効化し、誤操作を防ぐ (ボタンが残っている場合)
        this.input.enabled = false;

        // 既存の勝利/敗北ボタンのリスナーを解除し、オブジェクトも破棄
        if (this.winButton) { this.winButton.off('pointerdown'); this.winButton.destroy(); this.winButton = null; }
        if (this.loseButton) { this.loseButton.off('pointerdown'); this.loseButton.destroy(); this.loseButton = null; }


        if (result === 'win') {
            // 勝利時: ノベルパートへ戻る
            this.scene.get('SystemScene').events.emit('return-to-novel', {
                from: this.scene.key,
                params: returnParams // 受け取ったreturnParamsをそのまま渡す
            });
        } else {
            // 敗北時: ゲームオーバー処理
            console.log("BattleScene: ゲームオーバー処理を開始します。");
            
            // ゲームオーバー画面（またはボタン）を表示
            this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, 'GAME OVER', {
                fontSize: '64px', fill: '#f00', stroke: '#000', strokeThickness: 5
            }).setOrigin(0.5).setDepth(999);

            // retry/titleボタンもクラスプロパティに保存
            this.retryButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 'もう一度挑戦', {
                fontSize: '32px', fill: '#fff', backgroundColor: '#880000', padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(999);

            this.titleButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 120, 'タイトルに戻る', {
                fontSize: '32px', fill: '#fff', backgroundColor: '#444444', padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(999);

            // ボタンが押されたら、もう他のイベントは発火しないようにする
            this.retryButton.on('pointerdown', () => {
                console.log("BattleScene: もう一度挑戦します。");
                this.input.enabled = false; 
                // SystemSceneを経由してBattleSceneを再起動
                this.scene.get('SystemScene').events.emit('request-scene-transition', {
                    to: this.scene.key, // BattleScene自身
                    from: this.scene.key, // BattleSceneから
                    params: this.initialBattleParams // 初期パラメータを渡す
                });
            });

            this.titleButton.on('pointerdown', () => {
                console.log("BattleScene: タイトルに戻ります。");
                this.input.enabled = false;
                // SystemSceneを経由してGameSceneの頭に戻る
                this.scene.get('SystemScene').events.emit('return-to-novel', {
                    from: this.scene.key,
                    params: returnParams // 敗北時に渡されたreturnParamsをそのまま渡す
                });
            });
        }
    }
}