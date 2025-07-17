// src/scenes/BattleScene.js

import HpBar from '../ui/HpBar.js'; // HPバーHUDのインポート
import CoinHud from '../ui/CoinHud.js'; // コインHUDもインポート
import StateManager from '../core/StateManager.js'; // StateManagerも使用

export default class BattleScene extends Phaser.Scene {
    constructor() {
        super('BattleScene');
        this.receivedParams = null; // ノベルから渡されたパラメータ
        this.stateManager = null;   // StateManagerへの参照
        this.playerHpBar = null;    // プレイヤーHPバー
        this.enemyHpBar = null;     // 敵HPバー
        this.coinHud = null;        // コインHUD

        // この試合の初期状態を保持するプロパティ
        this.initialBattleParams = null; 

        // バトル終了処理が複数回呼ばれるのを防ぐためのフラグ
        this.battleEnded = false; 
        
        // シーン内のボタンの参照を保持 (イベントリスナー解除用)
        this.winButton = null;
        this.loseButton = null;
        this.retryButton = null;
        this.titleButton = null;
        this.gameOverText = null; // ゲームオーバーテキストも保持
    }

    init(data) {
        // ノベルパートから渡されたパラメータを受け取る
        this.receivedParams = data.transitionParams || {};
        console.log("BattleScene: init 完了。受け取ったパラメータ:", this.receivedParams);

        // この試合の初期状態を保持する (リトライ用)
        this.initialBattleParams = {
            playerLevel: this.receivedParams.player_level || 1,
            playerName: this.receivedParams.player_name || 'プレイヤー',
            initialCoin: this.receivedParams.current_coin || 0,
            initialPlayerMaxHp: this.receivedParams.player_max_hp || 100,
            initialPlayerHp: this.receivedParams.player_hp || this.receivedParams.player_max_hp || 100,
        };
        console.log("BattleScene: 初期バトルパラメータ:", this.initialBattleParams);

        // シーンが再利用される可能性があるため、init時にbattleEndedフラグをリセット
        this.battleEnded = false; 
    }

    create() {
        console.log("BattleScene: create 開始");
        this.cameras.main.setBackgroundColor('#8a2be2'); // バトルシーンの色 (紫)

        // StateManagerへの参照を取得 (GameSceneは常駐しているので、そこからStateManagerを取得)
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.stateManager) {
            this.stateManager = gameScene.stateManager;
        } else {
            console.error("BattleScene: GameSceneのStateManagerが見つかりません。ゲーム変数は更新できません。");
        }

        // プレイヤーと敵のプレースホルダー
        this.add.text(100, 360, 'PLAYER', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(this.scale.width - 100, 360, 'ENEMY', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);

        // HPバーHUDのインスタンス化と初期設定
        this.playerHpBar = new HpBar(this, 20, 20, 250, 30, 'player');
        this.enemyHpBar = new HpBar(this, this.scale.width - 20, 20, 250, 30, 'enemy');
        this.enemyHpBar.x -= this.enemyHpBar.barWidth; // 右寄せ
        
        // HPバーの初期値設定 (f変数から取得)
        this.stateManager.f.player_max_hp = this.initialBattleParams.initialPlayerMaxHp; 
        this.stateManager.f.player_hp = this.initialBattleParams.initialPlayerHp;
        this.playerHpBar.setHp(this.stateManager.f.player_hp, this.stateManager.f.player_max_hp);

        // 敵HPの初期化 (BattleSceneのロジックで設定されるべきだが、テスト用に固定値)
        this.stateManager.f.enemy_max_hp = 500;
        this.stateManager.f.enemy_hp = 500;
        this.enemyHpBar.setHp(this.stateManager.f.enemy_hp, this.stateManager.f.enemy_max_hp);

        // コインHUDのインスタンス化と初期設定
        this.coinHud = new CoinHud(this, 100, 50); // GameSceneと同じ位置
        this.coinHud.setCoin(this.initialBattleParams.initialCoin);

        // --- テスト用のバトル進行ボタン ---
        // ボタンの参照をクラスプロパティに保存し、イベントリスナーを登録
        this.winButton = this.add.text(320, 600, '勝利してノベルパートに戻る', { fontSize: '32px', fill: '#0c0', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.winButton.on('pointerdown', () => this.endBattle('win'));

        this.loseButton = this.add.text(this.scale.width - 320, 600, '敗北してゲームオーバー', { fontSize: '32px', fill: '#c00', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.loseButton.on('pointerdown', () => this.endBattle('lose'));

        console.log("BattleScene: create 完了");
    }

    // ★★★ startライフサイクルメソッドを追加 (updateリスナー登録用) ★★★
    start() {
        super.start(); // Phaser.Sceneのstartメソッドを呼び出す

        // updateイベントリスナーをここで登録する
        this.events.on('update', this.updateAllHud, this);
        console.log("BattleScene: start されました。updateリスナーを登録。");
    }

    // ★★★ stopライフサイクルメソッドを追加 (updateリスナー解除用) ★★★
    stop() {
        super.stop(); // Phaser.Sceneのstopメソッドを呼び出す

        // updateリスナーをここで解除する
        this.events.off('update', this.updateAllHud, this);
        
        // ボタンのイベントリスナーも解除し、オブジェクトも破棄
        if (this.winButton) { this.winButton.off('pointerdown'); this.winButton.destroy(); this.winButton = null; }
        if (this.loseButton) { this.loseButton.off('pointerdown'); this.loseButton.destroy(); this.loseButton = null; }
        if (this.retryButton) { this.retryButton.off('pointerdown'); this.retryButton.destroy(); this.retryButton = null; }
        if (this.titleButton) { this.titleButton.off('pointerdown'); this.titleButton.destroy(); this.titleButton = null; }
        if (this.gameOverText) { this.gameOverText.destroy(); this.gameOverText = null; } // ゲームオーバーテキストも破棄

        console.log("BattleScene: stop されました。update/ボタンリスナーを解除。");
    }

    // ★★★ 全てのHUDを更新する共通メソッド ★★★
    updateAllHud() {
        if (!this.stateManager) return; 
        
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
                params: { 
                    'f.battle_result': 'win',
                    'f.player_hp': this.stateManager.f.player_hp,
                    'f.coin': this.stateManager.f.coin
                }
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
            // ★★★ この時点で input.enabled は endBattle の最初で false になっているはずだが、念のため ★★★
            // this.input.enabled = false; // endBattleの冒頭で実施済み

            this.retryButton.on('pointerdown', () => {
                console.log("BattleScene: もう一度挑戦します。");
                // リトライボタンが押されたら、もう他のイベントは発火しないようにする
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
                // タイトルボタンが押されたら、もう他のイベントは発火しないようにする
                this.input.enabled = false;
                // SystemSceneを経由してGameSceneの頭に戻る
                this.scene.get('SystemScene').events.emit('return-to-novel', {
                    from: this.scene.key,
                    params: { 'f.battle_result': 'game_over' }
                });
            });
        }
    }

    // resumeライフサイクルメソッド
    resume() {
        console.log("BattleScene: resume されました。入力を再有効化します。");
        this.input.enabled = true;
    }
}