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
 endBattle(result) {
        console.log(`BattleScene: バトル終了。結果: ${result}`);
        
        if (result === 'win') {
            // 勝利時: ノベルパートへ戻る
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
            
            this.input.enabled = false; // ボタン表示中は入力無効化
            // ゲームオーバー画面（またはボタン）を表示
            const gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, 'GAME OVER', {
                fontSize: '64px', fill: '#f00', stroke: '#000', strokeThickness: 5
            }).setOrigin(0.5).setDepth(999);

            const retryButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 'もう一度挑戦', {
                fontSize: '32px', fill: '#fff', backgroundColor: '#880000', padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(999);

            const titleButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 120, 'タイトルに戻る', {
                fontSize: '32px', fill: '#fff', backgroundColor: '#444444', padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(999);

            retryButton.on('pointerdown', () => {
                console.log("BattleScene: もう一度挑戦します。");
                // ★★★ 修正箇所: BattleSceneを再起動する際にSystemSceneを経由 ★★★
                // これにより、input.enabled=true; がSystemSceneで適切に処理される
                this.scene.get('SystemScene').events.emit('request-scene-transition', {
                    to: this.scene.key, // BattleScene自身
                    from: this.scene.key, // BattleSceneから
                    params: this.initialBattleParams // 初期パラメータを渡す
                });
            });

            titleButton.on('pointerdown', () => {
                console.log("BattleScene: タイトルに戻ります。");
                // TODO: タイトルシーンへのジャンプルールをSystemSceneに追加
                // 現状はGameSceneの頭に戻る代替処理
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
