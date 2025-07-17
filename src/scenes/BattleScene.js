// src/scenes/BattleScene.js (新規作成)

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

        // ★★★ この試合の初期状態を保持するプロパティ ★★★
        this.initialBattleParams = null; 
    }

    init(data) {
        // ノベルパートから渡されたパラメータを受け取る
        this.receivedParams = data.transitionParams || {};
        console.log("BattleScene: init 完了。受け取ったパラメータ:", this.receivedParams);

        // ★★★ この試合の初期状態を保持する (リトライ用) ★★★
        // 実際には、プレイヤーの初期HP, 初期アイテムリストなどをここに保存
        this.initialBattleParams = {
            playerLevel: this.receivedParams.player_level || 1,
            playerName: this.receivedParams.player_name || 'プレイヤー',
            initialCoin: this.receivedParams.current_coin || 0,
            // ... 他の初期アイテムリストなど、ノベルから渡されるべき情報
        };
        console.log("BattleScene: 初期バトルパラメータ:", this.initialBattleParams);
    }

    create() {
        console.log("BattleScene: create 開始");
        this.cameras.main.setBackgroundColor('#8a2be2'); // バトルシーンの色 (紫)

        // ★★★ StateManagerへの参照を取得 (ゲーム変数f.player_hpなどを更新するため) ★★★
        // GameSceneは常駐しているので、そこからStateManagerを取得
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.stateManager) {
            this.stateManager = gameScene.stateManager;
        } else {
            console.error("BattleScene: GameSceneのStateManagerが見つかりません。ゲーム変数は更新できません。");
        }

        // --- プレイヤーと敵のプレースホルダー ---
        this.add.text(100, 360, 'PLAYER', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(this.scale.width - 100, 360, 'ENEMY', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);

        // --- HPバーHUDのインスタンス化と初期設定 ---
        this.playerHpBar = new HpBar(this, 20, 20, 250, 30, 'player');
        this.enemyHpBar = new HpBar(this, this.scale.width - 20, 20, 250, 30, 'enemy');
        this.enemyHpBar.x -= this.enemyHpBar.barWidth; // 右寄せ
        
        // ★★★ HPバーの初期値設定 (f変数から取得) ★★★
        // プレイヤーHPの初期化
        this.stateManager.f.player_max_hp = this.stateManager.f.player_max_hp || 100; // ノベル側で設定されるべき
        this.stateManager.f.player_hp = this.stateManager.f.player_hp || this.stateManager.f.player_max_hp;
        this.playerHpBar.setHp(this.stateManager.f.player_hp, this.stateManager.f.player_max_hp);

        // 敵HPの初期化 (BattleSceneのロジックで設定されるべきだが、テスト用に固定値)
        this.stateManager.f.enemy_max_hp = 500;
        this.stateManager.f.enemy_hp = 500;
        this.enemyHpBar.setHp(this.stateManager.f.enemy_hp, this.stateManager.f.enemy_max_hp);

        // --- コインHUDのインスタンス化と初期設定 ---
        this.coinHud = new CoinHud(this, 100, 50); // GameSceneと同じ位置
        if (this.initialBattleParams) {
             this.coinHud.setCoin(this.initialBattleParams.initialCoin);
        }

        // ★★★ updateイベントでHUDを更新 ★★★
        this.events.on('update', this.updateAllHud, this);

        // --- テスト用のバトル進行ボタン ---
        const winButton = this.add.text(320, 600, '勝利してノベルパートに戻る', { fontSize: '32px', fill: '#0c0', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        winButton.on('pointerdown', () => this.endBattle('win'));

        const loseButton = this.add.text(this.scale.width - 320, 600, '敗北してゲームオーバー', { fontSize: '32px', fill: '#c00', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        loseButton.on('pointerdown', () => this.endBattle('lose'));

        console.log("BattleScene: create 完了");
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
            // ★★★ 勝利時: ノベルパートへ戻る ★★★
            this.scene.get('SystemScene').events.emit('return-to-novel', {
                from: this.scene.key,
                params: { 
                    'f.battle_result': 'win',
                    'f.player_hp': this.stateManager.f.player_hp, // 最終HPをノベルに戻す
                    'f.coin': this.stateManager.f.coin // 最終コイン数をノベルに戻す
                    // ... 取得アイテムなど
                }
            });
        } else {
            // ★★★ 敗北時: ゲームオーバー処理 ★★★
            console.log("BattleScene: ゲームオーバー処理を開始します。");
            
            // 入力を一時的に無効化し、誤操作を防ぐ
            this.input.enabled = false;

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
                // 現在のシーンを停止し、初期パラメータで再起動
                this.scene.stop();
                this.scene.start(this.scene.key, { transitionParams: this.initialBattleParams });
            });

            titleButton.on('pointerdown', () => {
                console.log("BattleScene: タイトルに戻ります。");
                // TODO: タイトルシーンへのジャンプロジック
                // this.scene.stop();
                // this.scene.start('TitleScene'); // TitleSceneがあれば
                // 一旦GameSceneの頭に戻る代替処理
                this.scene.get('SystemScene').events.emit('return-to-novel', {
                    from: this.scene.key,
                    params: { 'f.battle_result': 'game_over' } // ゲームオーバー結果を渡す
                });
            });
        }
    }

    resume() {
        console.log("BattleScene: resume されました。入力を再有効化します。");
        this.input.enabled = true;
    }
}
