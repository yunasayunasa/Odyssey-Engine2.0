// src/scenes/BattleScene.js (最終版 - 全ての改善を統合)

import HpBar from '../ui/HpBar.js'; 
import CoinHud from '../ui/CoinHud.js'; 
import StateManager from '../core/StateManager.js'; 

export default class BattleScene extends Phaser.Scene {
    constructor() {
        super('BattleScene');
        this.receivedParams = null; 
        this.initialBattleParams = null; 
        this.battleEnded = false; 
        this.eventEmitted = false; // ★★★ 追加: イベント発行済みフラグ ★★★
        
        // UI要素への参照をプロパティとして初期化 (stop()で破棄するため)
        this.playerHpBar = null;
        this.enemyHpBar = null;
        this.coinHud = null;
        this.winButton = null;
        this.loseButton = null;
        this.gameOverText = null;
        this.retryButton = null;
        this.titleButton = null;
        this.stateManager = null; // GameSceneから参照を取得するので初期値はnull
    }

    init(data) {
        this.receivedParams = data.transitionParams || {};
        console.log("BattleScene: init 完了。受け取ったパラメータ:", this.receivedParams);

        this.initialBattleParams = {
            playerLevel: this.receivedParams.player_level || 1,
            playerName: this.receivedParams.player_name || 'プレイヤー',
            initialCoin: this.receivedParams.current_coin || 0,
            initialPlayerMaxHp: this.receivedParams.player_max_hp || 100, 
            initialPlayerHp: this.receivedParams.player_hp || this.receivedParams.player_max_hp || 100, 
        };
        console.log("BattleScene: 初期バトルパラメータ:", this.initialBattleParams);

        // シーンが再利用される可能性があるため、init時にフラグをリセット
        this.battleEnded = false; 
        this.eventEmitted = false; // ★★★ init時にフラグをリセット ★★★
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
        
        this.winButton.on('pointerdown', () => {
            // ★★★ 修正箇所: クリック時にボタンの入力を即座に無効化 ★★★
            this.winButton.disableInteractive(); 
            if (this.loseButton) this.loseButton.disableInteractive(); 

            console.log("BattleScene: 勝利ボタンクリック -> return-to-novel を発行");
            // endBattleメソッドを呼び出し、イベント発行はendBattle内で制御
            this.endBattle('win', {
                'f.battle_result': 'win',
                'f.player_hp': this.stateManager.f.player_hp, 
                'f.coin': this.stateManager.f.coin 
            });
        });

        this.loseButton = this.add.text(this.scale.width - 320, 600, '敗北してゲームオーバー', { fontSize: '32px', fill: '#c00', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        this.loseButton.on('pointerdown', () => {
            // ★★★ 修正箇所: クリック時にボタンの入力を即座に無効化 ★★★
            this.loseButton.disableInteractive(); 
            if (this.winButton) this.winButton.disableInteractive(); 

            console.log("BattleScene: 敗北ボタンクリック -> return-to-novel を発行");
            // endBattleメソッドを呼び出し、イベント発行はendBattle内で制御
            this.endBattle('lose', {
                'f.battle_result': 'lose',
                'f.player_hp': this.stateManager.f.player_hp,
                'f.coin': this.stateManager.f.coin 
            });
        });

        console.log("BattleScene: create 完了");
    }

    start() {
        super.start();
        console.log("BattleScene: start されました。");
    }

    // ★★★ stop() メソッドを追加し、リソースを破棄 ★★★
    stop() {
        super.stop();
        console.log("BattleScene: stop されました。UI要素を破棄します。");

        // シーン停止時にゲームオブジェクトを破棄
        if (this.playerHpBar) { this.playerHpBar.destroy(); this.playerHpBar = null; }
        if (this.enemyHpBar) { this.enemyHpBar.destroy(); this.enemyHpBar = null; }
        if (this.coinHud) { this.coinHud.destroy(); this.coinHud = null; } 

        // 勝利/敗北ボタンのリスナー解除と破棄
        if (this.winButton) { this.winButton.off('pointerdown'); this.winButton.destroy(); this.winButton = null; }
        if (this.loseButton) { this.loseButton.off('pointerdown'); this.loseButton.destroy(); this.loseButton = null; }

        // ゲームオーバーUIがあれば破棄
        if (this.gameOverText) { this.gameOverText.destroy(); this.gameOverText = null; }
        if (this.retryButton) { this.retryButton.off('pointerdown'); this.retryButton.destroy(); this.retryButton = null; }
        if (this.titleButton) { this.titleButton.off('pointerdown'); this.titleButton.destroy(); this.titleButton = null; }
    }

    resume() {
        super.resume();
        console.log("BattleScene: resume されました。入力を再有効化します。");
        // SystemSceneが責任を持つため、ここで this.input.enabled = true; は通常不要
    }

    /**
     * バトルを終了し、結果に応じて次のシーンへ遷移する
     * @param {string} result - 'win' or 'lose'
     * @param {Object} [returnParams] - GameSceneに引き渡す変数オブジェクト (optional)
     */
    endBattle(result, returnParams = {}) { 
        if (this.battleEnded) {
            console.warn(`BattleScene: バトル終了処理が複数回呼ばれました (結果: ${result})。スキップします。`);
            return;
        }
        this.battleEnded = true; 

        console.log(`BattleScene: バトル終了。結果: ${result}`);
        
        this.input.enabled = false;

        // ボタンのリスナーはcreate()内の無効化で十分だが、念のためここでも解除
        if (this.winButton) { this.winButton.off('pointerdown'); }
        if (this.loseButton) { this.loseButton.off('pointerdown'); }

        if (result === 'win') {
            // 勝利時: ノベルパートへ戻る
            // ★★★ イベントがまだ発行されていない場合のみ発行 ★★★
            if (!this.eventEmitted) {
                this.eventEmitted = true; 
                this.scene.get('SystemScene').events.emit('return-to-novel', {
                    from: this.scene.key,
                    params: returnParams 
                });
            } else {
                console.warn("BattleScene: return-to-novel イベントは既に発行されています。スキップします。");
            }
        } else {
            // 敗北時: ゲームオーバー処理
            console.log("BattleScene: ゲームオーバー処理を開始します。");
            
            this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, 'GAME OVER', {
                fontSize: '64px', fill: '#f00', stroke: '#000', strokeThickness: 5
            }).setOrigin(0.5).setDepth(999);

            this.retryButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 'もう一度挑戦', {
                fontSize: '32px', fill: '#fff', backgroundColor: '#880000', padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(999);

            this.titleButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 120, 'タイトルに戻る', {
                fontSize: '32px', fill: '#fff', backgroundColor: '#444444', padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(999);

            // ★★★ 修正箇所: ゲームオーバー画面のボタンにも入力無効化を追加 ★★★
            this.retryButton.on('pointerdown', () => {
                if (this.retryButton) this.retryButton.disableInteractive();
                if (this.titleButton) this.titleButton.disableInteractive();
                
                // ★★★ イベントがまだ発行されていない場合のみ発行 ★★★
                if (!this.eventEmitted) {
                    this.eventEmitted = true;
                    console.log("BattleScene: もう一度挑戦します。");
                    this.scene.get('SystemScene').events.emit('request-scene-transition', {
                        to: this.scene.key, 
                        from: this.scene.key, 
                        params: this.initialBattleParams 
                    });
                } else {
                    console.warn("BattleScene: request-scene-transition イベントは既に発行されています。スキップします。");
                }
            });

            this.titleButton.on('pointerdown', () => {
                if (this.retryButton) this.retryButton.disableInteractive();
                if (this.titleButton) this.titleButton.disableInteractive();

                // ★★★ イベントがまだ発行されていない場合のみ発行 ★★★
                if (!this.eventEmitted) {
                    this.eventEmitted = true;
                    console.log("BattleScene: タイトルに戻ります。");
                    this.scene.get('SystemScene').events.emit('return-to-novel', {
                        from: this.scene.key,
                        params: returnParams 
                    });
                } else {
                    console.warn("BattleScene: return-to-novel イベントは既に発行されています。スキップします。");
                }
            });
        }
    }
}