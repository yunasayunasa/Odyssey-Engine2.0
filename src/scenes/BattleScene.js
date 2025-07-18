// src/scenes/ActionScene.js (改造版 - リアルタイムHUD更新、ゲームオーバーボタン修正)

import HpBar from '../ui/HpBar.js';
import CoinHud from '../ui/CoinHud.js';
import { ITEM_DATA } from '../core/ItemData.js';
export default class BattleScene extends Phaser.Scene {
    constructor() {
        super('BattleScene');
        this.receivedParams = null;
        this.stateManager = null;
        this.playerHpBar = null;
        this.enemyHpBar = null;
        this.coinHud = null;

           // ★★★ バックパック関連のプロパティを追加 ★★★
        this.backpackGridSize = 6;
        this.cellSize = 60;
        this.gridX = 0;
        this.gridY = 0;
        this.backpack = null; // バックパックのグリッドデータを保持する2次元配列
        this.inventoryItems = []; // インベントリのアイテムオブジェクト

        this.initialBattleParams = null;
        this.battleEnded = false; 

        this.winButton = null;
        this.loseButton = null;
        this.retryButton = null;
        this.titleButton = null;
        this.gameOverText = null;
        this.onFVariableChangedListener = null;
    }

    init(data) {
        this.receivedParams = data.transitionParams || {}; 
        console.log("ActionScene (as BattleScene): init 完了。受け取ったパラメータ:", this.receivedParams);

        this.initialBattleParams = {
            playerLevel: this.receivedParams.player_level || 1,
            playerName: this.receivedParams.player_name || 'プレイヤー',
            initialCoin: this.receivedParams.current_coin || 0,
            initialPlayerMaxHp: this.receivedParams.player_max_hp || 100, 
            initialPlayerHp: this.receivedParams.player_hp || this.receivedParams.player_max_hp || 100, 
        };
        console.log("ActionScene (as BattleScene): 初期バトルパラメータ:", this.initialBattleParams);

        this.battleEnded = false; 
    }

    create() {
        console.log("ActionScene (as BattleScene): create 開始");
        this.cameras.main.setBackgroundColor('#8a2be2');

        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.stateManager) {
            this.stateManager = gameScene.stateManager;
        } else {
            console.error("ActionScene (as BattleScene): GameSceneのStateManagerが見つかりません。ゲーム変数は更新できません。");
        }

        this.add.text(100, 360, 'PLAYER', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(this.scale.width - 100, 360, 'ENEMY', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);

        this.playerHpBar = new HpBar(this, 20, 20, 250, 30, 'player');
        this.enemyHpBar = new HpBar(this, this.scale.width - 20, 20, 250, 30, 'enemy');
        this.enemyHpBar.x -= this.enemyHpBar.barWidth;
        this.coinHud = new CoinHud(this, 100, 50);

        // HUDの初期値設定
        this.playerHpBar.setHp(this.initialBattleParams.initialPlayerHp, this.initialBattleParams.initialPlayerMaxHp);
        this.enemyHpBar.setHp(this.stateManager.f.enemy_hp || 500, this.stateManager.f.enemy_max_hp || 500);
        this.coinHud.setCoin(this.initialBattleParams.initialCoin);

        // ★★★ StateManagerからのイベントでHUDを更新するリスナーを登録 ★★★
        this.onFVariableChangedListener = this.onFVariableChanged.bind(this);
        this.stateManager.events.on('f-variable-changed', this.onFVariableChangedListener);

        // ★★★ バックパックのグリッド表示 ★★★
           this.backpackGridSize = 6;
        this.cellSize = 60;
        this.gridWidth = this.backpackGridSize * this.cellSize;
        this.gridHeight = this.backpackGridSize * this.cellSize;
        this.gridX = this.scale.width / 2 - this.gridWidth / 2;
        this.gridY = this.scale.height / 2 - this.gridHeight / 2 + 50;

        // グリッド背景
        this.add.rectangle(this.gridX + this.gridWidth / 2, this.gridY + this.gridHeight / 2, this.gridWidth, this.gridHeight, 0x333333, 0.9)
            .setOrigin(0.5).setDepth(10);
        // グリッド線
        for (let i = 0; i <= this.backpackGridSize; i++) {
            this.add.line(0, 0, this.gridX, this.gridY + i * this.cellSize, this.gridX + this.gridWidth, this.gridY + i * this.cellSize, 0x666666, 0.5).setOrigin(0).setDepth(11);
            this.add.line(0, 0, this.gridX + i * this.cellSize, this.gridY, this.gridX + i * this.cellSize, this.gridY + this.gridHeight, 0x666666, 0.5).setOrigin(0).setDepth(11);
        }

        // ★★★ バックパックのデータ構造を初期化 (0で埋める) ★★★
        this.backpack = Array(this.backpackGridSize).fill(null).map(() => Array(this.backpackGridSize).fill(0));


        // ★★★ インベントリの表示 ★★★
        const inventoryX = this.gridX - 180;
        const inventoryY = this.gridY;
        const inventoryWidth = 150;
        const inventoryHeight = this.gridHeight;
        this.add.rectangle(inventoryX + inventoryWidth / 2, inventoryY + inventoryHeight / 2, inventoryWidth, inventoryHeight, 0x555555, 0.8).setOrigin(0.5).setDepth(10);
        this.add.text(inventoryX + inventoryWidth / 2, inventoryY + 20, 'インベントリ', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5).setDepth(11);

        // ★★★ テスト用のアイテムをインベントリに生成 ★★★
        const initialInventory = ['sword', 'shield', 'potion']; // 本来はノベルパートから渡される
        let itemY = inventoryY + 70;
        initialInventory.forEach(itemId => {
            this.createItem(itemId, inventoryX + inventoryWidth / 2, itemY);
            itemY += 80; // アイテム間のスペース
        });


        // --- テスト用のバトル進行ボタン ---
        this.winButton = this.add.text(320, 600, '勝利してノベルパートに戻る', { fontSize: '32px', fill: '#0c0', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.winButton.on('pointerdown', () => this.endBattle('win'));

        this.loseButton = this.add.text(this.scale.width - 320, 600, '敗北してゲームオーバー', { fontSize: '32px', fill: '#c00', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.loseButton.on('pointerdown', () => this.endBattle('lose'));

        console.log("ActionScene (as BattleScene): create 完了");
    }

       // ★★★ アイテムを生成し、ドラッグ可能にするメソッド ★★★
    createItem(itemId, x, y) {
        const itemData = ITEM_DATA[itemId];
        if (!itemData) return;

        // アイテム画像を作成
        const itemImage = this.add.image(x, y, itemData.storage)
            .setInteractive() // クリック可能にする
            .setData('itemId', itemId); // データをセット

        this.input.setDraggable(itemImage); // ドラッグ可能にする

        // ★ ドラッグ開始時のイベント
        itemImage.on('dragstart', (pointer, dragX, dragY) => {
            itemImage.setDepth(200); // ドラッグ中は最前面に
        });

        // ★ ドラッグ中のイベント
        itemImage.on('drag', (pointer, dragX, dragY) => {
            itemImage.setPosition(dragX, dragY);
        });

        // ★ ドラッグ終了時のイベント
        itemImage.on('dragend', (pointer, dragX, dragY, dropped) => {
            itemImage.setDepth(100); // 深度を戻す

            // グリッド座標に変換
            const gridCol = Math.floor((pointer.x - this.gridX) / this.cellSize);
            const gridRow = Math.floor((pointer.y - this.gridY) / this.cellSize);

            // グリッド内にドロップされたかチェック
            if (gridCol >= 0 && gridCol < this.backpackGridSize && gridRow >= 0 && gridRow < this.backpackGridSize) {
                // TODO: 配置可能かチェック (重なりなど)

                // マス目にスナップさせる
                itemImage.x = this.gridX + gridCol * this.cellSize + (itemImage.width * itemImage.scaleX / 2);
                itemImage.y = this.gridY + gridRow * this.cellSize + (itemImage.height * itemImage.scaleY / 2);
                console.log(`アイテム[${itemId}]をグリッド(${gridCol}, ${gridRow})に配置`);
            } else {
                // グリッド外なら元の位置に戻す (インベントリ)
                // TODO: 元の位置を保存しておき、そこに戻す
                itemImage.x = x;
                itemImage.y = y;
            }
        });
    }


    stop() {
        super.stop();
        // StateManagerのイベントリスナーを解除
        if (this.stateManager && this.onFVariableChangedListener) {
            this.stateManager.events.off('f-variable-changed', this.onFVariableChangedListener);
            this.onFVariableChangedListener = null;
        }
        
        // ボタンのイベントリスナーも解除し、オブジェクトも破棄
        if (this.winButton) { this.winButton.off('pointerdown'); this.winButton.destroy(); this.winButton = null; }
        if (this.loseButton) { this.loseButton.off('pointerdown'); this.loseButton.destroy(); this.loseButton = null; }
        if (this.retryButton) { this.retryButton.off('pointerdown'); this.retryButton.destroy(); this.retryButton = null; }
        if (this.titleButton) { this.titleButton.off('pointerdown'); this.titleButton.destroy(); this.titleButton = null; }
        if (this.gameOverText) { this.gameOverText.destroy(); this.gameOverText = null; } 

        console.log("ActionScene (as BattleScene): stop されました。リスナーを解除。");
    }

    onFVariableChanged(key, value) {
        if (key === 'coin' && this.coinHud && this.coinHud.coinText.text !== value.toString()) {
            this.coinHud.setCoin(value);
        } else if (key === 'player_hp' && this.playerHpBar) {
            const maxHp = this.stateManager.f.player_max_hp || 100;
             this.playerHpBar.setHp(value, maxHp);
        } else if (key === 'player_max_hp' && this.playerHpBar) {
             const currentHp = this.stateManager.f.player_hp || 0;
             this.playerHpBar.setHp(currentHp, value);
        } else if (key === 'enemy_hp' && this.enemyHpBar) {
            const maxHp = this.stateManager.f.enemy_max_hp || 500;
            this.enemyHpBar.setHp(value, maxHp);
        }
    }

    endBattle(result) {
        if (this.battleEnded) return;
        this.battleEnded = true;

        console.log(`ActionScene (as BattleScene): バトル終了。結果: ${result}`);
        
        // ★★★ 既存の勝利/敗北ボタンを無効化・破棄 ★★★
        this.input.enabled = false;
        if (this.winButton) { this.winButton.destroy(); this.winButton = null; }
        if (this.loseButton) { this.loseButton.destroy(); this.loseButton = null; }

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
            // ★★★ 敗北時: ゲームオーバー処理 ★★★
            console.log("ActionScene (as BattleScene): ゲームオーバー処理を開始します。");
            
            this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, 'GAME OVER', { fontSize: '64px', fill: '#f00', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(999);
            this.retryButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 'もう一度挑戦', { fontSize: '32px', fill: '#fff', backgroundColor: '#880000', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(999);
            this.titleButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 120, 'タイトルに戻る', { fontSize: '32px', fill: '#fff', backgroundColor: '#444444', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(999);
            
            // ★★★ 修正箇所: 新しいボタンを有効化するため、シーンの入力を再度有効化 ★★★
            this.input.enabled = true;

            this.retryButton.on('pointerdown', () => {
                this.input.enabled = false;
                this.scene.get('SystemScene').events.emit('request-scene-transition', {
                    to: this.scene.key,
                    from: this.scene.key,
                    params: this.initialBattleParams
                });
            });

            this.titleButton.on('pointerdown', () => {
                this.input.enabled = false;
                this.scene.get('SystemScene').events.emit('return-to-novel', {
                    from: this.scene.key,
                    params: { 'f.battle_result': 'game_over' }
                });
            });
        }
    }

    resume() {
        console.log("ActionScene (as BattleScene): resume されました。入力を再有効化します。");
        this.input.enabled = true;
    }
}
