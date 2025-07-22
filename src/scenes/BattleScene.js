import HpBar from '../ui/HpBar.js';
import CoinHud from '../ui/CoinHud.js';
import { ITEM_DATA } from '../core/ItemData.js';

export default class BattleScene extends Phaser.Scene {
    constructor() {
        super('BattleScene');
        // constructorは変更なし
        this.receivedParams = null; this.stateManager = null; this.playerHpBar = null;
        this.enemyHpBar = null; this.coinHud = null; this.soundManager = null;
        this.backpackGridSize = 6; this.cellSize = 60; this.gridX = 0;
        this.gridY = 0; this.backpack = null; this.inventoryItems = [];
        this.backpackGridObjects = []; this.playerStats = { attack: 0, defense: 0, hp: 0 };
        this.enemyStats = { attack: 0, defense: 0, hp: 0 }; this.initialBattleParams = null;
        this.battleEnded = false; this.battleLogText = null; this.winButton = null;
        this.loseButton = null; this.retryButton = null; this.titleButton = null;
        this.gameOverText = null; this.onFVariableChangedListener = null;
        this.eventEmitted = false; this.playerPlaceholderText = null;
        this.enemyPlaceholderText = null; this.startBattleButton = null;
    }

    init(data) {
        // initは変更なし
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

    async create() {
        console.log("BattleScene: create 開始");
        this.cameras.main.setBackgroundColor('#8a2be2');

        this.stateManager = this.sys.registry.get('stateManager');
        this.soundManager = this.sys.registry.get('soundManager');

        if (!this.stateManager || !this.soundManager) {
            console.error("BattleScene: StateManagerまたはSoundManagerが取得できませんでした。"); return;
        }

        await this.soundManager.stopBgm(500); 
        await this.soundManager.playBgm('bgm_battle', 500); 
        console.log("戦闘bgm開始！");
        
        // ★★★ 修正点①: createで生成するオブジェクトを、すべてローカル変数にする ★★★
        const playerPlaceholderText = this.add.text(100, 360, 'PLAYER', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        const enemyPlaceholderText = this.add.text(this.scale.width - 100, 360, 'ENEMY', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        this.playerHpBar = new HpBar(this, { x: 20, y: 20, width: 250, height: 30, type: 'player', stateManager: this.stateManager });
        this.enemyHpBar = new HpBar(this, { x: this.scale.width - 20, y: 20, width: 250, height: 30, type: 'enemy', stateManager: this.stateManager });
        this.enemyHpBar.x -= this.enemyHpBar.barWidth;
        this.coinHud = new CoinHud(this, { x: 100, y: 50, stateManager: this.stateManager });

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

        this.winButton = this.add.text(320, 600, '勝利してノベルパートに戻る', { fontSize: '32px', fill: '#0c0', backgroundColor: '#000' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);
        this.winButton.on('pointerdown', () => this.endBattle('win'));

        this.loseButton = this.add.text(this.scale.width - 320, 600, '敗北してゲームオーバー', { fontSize: '32px', fill: '#c00', backgroundColor: '#000' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);
        this.loseButton.on('pointerdown', () => this.endBattle('lose'));
        this.events.emit('scene-ready');
        console.log("BattleScene: 準備完了イベント(scene-ready)を発行しました。");

        console.log("BattleScene: create 完了");
    }

 
    startBattle() {
        console.log("戦闘開始！");
        // アイテムのドラッグ入力を無効化 (戦闘中はアイテムを動かせない)
        // this.input.setDraggable(this.inventoryItems, false); // これは個々のアイテムにリスナーがあるので、全体無効化でOK

        // プレースホルダーテキストやグリッド、アイテムを非表示にする（UX向上）
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
    
    addToBattleLog(text) {
        if (this.battleLogText) { 
            this.battleLogText.setText(text);
        }
    }

    createItem(itemId, x, y) {
        const itemData = ITEM_DATA[itemId];
        if (!itemData) return null;

        const itemImage = this.add.image(x, y, itemData.storage).setInteractive().setData({itemId, originX: x, originY: y, gridPos: null});
        const shape = itemData.shape;
        const itemHeightInCells = shape.length;
        const itemWidthInCells = shape[0] ? shape[0].length : 1;
        itemImage.setDisplaySize(itemWidthInCells * this.cellSize, itemHeightInCells * this.cellSize);

        this.input.setDraggable(itemImage); // これで自動的に内部でリスナーが登録される

        // 個々のアイテムのドラッグイベントリスナー
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

   // ★★★ stop()メソッドは、Phaserのライフサイクルで呼ばれることを期待して残す ★★★
    stop() {
        super.stop();
        console.log("BattleScene: stop されました。UI要素とイベントリスナーを破棄します。");

        // stop()が呼ばれる前にendBattleでリスナーは解除されているはずだが、念のためここでも解除
        if (this.stateManager && this.onFVariableChangedListener) {
            this.stateManager.off('f-variable-changed', this.onFVariableChangedListener);
            this.onFVariableChangedListener = null;
            console.log("BattleScene: stop()内でStateManagerのイベントリスナーを解除しました。");
        }
        
        // このシーンが作成した全ての表示オブジェクトを破棄
        this.children.removeAll(true);
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
        } else if (key === 'enemy_max_hp' && this.enemyHpBar) { 
            const currentHp = this.stateManager.f.enemy_hp || 0;
            this.enemyHpBar.setHp(currentHp, value);
        }
    }

    // ★★★ endBattleメソッドを、あなたのロジックを活かしたまま修正 ★★★
    async endBattle(result) {
        if (this.battleEnded) return;
        this.battleEnded = true;

        console.log(`BattleScene: バトル終了。結果: ${result}`);
        
        // 勝利/敗北ボタンの入力を無効化
        if (this.winButton) this.winButton.disableInteractive();
        if (this.loseButton) this.loseButton.disableInteractive();
        
        if (result === 'win') {
            // --- 勝利時の処理 ---
            this.input.enabled = false;
            if (this.eventEmitted) return;
            this.eventEmitted = true;

            // ★ awaitでBGM停止を待つ
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

            // ★ 自分でstop()を呼び出さない！
            // this.scene.stop(this.scene.key);
            
        } else { // result === 'lose'
            // --- 敗北時の処理 ---
            console.log("BattleScene: ゲームオーバー処理を開始します。");
            
            // ゲームオーバーUIの生成
            this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, 'GAME OVER', { /* ... */ }).setOrigin(0.5).setDepth(999);
            this.retryButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 'もう一度挑戦', { /* ... */ }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(999);
            this.titleButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 120, 'タイトルに戻る', { /* ... */ }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(999);
            
            this.input.enabled = true; 

            // リトライボタンのクリック処理 (コールバックをasyncにする)
            this.retryButton.on('pointerdown', async () => {
                if (this.eventEmitted) return;
                this.eventEmitted = true;
                this.input.enabled = false;

                // ★ awaitでBGM停止を待つ
                if (this.soundManager) await this.soundManager.stopBgm(500);

                if (this.stateManager) this.stateManager.off('f-variable-changed', this.onFVariableChangedListener);
                
                this.scene.get('SystemScene').events.emit('request-scene-transition', {
                    to: this.scene.key,
                    from: this.scene.key,
                    params: this.initialBattleParams
                });
            });

            // タイトルに戻るボタンのクリック処理 (コールバックをasyncにする)
            this.titleButton.on('pointerdown', async () => {
                if (this.eventEmitted) return;
                this.eventEmitted = true;
                this.input.enabled = false;
                
                // ★ awaitでBGM停止を待つ
                if (this.soundManager) await this.soundManager.stopBgm(500);

                if (this.stateManager) this.stateManager.off('f-variable-changed', this.onFVariableChangedListener);

                this.scene.get('SystemScene').events.emit('return-to-novel', {
                    from: this.scene.key,
                    params: { 'f.battle_result': 'game_over' }
                });
            });
        }
    }
    
    handleLose() {
        console.log("BattleScene: ゲームオーバー処理を開始します。");
        this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, 'GAME OVER', { fontSize: '64px', fill: '#f00', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(999);
        this.retryButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 'もう一度挑戦', { fontSize: '32px', fill: '#fff', backgroundColor: '#880000', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(999);
        this.titleButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 120, 'タイトルに戻る', { fontSize: '32px', fill: '#fff', backgroundColor: '#444444', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(999);
        
        this.input.enabled = true; // ゲームオーバーボタンを操作できるようにする

        this.retryButton.on('pointerdown', async () => {
            if (this.eventEmitted) return;
            this.eventEmitted = true;
            this.input.enabled = false;
            
            if (this.soundManager) await this.soundManager.stopBgm(500);
            if (this.stateManager) this.stateManager.off('f-variable-changed', this.onFVariableChangedListener);

            this.scene.get('SystemScene').events.emit('request-scene-transition', {
                to: this.scene.key,
                from: this.scene.key,
                params: this.initialBattleParams
            });
        });

        this.titleButton.on('pointerdown', async () => {
            if (this.eventEmitted) return;
            this.eventEmitted = true;
            this.input.enabled = false;
            
            if (this.soundManager) await this.soundManager.stopBgm(500);
            if (this.stateManager) this.stateManager.off('f-variable-changed', this.onFVariableChangedListener);

            this.scene.get('SystemScene').events.emit('return-to-novel', {
                from: this.scene.key,
                params: { 'f.battle_result': 'game_over' }
            });
        });
    }
    

    shutdown() {
        console.log("BattleScene: shutdown されました。リスナーをクリーンアップします。");
        if (this.stateManager && this.onFVariableChangedListener) {
            this.stateManager.off('f-variable-changed', this.onFVariableChangedListener);
            this.onFVariableChangedListener = null;
        }
    }

    resume() {
        console.log("ActionScene (as BattleScene): resume されました。入力を再有効化します。");
        this.input.enabled = true;
    }
}
