import HpBar from '../ui/HpBar.js';
import CoinHud from '../ui/CoinHud.js';
import { ITEM_DATA } from '../core/ItemData.js';

export default class BattleScene extends Phaser.Scene {
    constructor() {
        super('BattleScene');
        // --- constructor: プロパティの初期化 (あなたのコードのまま) ---
        this.receivedParams = null;
        this.stateManager = null;
        this.playerHpBar = null;
        this.enemyHpBar = null;
        this.coinHud = null;
        this.soundManager = null;
        this.backpackGridSize = 6;
        this.cellSize = 60;
        this.gridX = 0;
        this.gridY = 0;
        this.backpack = null;
        this.inventoryItems = [];
        this.backpackGridObjects = [];
        this.playerStats = { attack: 0, defense: 0, hp: 0 }; 
        this.enemyStats = { attack: 0, defense: 0, hp: 0 };  
        this.initialBattleParams = null;
        this.battleEnded = false;
        this.battleLogText = null;
        this.winButton = null;
        this.loseButton = null;
        this.retryButton = null;
        this.titleButton = null;
        this.gameOverText = null;
        this.onFVariableChangedListener = null;
        this.eventEmitted = false;
        this.playerPlaceholderText = null;
        this.enemyPlaceholderText = null;
        this.startBattleButton = null;
    }

    init(data) {
        // --- init: プロパティのリセット (あなたのコードのまま) ---
        this.receivedParams = data.transitionParams || {}; 
        this.initialBattleParams = {
            playerLevel: this.receivedParams.player_level || 1,
            playerName: this.receivedParams.player_name || 'プレイヤー',
            initialCoin: this.receivedParams.current_coin || 0,
            initialPlayerMaxHp: this.receivedParams.player_max_hp || 100, 
            initialPlayerHp: this.receivedParams.player_hp || this.receivedParams.player_max_hp || 100, 
        };
        this.battleEnded = false;
        this.eventEmitted = false;
    }

    // ★★★ 修正点①: createメソッドをasyncにする ★★★
    async create() {
        console.log("BattleScene: create 開始");
        this.cameras.main.setBackgroundColor('#8a2be2');

        this.stateManager = this.sys.registry.get('stateManager');
        this.soundManager = this.sys.registry.get('soundManager');

        if (!this.stateManager || !this.soundManager) {
            console.error("BattleScene: StateManagerまたはSoundManagerが取得できませんでした。");
            return;
        }

        // ★★★ 修正点②: BGMの再生処理をawaitで正しく待つ ★★★
        await this.soundManager.stopBgm(1500); 
        await this.soundManager.playBgm('bgm_battle', 500); 
        console.log("戦闘bgm開始！");
        
        // --- UIとゲームオブジェクトの生成 (あなたのコードのまま) ---
        this.playerPlaceholderText = this.add.text(100, 360, 'PLAYER', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        this.enemyPlaceholderText = this.add.text(this.scale.width - 100, 360, 'ENEMY', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);

        this.playerHpBar = new HpBar(this, { x: 20, y: 20, width: 250, height: 30, type: 'player', stateManager: this.stateManager });
        this.enemyHpBar = new HpBar(this, { x: this.scale.width - 20, y: 20, width: 250, height: 30, type: 'enemy', stateManager: this.stateManager });
        this.enemyHpBar.x -= this.enemyHpBar.barWidth;
        this.coinHud = new CoinHud(this, { x: 100, y: 50, stateManager: this.stateManager });

        this.stateManager.f.player_max_hp = this.initialBattleParams.initialPlayerMaxHp; 
        this.stateManager.f.player_hp = this.initialBattleParams.initialPlayerHp;
        this.playerHpBar.setHp(this.stateManager.f.player_hp, this.stateManager.f.player_max_hp);

        this.stateManager.f.enemy_max_hp = 500; 
        this.stateManager.f.enemy_hp = 500; 
        this.enemyHpBar.setHp(this.stateManager.f.enemy_hp, this.stateManager.f.enemy_max_hp);

        this.coinHud.setCoin(this.initialBattleParams.initialCoin);

        this.onFVariableChangedListener = this.onFVariableChanged.bind(this);
        this.stateManager.on('f-variable-changed', this.onFVariableChangedListener);
        
        this.backpackGridSize = 6;
        this.cellSize = 60;
        this.gridWidth = this.backpackGridSize * this.cellSize;
        this.gridHeight = this.backpackGridSize * this.cellSize;
        this.gridX = this.scale.width / 2 - this.gridWidth / 2;
        this.gridY = this.scale.height / 2 - this.gridHeight / 2 + 50;

        this.backpackGridObjects.push(this.add.rectangle(this.gridX + this.gridWidth / 2, this.gridY + this.gridHeight / 2, this.gridWidth, this.gridHeight, 0x333333, 0.9).setOrigin(0.5).setDepth(10));
        for (let i = 0; i <= this.backpackGridSize; i++) {
            this.backpackGridObjects.push(this.add.line(0, 0, this.gridX, this.gridY + i * this.cellSize, this.gridX + this.gridWidth, this.gridY + i * this.cellSize, 0x666666, 0.5).setOrigin(0).setDepth(11));
            this.backpackGridObjects.push(this.add.line(0, 0, this.gridX + i * this.cellSize, this.gridY, this.gridX + i * this.cellSize, this.gridY + this.gridHeight, 0x666666, 0.5).setOrigin(0).setDepth(11));
        }

        this.backpack = Array(this.backpackGridSize).fill(null).map(() => Array(this.backpackGridSize).fill(0));

        const inventoryX = this.gridX - 180;
        const inventoryY = this.gridY;
        const inventoryWidth = 150;
        const inventoryHeight = this.gridHeight;
        this.backpackGridObjects.push(this.add.rectangle(inventoryX + inventoryWidth / 2, inventoryY + inventoryHeight / 2, inventoryWidth, inventoryHeight, 0x555555, 0.8).setOrigin(0.5).setDepth(10));
        this.backpackGridObjects.push(this.add.text(inventoryX + inventoryWidth / 2, inventoryY + 20, 'インベントリ', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5).setDepth(11));

        const initialInventory = ['sword', 'shield', 'potion'];
        let itemY = inventoryY + 70;
        initialInventory.forEach(itemId => {
            const itemImage = this.createItem(itemId, inventoryX + inventoryWidth / 2, itemY);
            if (itemImage) { this.inventoryItems.push(itemImage); }
            itemY += 80;
        });

        this.startBattleButton = this.add.text(this.gridX - 105, this.gridY + this.gridHeight - 30, '戦闘開始', { fontSize: '28px', fill: '#fff', backgroundColor: '#008800', padding: { x: 10, y: 5 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(11);
        this.startBattleButton.on('pointerdown', () => {
            this.startBattleButton.disableInteractive(); 
            this.input.enabled = false;
            this.startBattle();
        });
        
        this.battleLogText = this.add.text(this.scale.width / 2, 150, '', { fontSize: '24px', fill: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 10, y: 10 }, align: 'center', wordWrap: { width: 400 } }).setOrigin(0.5).setDepth(200);

        // --- endBattleを呼び出すためのダミーボタン (あなたの元のコードにはなかったが、動作確認のために残しておくと便利) ---
        this.winButton = this.add.text(320, 600, '勝利(デバッグ用)', { fontSize: '32px', fill: '#0c0', backgroundColor: '#000' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.winButton.on('pointerdown', () => this.endBattle('win'));

        this.loseButton = this.add.text(this.scale.width - 320, 600, '敗北(デバッグ用)', { fontSize: '32px', fill: '#c00', backgroundColor: '#000' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.loseButton.on('pointerdown', () => this.endBattle('lose'));

        // ★★★ 修正点③: createの最後に「準備完了」イベントを発行する ★★★
        this.events.emit('scene-ready');
        console.log("BattleScene: 準備完了イベント(scene-ready)を発行しました。");
        console.log("BattleScene: create 完了");
    }

    // ★★★ 修正点④: endBattleメソッドをasync化し、あなたのロジックを尊重した形に修正 ★★★
    async endBattle(result) {
        if (this.battleEnded) return;
        this.battleEnded = true;

        console.log(`BattleScene: バトル終了。結果: ${result}`);
        
        if (this.winButton) this.winButton.disableInteractive();
        if (this.loseButton) this.loseButton.disableInteractive();
        
        if (result === 'win') {
            this.input.enabled = false;
            if (this.eventEmitted) return;
            this.eventEmitted = true;

            if (this.soundManager) await this.soundManager.stopBgm(500);

            if (this.stateManager && this.onFVariableChangedListener) {
                this.stateManager.off('f-variable-changed', this.onFVariableChangedListener);
                this.onFVariableChangedListener = null;
            }

            this.scene.get('SystemScene').events.emit('return-to-novel', {
                from: this.scene.key,
                params: { 
                    'f.battle_result': 'win',
                    'f.player_hp': this.playerStats.hp, 
                    'f.coin': this.stateManager.f.coin 
                }
            });
            
        } else { // result === 'lose'
            console.log("BattleScene: ゲームオーバー処理を開始します。");
            
            this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, 'GAME OVER', { fontSize: '64px', fill: '#f00', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(999);
            this.retryButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 'もう一度挑戦', { fontSize: '32px', fill: '#fff', backgroundColor: '#880000', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(999);
            this.titleButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 120, 'タイトルに戻る', { fontSize: '32px', fill: '#fff', backgroundColor: '#444444', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(999);
            
            this.input.enabled = true; 

            this.retryButton.on('pointerdown', async () => {
                if (this.eventEmitted) return;
                this.eventEmitted = true;
                this.input.enabled = false;

                if (this.soundManager) await this.soundManager.stopBgm(500);
                if (this.stateManager) this.stateManager.off('f-variable-changed', this.onFVariableChangedListener);
                
                this.scene.get('SystemScene').events.emit('request-scene-transition', {
                    to: this.scene.key, from: this.scene.key, params: this.initialBattleParams
                });
            });

            this.titleButton.on('pointerdown', async () => {
                if (this.eventEmitted) return;
                this.eventEmitted = true;
                this.input.enabled = false;
                
                if (this.soundManager) await this.soundManager.stopBgm(500);
                if (this.stateManager) this.stateManager.off('f-variable-changed', this.onFVariableChangedListener);

                this.scene.get('SystemScene').events.emit('return-to-novel', {
                    from: this.scene.key, params: { 'f.battle_result': 'game_over' }
                });
            });
        }
    }

    // --- startBattle: あなたの元のコードのまま ---
    startBattle() {
        console.log("戦闘開始！");
        if(this.playerPlaceholderText) this.playerPlaceholderText.setVisible(false);
        if(this.enemyPlaceholderText) this.enemyPlaceholderText.setVisible(false);
        this.backpackGridObjects.forEach(obj => obj.setVisible(false));
        this.inventoryItems.forEach(item => item.setVisible(false));
        if(this.startBattleButton) this.startBattleButton.setVisible(false);
        this.playerStats = { attack: 5, defense: 0, hp: this.stateManager.f.player_hp };
        this.enemyStats = { attack: 20, defense: 0, hp: this.stateManager.f.enemy_hp };
        const processedItems = new Set(); 
        for (let r = 0; r < this.backpackGridSize; r++) {
            for (let c = 0; c < this.backpackGridSize; c++) {
                const itemId = this.backpack[r][c];
                if (itemId !== 0) {
                    const uniqueCellId = `${itemId}-${r}-${c}`; 
                    if (!processedItems.has(uniqueCellId)) { 
                        const itemData = ITEM_DATA[itemId];
                        if (itemData && itemData.effects) {
                            this.playerStats.attack += itemData.effects.attack || 0;
                            this.playerStats.defense += itemData.effects.defense || 0;
                        }
                        processedItems.add(uniqueCellId); 
                    }
                }
            }
        }
        console.log(`プレイヤー最終ステータス: 攻撃=${this.playerStats.attack}, 防御=${this.playerStats.defense}`);
        this.addToBattleLog(`あなたのステータス: 攻撃=${this.playerStats.attack}, 防御=${this.playerStats.defense}`);
        const executeTurn = (turn) => {
            console.log(`--- Turn ${turn} ---`);
            this.time.delayedCall(1000, () => {
                if (this.battleEnded) return;
                const playerDamage = Math.max(0, this.playerStats.attack - this.enemyStats.defense);
                this.enemyStats.hp -= playerDamage;
                this.stateManager.eval(`f.enemy_hp = ${this.enemyStats.hp}`);
                this.addToBattleLog(`あなたの攻撃！敵に ${playerDamage} のダメージ！ (敵残りHP: ${Math.max(0, this.enemyStats.hp)})`);
                if (this.enemyStats.hp <= 0) {
                    this.addToBattleLog("敵を倒した！");
                    this.time.delayedCall(1000, () => this.endBattle('win'));
                    return;
                }
                this.time.delayedCall(1000, () => {
                    if (this.battleEnded) return;
                    const enemyDamage = Math.max(0, this.enemyStats.attack - this.playerStats.defense);
                    this.playerStats.hp -= enemyDamage;
                    this.stateManager.eval(`f.player_hp = ${this.playerStats.hp}`);
                    this.addToBattleLog(`敵の攻撃！あなたに ${enemyDamage} のダメージ！ (残りHP: ${Math.max(0, this.playerStats.hp)})`);
                    if (this.playerStats.hp <= 0) {
                        this.addToBattleLog("あなたは倒れてしまった…");
                        this.time.delayedCall(1000, () => this.endBattle('lose'));
                        return;
                    }
                    executeTurn(turn + 1);
                });
            });
        };
        executeTurn(1);
    }
    
    // --- addToBattleLog: あなたの元のコードのまま ---
    addToBattleLog(text) {
        if (this.battleLogText) { 
            this.battleLogText.setText(text);
        }
    }

    // --- createItem: あなたの元のコードのまま ---
    createItem(itemId, x, y) {
        const itemData = ITEM_DATA[itemId];
        if (!itemData) return null;
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
        return itemImage; 
    }

    // --- canPlaceItem: あなたの元のコードのまま ---
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

    // --- placeItemInBackpack: あなたの元のコードのまま ---
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
    }

    // --- removeItemFromBackpack: あなたの元のコードのまま ---
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
    }
    
    // --- onFVariableChanged: あなたの元のコードのまま ---
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
        } else if (key === 'enemy_max_hp' && this.enemyHpBar) { 
            const currentHp = this.stateManager.f.enemy_hp || 0;
            this.enemyHpBar.setHp(currentHp, value);
        }
    }

    // ★★★ 修正点⑤: stop()メソッドを完全に削除する ★★★
    // stop()メソッドはシーンの再起動時に問題を引き起こすため、使用しません。

    // ★★★ 修正点⑥: shutdown()にクリーンアップ処理を集約する ★★★
    shutdown() {
        console.log("BattleScene: shutdown されました。リスナーをクリーンアップします。");
        if (this.stateManager && this.onFVariableChangedListener) {
            this.stateManager.off('f-variable-changed', this.onFVariableChangedListener);
            this.onFVariableChangedListener = null;
        }
    }

    // --- resume: あなたの元のコードのまま ---
    resume() {
        console.log("BattleScene: resume されました。");
    }
}
