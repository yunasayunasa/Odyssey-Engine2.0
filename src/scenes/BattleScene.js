
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

        this.backpackGridSize = 6;
        this.cellSize = 60;
        this.gridX = 0;
        this.gridY = 0;
        this.backpack = null;
        this.inventoryItems = [];

        this.initialBattleParams = null;
        this.battleEnded = false; 
        this.battleLogText = null;

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

        // ★★★ 修正箇所: f変数を明確に初期化してから、HUDの表示を設定 ★★★
        // プレイヤーHPの初期化
        this.stateManager.f.player_max_hp = this.initialBattleParams.initialPlayerMaxHp; 
        this.stateManager.f.player_hp = this.initialBattleParams.initialPlayerHp;
        this.playerHpBar.setHp(this.stateManager.f.player_hp, this.stateManager.f.player_max_hp);

        // 敵HPの初期化
        this.stateManager.f.enemy_max_hp = 500; // この戦闘での敵の最大HP
        this.stateManager.f.enemy_hp = 500; // この戦闘での敵の現在HP
        this.enemyHpBar.setHp(this.stateManager.f.enemy_hp, this.stateManager.f.enemy_max_hp);

        // コインHUDの初期化
        this.coinHud.setCoin(this.initialBattleParams.initialCoin);

        this.onFVariableChangedListener = this.onFVariableChanged.bind(this);
        this.stateManager.events.on('f-variable-changed', this.onFVariableChangedListener);

        // バックパックのグリッド表示
        this.backpackGridSize = 6;
        this.cellSize = 60;
        this.gridWidth = this.backpackGridSize * this.cellSize;
        this.gridHeight = this.backpackGridSize * this.cellSize;
        this.gridX = this.scale.width / 2 - this.gridWidth / 2;
        this.gridY = this.scale.height / 2 - this.gridHeight / 2 + 50;

        this.add.rectangle(this.gridX + this.gridWidth / 2, this.gridY + this.gridHeight / 2, this.gridWidth, this.gridHeight, 0x333333, 0.9).setOrigin(0.5).setDepth(10);
        for (let i = 0; i <= this.backpackGridSize; i++) {
            this.add.line(0, 0, this.gridX, this.gridY + i * this.cellSize, this.gridX + this.gridWidth, this.gridY + i * this.cellSize, 0x666666, 0.5).setOrigin(0).setDepth(11);
            this.add.line(0, 0, this.gridX + i * this.cellSize, this.gridY, this.gridX + i * this.cellSize, this.gridY + this.gridHeight, 0x666666, 0.5).setOrigin(0).setDepth(11);
        }

        this.backpack = Array(this.backpackGridSize).fill(null).map(() => Array(this.backpackGridSize).fill(0));

        // インベントリの表示
        const inventoryX = this.gridX - 180;
        const inventoryY = this.gridY;
        const inventoryWidth = 150;
        const inventoryHeight = this.gridHeight;
        this.add.rectangle(inventoryX + inventoryWidth / 2, inventoryY + inventoryHeight / 2, inventoryWidth, inventoryHeight, 0x555555, 0.8).setOrigin(0.5).setDepth(10);
        this.add.text(inventoryX + inventoryWidth / 2, inventoryY + 20, 'インベントリ', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5).setDepth(11);

        const initialInventory = ['sword', 'shield', 'potion'];
        let itemY = inventoryY + 70;
        initialInventory.forEach(itemId => {
            this.createItem(itemId, inventoryX + inventoryWidth / 2, itemY);
            itemY += 80;
        });

        // 「戦闘開始」ボタン
        const startBattleButton = this.add.text(this.gridX - 105, this.gridY + this.gridHeight - 30, '戦闘開始', {
            fontSize: '28px',
            fill: '#fff',
            backgroundColor: '#008800',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(11);
        startBattleButton.on('pointerdown', () => this.startBattle());
        
        // 戦闘ログ表示用のテキストオブジェクト
        this.battleLogText = this.add.text(this.scale.width / 2, 150, '', {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 10, y: 10 },
            align: 'center',
            wordWrap: { width: 400 }
        }).setOrigin(0.5).setDepth(200);

        console.log("ActionScene (as BattleScene): create 完了");
    }

     // ★★★ startBattle メソッドを置き換え ★★★
    startBattle() {
        console.log("戦闘開始！");
        this.input.enabled = false;

        // --- 1. ステータス算出 ---
        let playerStats = { 
            attack: 5, 
            defense: 0, 
            // ★ StateManagerのf変数を直接参照
            hp: this.stateManager.f.player_hp 
        };
        let enemyStats = { 
            attack: 20, 
            defense: 0, 
            // ★ StateManagerのf変数を直接参照
            hp: this.stateManager.f.enemy_hp 
        };


        // backpack配列を走査してアイテムの効果を合算
        const processedItems = new Set();
        for (let r = 0; r < this.backpackGridSize; r++) {
            for (let c = 0; c < this.backpackGridSize; c++) {
                const itemId = this.backpack[r][c];
                if (itemId !== 0) {
                    const uniqueCellId = `${itemId}-${r}-${c}`; // アイテムの重複カウントを防ぐため
                    if (!processedItems.has(uniqueCellId)) {
                        const itemData = ITEM_DATA[itemId];
                        if (itemData && itemData.effects) {
                            playerStats.attack += itemData.effects.attack || 0;
                            playerStats.defense += itemData.effects.defense || 0;
                            processedItems.add(uniqueCellId);
                        }
                    }
                }
            }
        }
        console.log(`プレイヤー最終ステータス: 攻撃=${playerStats.attack}, 防御=${playerStats.defense}`);
        this.addToBattleLog(`あなたのステータス: 攻撃=${playerStats.attack}, 防御=${playerStats.defense}`);
        
          console.log(`プレイヤー最終ステータス: 攻撃=${playerStats.attack}, 防御=${playerStats.defense}`);
        this.addToBattleLog(`あなたのステータス: 攻撃=${playerStats.attack}, 防御=${playerStats.defense}`);
        
        // --- 2. バトルループの開始 ---
        const executeTurn = (turn) => {
            console.log(`--- Turn ${turn} ---`);

            // プレイヤーのターン
            this.time.delayedCall(1000, () => {
                const playerDamage = Math.max(0, playerStats.attack - enemyStats.defense);
                enemyStats.hp -= playerDamage;

                // ★★★ 修正箇所: eval()を使わず、fプロパティを直接更新 ★★★
                this.stateManager.f.enemy_hp = enemyStats.hp;
                // ★★★ StateManagerのイベントを手動で発行し、HUDに更新を通知 ★★★
                this.stateManager.events.emit('f-variable-changed', 'enemy_hp', enemyStats.hp);

                this.addToBattleLog(`あなたの攻撃！敵に ${playerDamage} のダメージ！ (敵残りHP: ${Math.max(0, enemyStats.hp)})`);
                
                // 勝利判定
                if (enemyStats.hp <= 0) {
                    this.addToBattleLog("敵を倒した！");
                    this.time.delayedCall(1000, () => this.endBattle('win'));
                    return;
                }

                // 敵のターン
                this.time.delayedCall(1000, () => {
                    const enemyDamage = Math.max(0, enemyStats.attack - playerStats.defense);
                    playerStats.hp -= enemyDamage;

                    // ★★★ 修正箇所: eval()を使わず、fプロパティを直接更新 ★★★
                    this.stateManager.f.player_hp = playerStats.hp;
                    // ★★★ StateManagerのイベントを手動で発行し、HUDに更新を通知 ★★★
                    this.stateManager.events.emit('f-variable-changed', 'player_hp', playerStats.hp);

                    this.addToBattleLog(`敵の攻撃！あなたに ${enemyDamage} のダメージ！ (残りHP: ${Math.max(0, playerStats.hp)})`);
                    
                    // 敗北判定
                    if (playerStats.hp <= 0) {
                        this.addToBattleLog("あなたは倒れてしまった…");
                        this.time.delayedCall(1000, () => this.endBattle('lose'));
                        return;
                    }

                    // 次のターンへ
                    executeTurn(turn + 1);
                });
            });
        };
        
        // 最初のターンを開始
        executeTurn(1);
    }
    

    addToBattleLog(text) {
        this.battleLogText.setText(text);
    }

    createItem(itemId, x, y) {
        const itemData = ITEM_DATA[itemId];
        if (!itemData) return;

        const itemImage = this.add.image(x, y, itemData.storage).setInteractive().setData({itemId, originX: x, originY: y, gridPos: null});
        const shape = itemData.shape;
        const itemHeightInCells = shape.length;
        const itemWidthInCells = shape[0] ? shape[0].length : 1;
        itemImage.setDisplaySize(itemWidthInCells * this.cellSize, itemHeightInCells * this.cellSize);

        this.input.setDraggable(itemImage);

        itemImage.on('dragstart', (pointer, dragX, dragY) => {
            itemImage.setDepth(200);
            if (itemImage.getData('gridPos')) {
                this.removeItemFromBackpack(itemImage);
            }
        });
        itemImage.on('drag', (pointer, dragX, dragY) => {
            itemImage.setPosition(dragX, dragY);
        });
        itemImage.on('dragend', (pointer, dragX, dragY, dropped) => {
            itemImage.setDepth(100);
            const gridCol = Math.floor((pointer.x - this.gridX) / this.cellSize);
            const gridRow = Math.floor((pointer.y - this.gridY) / this.cellSize);
            if (this.canPlaceItem(itemImage, gridCol, gridRow)) {
                this.placeItemInBackpack(itemImage, gridCol, gridRow);
            } else {
                itemImage.x = itemImage.getData('originX');
                itemImage.y = itemImage.getData('originY');
            }
        });
    }

    canPlaceItem(itemImage, startCol, startRow) {
        const itemData = ITEM_DATA[itemImage.getData('itemId')];
        const shape = itemData.shape;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    const checkRow = startRow + r;
                    const checkCol = startCol + c;
                    if (checkRow < 0 || checkRow >= this.backpackGridSize || checkCol < 0 || checkCol >= this.backpackGridSize) return false;
                    if (this.backpack[checkRow][checkCol] !== 0) return false;
                }
            }
        }
        return true;
    }

    placeItemInBackpack(itemImage, startCol, startRow) {
        const itemId = itemImage.getData('itemId');
        const itemData = ITEM_DATA[itemId];
        const shape = itemData.shape;
        itemImage.x = this.gridX + startCol * this.cellSize + (itemImage.width * itemImage.scaleX / 2);
        itemImage.y = this.gridY + startRow * this.cellSize + (itemImage.height * itemImage.scaleY / 2);
        itemImage.setData('gridPos', { col: startCol, row: startRow });
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    this.backpack[startRow + r][startCol + c] = itemId;
                }
            }
        }
        console.log(`アイテム[${itemId}]をグリッド(${startCol}, ${startRow})に配置`);
        console.log("現在のバックパック:", this.backpack);
    }

    removeItemFromBackpack(itemImage) {
        const itemId = itemImage.getData('itemId');
        const itemData = ITEM_DATA[itemId];
        const shape = itemData.shape;
        const gridPos = itemImage.getData('gridPos');
        if (!gridPos) return;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    this.backpack[gridPos.row + r][gridPos.col + c] = 0;
                }
            }
        }
        itemImage.setData('gridPos', null);
        console.log(`アイテム[${itemId}]をグリッドから削除`);
        console.log("現在のバックパック:", this.backpack);
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

    // ★★★ onFVariableChanged メソッドを置き換え ★★★
    onFVariableChanged(key, value) {
        if (key === 'coin' && this.coinHud && this.coinHud.coinText.text !== value.toString()) {
            this.coinHud.setCoin(value);
        } else if (key === 'player_hp' && this.playerHpBar) {
            const maxHp = this.stateManager.f.player_max_hp || 100;
            this.playerHpBar.setHp(value, maxHp);
        } else if (key === 'player_max_hp' && this.playerHpBar) {
            const currentHp = this.stateManager.f.player_hp || 0;
            this.playerHpBar.setHp(currentHp, value);
        } else if (key === 'enemy_hp' && this.enemyHpBar) { // ★★★ 修正箇所: 敵HPバーの更新を追加 ★★★
            const maxHp = this.stateManager.f.enemy_max_hp || 500;
            this.enemyHpBar.setHp(value, maxHp);
        } else if (key === 'enemy_max_hp' && this.enemyHpBar) { // ★★★ 修正箇所: 敵最大HPの更新を追加 ★★★
            const currentHp = this.stateManager.f.enemy_hp || 0;
            this.enemyHpBar.setHp(currentHp, value);
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
