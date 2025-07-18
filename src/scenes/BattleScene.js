// src/scenes/BattleScene.js

import HpBar from '../ui/HpBar.js'; 
import CoinHud from '../ui/CoinHud.js'; 
import StateManager from '../core/StateManager.js'; 

export default class BattleScene extends Phaser.Scene {
    constructor() {
        super('BattleScene');
        this.receivedParams = null; // ノベルから渡されたパラメータ
        this.initialBattleParams = null; // リトライ機能で使う初期パラメータ
        this.battleEnded = false; // endBattleメソッドの二重呼び出し防止フラグ
        this.eventEmitted = false; // ★SystemSceneへのイベント発行済みフラグ★
        
        // UI要素への参照をプロパティとして初期化 (ゲームオーバー画面用、およびボタン破壊用)
        this.winButton = null;
        this.loseButton = null;
        this.gameOverText = null;
        this.retryButton = null;
        this.titleButton = null;
    }

    init(data) {
        // ノベルパートから渡されたパラメータを受け取る
        // data.transitionParams が undefined の場合を考慮して {} をデフォルトとする
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
        this.eventEmitted = false; // ★イベント発行済みフラグもリセット★
    }

    create() {
        console.log("BattleScene: create 開始");
        this.cameras.main.setBackgroundColor('#8a2be2');

        // GameSceneのStateManagerへの参照を取得
        // GameSceneは常時アクティブなベースシーンなので、getで取得
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.stateManager) {
            this.stateManager = gameScene.stateManager;
        } else {
            console.error("BattleScene: GameSceneのStateManagerが見つかりません。ゲーム変数は更新できません。");
        }

        // プレイヤーと敵のプレースホルダーテキスト
        this.add.text(100, 360, 'PLAYER', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(this.scale.width - 100, 360, 'ENEMY', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);

        // HPバーのインスタンス化と初期設定
        this.playerHpBar = new HpBar(this, 20, 20, 250, 30, 'player');
        this.enemyHpBar = new HpBar(this, this.scale.width - 20, 20, 250, 30, 'enemy');
        this.enemyHpBar.x -= this.enemyHpBar.barWidth; // 右寄せ

        // StateManagerのf変数にHP値を設定
        this.stateManager.f.player_max_hp = this.initialBattleParams.initialPlayerMaxHp; 
        this.stateManager.f.player_hp = this.initialBattleParams.initialPlayerHp;
        this.playerHpBar.setHp(this.stateManager.f.player_hp, this.stateManager.f.player_max_hp);

        this.stateManager.f.enemy_max_hp = 500;
        this.stateManager.f.enemy_hp = 500;
        this.enemyHpBar.setHp(this.stateManager.f.enemy_hp, this.stateManager.f.enemy_max_hp);

        // コインHUDのインスタンス化と初期設定
        this.coinHud = new CoinHud(this, 100, 50);
        this.coinHud.setCoin(this.initialBattleParams.initialCoin);

        // --- テスト用のバトル進行ボタン ---
        this.winButton = this.add.text(320, 600, '勝利してノベルパートに戻る', { fontSize: '32px', fill: '#0c0', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        this.winButton.on('pointerdown', () => {
            // ★クリック時にボタンの入力を即座に無効化★
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
            // ★クリック時にボタンの入力を即座に無効化★
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

    // start/stop/resume はPhaserのシーンライフサイクルメソッド。
    // SystemSceneがシーンの起動/停止/再開を管理するので、ここではログ出しのみ。
    start() {
        super.start();
        console.log("BattleScene: start されました。");
    }

    stop() {
        super.stop();
        console.log("BattleScene: stop されました。");
        // ★シーン停止時に、生成したUIオブジェクトをすべて破棄する★
        // これにより、シーンが再起動されたときにUIが重複して作成されるのを防ぐ
        if (this.playerHpBar) { this.playerHpBar.destroy(); this.playerHpBar = null; }
        if (this.enemyHpBar) { this.enemyHpBar.destroy(); this.enemyHpBar = null; }
        if (this.coinHud) { this.coinHud.destroy(); this.coinHud = null; } // CoinHudも破棄すべき

        // ゲームオーバーUIも停止時に破棄
        if (this.gameOverText) { this.gameOverText.destroy(); this.gameOverText = null; }
        if (this.retryButton) { this.retryButton.off('pointerdown'); this.retryButton.destroy(); this.retryButton = null; }
        if (this.titleButton) { this.titleButton.off('pointerdown'); this.titleButton.destroy(); this.titleButton = null; }
    }

    resume() {
        super.resume(); // 親のresumeを呼び出す
        console.log("BattleScene: resume されました。入力を再有効化します。");
        // SystemSceneが責任を持つので、ここで this.input.enabled = true; は不要だが、
        // 万が一のフェールセーフとして残しても良い（ただし重複注意）
        // this.input.enabled = true;
    }

    /**
     * バトルを終了し、結果に応じて次のシーンへ遷移する
     * @param {string} result - 'win' or 'lose'
     * @param {Object} [returnParams] - GameSceneに引き渡す変数オブジェクト (optional)
     */
    endBattle(result, returnParams = {}) { 
        // バトル終了処理が複数回呼ばれるのを防ぐためのフラグ
        if (this.battleEnded) {
            console.warn(`BattleScene: バトル終了処理が複数回呼ばれました (結果: ${result})。スキップします。`);
            return;
        }
        this.battleEnded = true; // 終了処理開始フラグを立てる

        console.log(`BattleScene: バトル終了。結果: ${result}`);
        
        // まず入力を完全に無効化し、誤操作を防ぐ
        this.input.enabled = false;

        // 勝利/敗北ボタンのリスナーを解除し、オブジェクトも破棄
        if (this.winButton) { this.winButton.off('pointerdown'); this.winButton.destroy(); this.winButton = null; }
        if (this.loseButton) { this.loseButton.off('pointerdown'); this.loseButton.destroy(); this.loseButton = null; }


        if (result === 'win') {
            // 勝利時: ノベルパートへ戻る
            // ★★★ イベントがまだ発行されていない場合のみ発行 ★★★
            if (!this.eventEmitted) {
                this.eventEmitted = true; // フラグを立てる
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
            
            // ゲームオーバー画面UIを生成
            this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, 'GAME OVER', {
                fontSize: '64px', fill: '#f00', stroke: '#000', strokeThickness: 5
            }).setOrigin(0.5).setDepth(999);

            this.retryButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 'もう一度挑戦', {
                fontSize: '32px', fill: '#fff', backgroundColor: '#880000', padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(999);

            this.titleButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 120, 'タイトルに戻る', {
                fontSize: '32px', fill: '#fff', backgroundColor: '#444444', padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(999);

            // 各ボタンにイベントリスナーを設定
            this.retryButton.on('pointerdown', () => {
                // クリック時に両方のボタン入力を即座に無効化
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
                    console.warn("BattleScene: request-scene-transition 勝ちイベントは既に発行されています。スキップします。");
                }
            });

            this.titleButton.on('pointerdown', () => {
                // クリック時に両方のボタン入力を即座に無効化
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
                    console.warn("BattleScene: return-to-novel 負けイベントは既に発行されています。スキップします。");
                }
            });
        }
    }
}
