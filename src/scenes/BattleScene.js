// src/scenes/BattleScene.js (最終版)

import HpBar from '../ui/HpBar.js';
import CoinHud from '../ui/CoinHud.js';
import StateManager from '../core/StateManager.js';

export default class BattleScene extends Phaser.Scene {
    constructor() {
        super('BattleScene');
        this.receivedParams = null;
        this.stateManager = null;
        this.playerHpBar = null;
        this.enemyHpBar = null;
        this.coinHud = null;
        this.initialBattleParams = null;
          this.battleEnded = false; 
    }

    init(data) {
        this.receivedParams = data.transitionParams || {};
        console.log("BattleScene: init 完了。受け取ったパラメータ:", this.receivedParams);

        this.initialBattleParams = {
            playerLevel: this.receivedParams.player_level || 1,
            playerName: this.receivedParams.player_name || 'プレイヤー',
            initialCoin: this.receivedParams.current_coin || 0,
            initialPlayerMaxHp: this.receivedParams.player_max_hp || 100, // 初期化時も必要
            initialPlayerHp: this.receivedParams.player_hp || this.receivedParams.player_max_hp || 100,
        };
        console.log("BattleScene: 初期バトルパラメータ:", this.initialBattleParams);
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
        
        // ★★★ HPバーの初期値設定 (初期バトルパラメータから) ★★★
        this.stateManager.f.player_max_hp = this.initialBattleParams.initialPlayerMaxHp; 
        this.stateManager.f.player_hp = this.initialBattleParams.initialPlayerHp;
        this.playerHpBar.setHp(this.stateManager.f.player_hp, this.stateManager.f.player_max_hp);

        this.stateManager.f.enemy_max_hp = 500;
        this.stateManager.f.enemy_hp = 500;
        this.enemyHpBar.setHp(this.stateManager.f.enemy_hp, this.stateManager.f.enemy_max_hp);

        this.coinHud = new CoinHud(this, 100, 50);
        this.coinHud.setCoin(this.initialBattleParams.initialCoin);

        // ★★★ 修正箇所: updateイベントの登録はstartメソッドで行う ★★★
        // this.events.on('update', this.updateAllHud, this); // この行はcreateから削除

        const winButton = this.add.text(320, 600, '勝利してノベルパートに戻る', { fontSize: '32px', fill: '#0c0', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        winButton.on('pointerdown', () => this.endBattle('win'));

        const loseButton = this.add.text(this.scale.width - 320, 600, '敗北してゲームオーバー', { fontSize: '32px', fill: '#c00', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        loseButton.on('pointerdown', () => this.endBattle('lose'));

        console.log("BattleScene: create 完了");
    }

    // ★★★ 修正箇所: startライフサイクルメソッドを追加 ★★★
    start() {
        super.start(); // Phaser.Sceneのstartメソッドを呼び出す

        // ★★★ ここでupdateリスナーを登録する ★★★
        this.events.on('update', this.updateAllHud, this);
        console.log("BattleScene: start されました。updateリスナーを登録。");
    }

    // ★★★ 修正箇所: stopライフサイクルメソッドを追加 ★★★
    stop() {
        super.stop(); // Phaser.Sceneのstopメソッドを呼び出す

        // ★★★ ここでupdateリスナーを解除する ★★★
        this.events.off('update', this.updateAllHud, this);
        console.log("BattleScene: stop されました。updateリスナーを解除。");
    }

   

    // ★★★ 全てのHUDを更新する共通メソッド ★★★
    updateAllHud() {
        if (!this.stateManager) return; // StateManagerが取得できていない場合は何もしない
        
        // プレイヤーHPバーの更新
        const currentPlayerHp = this.stateManager.f.player_hp || 0;
        const maxPlayerHp = this.stateManager.f.player_max_hp || 100;
        if (this.playerHpBar.currentHp !== currentPlayerHp || this.playerHpBar.maxHp !== maxPlayerHp) {
            this.playerHpBar.setHp(currentPlayerHp, maxPlayerHp);
        }

        // 敵HPバーの更新
        const currentEnemyHp = this.stateManager.f.enemy_hp || 0;
        const maxEnemyHp = this.stateManager.f.enemy_max_hp || 100;
        if (this.enemyHpBar.currentHp !== currentEnemyHp || this.enemyHpBar.maxHp !== maxEnemyHp) {
            this.enemyHpBar.setHp(currentEnemyHp, maxEnemyHp);
        }

        // コインHUDの更新 (f.coin が BattleScene内で変化する場合)
        const currentCoin = this.stateManager.f.coin || 0;
        if (this.coinHud.coinText.text !== currentCoin.toString()) {
            this.coinHud.setCoin(currentCoin);
        }
    }

    /**
     * バトルを終了し、結果に応じて次のシーンへ遷移する
     * @param {string} result - 'win' or 'lose'
     */
 // src/scenes/BattleScene.js の endBattle メソッド (最終版)

    endBattle(result) {
        console.log(`BattleScene: バトル終了。結果: ${result}`);
        
        // ★★★ 修正箇所: イベントが複数回発行されないように、フラグで制御 ★★★
        if (this.battleEnded) {
            console.warn("BattleScene: バトル終了処理が複数回呼ばれました。");
            return;
        }
        this.battleEnded = true; // 終了処理開始フラグ

        // まず入力を無効化し、ユーザーが連打しても問題が起きないようにする
        this.input.enabled = false;

        if (result === 'win') {
            this.scene.get('SystemScene').events.emit('return-to-novel', {
                from: this.scene.key,
                params: { 
                    'f.battle_result': 'win',
                    'f.player_hp': this.stateManager.f.player_hp,
                    'f.coin': this.stateManager.f.coin
                }
            });
        } else {
            // 敗北時: ゲームオーバー処理
            console.log("BattleScene: ゲームオーバー処理を開始します。");
            
            // ゲームオーバー画面（またはボタン）を表示 (テキスト、ボタンの生成は変更なし)
            const gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, 'GAME OVER', { /* ... */ });
            const retryButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 'もう一度挑戦', { /* ... */ });
            const titleButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 120, 'タイトルに戻る', { /* ... */ });

            retryButton.on('pointerdown', () => {
                console.log("BattleScene: もう一度挑戦します。");
                // ★★★ 修正箇所: リトライボタンを押した時に、再度endBattleが呼ばれないようにする ★★★
                // this.battleEnded = false; // 再度リトライできる場合はfalseに戻す
                this.scene.get('SystemScene').events.emit('request-scene-transition', {
                    to: this.scene.key,
                    from: this.scene.key,
                    params: this.initialBattleParams
                });
            });

            titleButton.on('pointerdown', () => {
                console.log("BattleScene: タイトルに戻ります。");
                // ★★★ 修正箇所: タイトルボタンを押した時に、再度endBattleが呼ばれないようにする ★★★
                // this.battleEnded = false; 
                this.scene.get('SystemScene').events.emit('return-to-novel', {
                    from: this.scene.key,
                    params: { 'f.battle_result': 'game_over' }
                });
            });
        }
    }
    // ★★★ BattleSceneのresumeメソッドも必ず持つ ★★★
    resume() {
        console.log("BattleScene: resume されました。入力を再有効化します。");
        this.input.enabled = true;
    }
}
