// src/scenes/GameScene.js (最終版)

import CoinHud from '../ui/CoinHud.js';
import StateManager from '../core/StateManager.js';
import MessageWindow from '../ui/MessageWindow.js';
import SoundManager from '../core/SoundManager.js'; 
import ScenarioManager from '../core/ScenarioManager.js'; 
import { handleCharaShow } from '../handlers/chara_show.js';
import { handleCharaHide } from '../handlers/chara_hide.js';
import { handleCharaMod } from '../handlers/chara_mod.js';
import { handlePageBreak } from '../handlers/p.js';
import { handleWait } from '../handlers/wait.js';
import { handleBg } from '../handlers/bg.js';
import { handlePlaySe } from '../handlers/playse.js';
import { handlePlayBgm } from '../handlers/playbgm.js';
import { handleStopBgm } from '../handlers/stopbgm.js';
import ConfigManager from '../core/ConfigManager.js';
import { handleLink } from '../handlers/link.js';
import { handleJump } from '../handlers/jump.js';
import { handleMove } from '../handlers/move.js';
import { handleShake } from '../handlers/shake.js';
import { handleVibrate } from '../handlers/vibrate.js';
import { handleFlip } from '../handlers/flip.js';
import { handleCharaJump } from '../handlers/chara_jump.js';
import { handleEval } from '../handlers/eval.js';
import { handleLog } from '../handlers/log.js';
import { handleIf } from '../handlers/if.js';
import { handleElsif } from '../handlers/elsif.js';
import { handleElse } from '../handlers/else.js';
import { handleEndif } from '../handlers/endif.js';
import { handleStop } from '../handlers/s.js';
import { handleClearMessage } from '../handlers/cm.js';
import { handleErase } from '../handlers/er.js';
import { handleDelay } from '../handlers/delay.js';
import { handleImage } from '../handlers/image.js';
import { handleFreeImage } from '../handlers/freeimage.js';
import { handleButton } from '../handlers/button.js';
import { handleCall } from '../handlers/call.js';
import { handleReturn } from '../handlers/return.js';
import { handleStopAnim } from '../handlers/stop_anim.js';
import { handleFadeout } from '../handlers/fadeout.js';
import { handleFadein } from '../handlers/fadein.js';
import { handleVideo } from '../handlers/video.js';
import { handleStopVideo } from '../handlers/stopvideo.js';
// ★★★ 追加: HpBarをインポート ★★★
import HpBar from '../ui/HpBar.js'; 


export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.scenarioManager = null;
        this.soundManager = null;
        this.stateManager = null;
        this.messageWindow = null;
        this.layer = { background: null, character: null, cg: null, message: null };
        this.charaDefs = null;
        this.characters = {};
        this.configManager = null;
        this.choiceButtons = []; 
        this.pendingChoices = []; 
        this.uiButtons = [];

        // ★★★ 追加: HUDの参照とリスナーの参照 ★★★
        this.coinHud = null;
        this.playerHpBar = null;
        this.updateHudListenerRef = null; // updateイベントリスナーの参照
    }

    init(data) {
        this.charaDefs = data.charaDefs;
        this.startScenario = data.startScenario || 'test.ks'; // デフォルトはtest.ks
        this.startLabel = data.startLabel || null;
        this.isResuming = data.resumedFrom ? true : false;
        this.returnParams = data.returnParams || null;
    }

    preload() {
        this.load.text('test.ks', 'assets/test.ks'); // test.ksをロード
        this.load.text('scene2.ks', 'assets/scene2.ks'); // scene2.ksもロード
        this.load.text('overlay_test.ks', 'assets/overlay_test.ks'); // overlay_test.ksもロード
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');
        
        // --- レイヤー生成とdepth設定 ---
        this.layer.background = this.add.container(0, 0).setDepth(0);
        this.layer.cg = this.add.container(0, 0).setDepth(5);
        this.layer.character = this.add.container(0, 0).setDepth(10);
        this.layer.message = this.add.container(0, 0).setDepth(20);

        // --- 入力ブロッカー ---
        this.choiceInputBlocker = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.001)
            .setInteractive()
            .setVisible(false)
            .setDepth(25);
        this.choiceInputBlocker.on('pointerdown', () => console.log("選択肢を選んでください"));
        this.choiceInputBlocker.input.enabled = false;

        // --- マネージャー/UIクラスの生成 (依存関係に注意) ---
        this.configManager = this.sys.registry.get('configManager');
        this.stateManager = new StateManager();
        this.soundManager = new SoundManager(this, this.configManager);
        this.messageWindow = new MessageWindow(this, this.soundManager, this.configManager);
        this.layer.message.add(this.messageWindow); // MessageWindowがmessageレイヤーの子になる
        this.scenarioManager = new ScenarioManager(this, this.layer, this.charaDefs, this.messageWindow, this.soundManager, this.stateManager, this.configManager);
        
// --- タグハンドラの登録 ---
        this.scenarioManager.registerTag('chara_show', handleCharaShow);
        this.scenarioManager.registerTag('chara_hide', handleCharaHide);
        this.scenarioManager.registerTag('chara_mod', handleCharaMod);
        this.scenarioManager.registerTag('p', handlePageBreak);
        this.scenarioManager.registerTag('wait', handleWait);
        this.scenarioManager.registerTag('bg', handleBg);
        this.scenarioManager.registerTag('playse', handlePlaySe);
        this.scenarioManager.registerTag('playbgm', handlePlayBgm);
        this.scenarioManager.registerTag('stopbgm', handleStopBgm);
        this.scenarioManager.registerTag('link', handleLink);
        this.scenarioManager.registerTag('jump', handleJump);
        this.scenarioManager.registerTag('move', handleMove);
        this.scenarioManager.registerTag('walk', handleWalk);
        this.scenarioManager.registerTag('shake', handleShake);
        this.scenarioManager.registerTag('vibrate', handleVibrate);
        this.scenarioManager.registerTag('flip', handleFlip);
        this.scenarioManager.registerTag('chara_jump', handleCharaJump);
        this.scenarioManager.registerTag('eval', handleEval);
        this.scenarioManager.registerTag('log', handleLog);
        this.scenarioManager.registerTag('if', handleIf);
        this.scenarioManager.registerTag('elsif', handleElsif);
        this.scenarioManager.registerTag('else', handleElse);
        this.scenarioManager.registerTag('endif', handleEndif);
        this.scenarioManager.registerTag('s', handleStop);
　　　　　this.scenarioManager.registerTag('cm', handleClearMessage);
　　　　　this.scenarioManager.registerTag('er', handleErase);
        this.scenarioManager.registerTag('delay', handleDelay);
        this.scenarioManager.registerTag('image', handleImage);
        this.scenarioManager.registerTag('freeimage', handleFreeImage);
        this.scenarioManager.registerTag('button', handleButton);
        this.scenarioManager.registerTag('call', handleCall);
        this.scenarioManager.registerTag('return', handleReturn);
        this.scenarioManager.registerTag('stop_anim', handleStopAnim);
        this.scenarioManager.registerTag('fadeout', handleFadeout);
this.scenarioManager.registerTag('fadein', handleFadein);
this.scenarioManager.registerTag('video', handleVideo);
this.scenarioManager.registerTag('stopvideo', handleStopVideo);
      this.scenarioManager.registerTag('voice', handleVoice);
     

        // --- ゲーム開始ロジック ---
        if (this.isResuming) {
            // サブシーンからの復帰の場合
            console.log("GameScene: 復帰処理を開始します。");
            this.performLoad(0, this.returnParams); 

        } else {
            // 通常の初回起動の場合
            console.log("GameScene: 通常起動します。");
            this.performSave(0); // [jump]の前にオートセーブを実行しておく
            
            this.scenarioManager.loadScenario(this.startScenario, this.startLabel);
            this.time.delayedCall(10, () => this.scenarioManager.next());
        }
        
        // グローバルクリックイベント
        this.input.on('pointerdown', () => this.scenarioManager.onClick());
        
        console.log("GameScene: create 完了");
    }

    // ★★★ start/stop ライフサイクルメソッドを追加 ★★★
    start() {
        super.start();
        console.log("GameScene: start されました。");
        // updateリスナーをここで登録
        this.updateHudListenerRef = this.updateAllHud.bind(this);
        this.events.on('update', this.updateHudListenerRef);
    }

    stop() {
        super.stop();
        console.log("GameScene: stop されました。");
        // updateリスナーをここで解除
        if (this.updateHudListenerRef) {
            this.events.off('update', this.updateHudListenerRef);
            this.updateHudListenerRef = null;
        }
        // 他のオブジェクトの破棄（必要な場合）
        if (this.coinHud) { this.coinHud.destroy(); this.coinHud = null; }
        if (this.playerHpBar) { this.playerHpBar.destroy(); this.playerHpBar = null; }
    }


    // ★★★ セーブ処理 ★★★
    performSave(slot) {
        try {
            const gameState = this.stateManager.getState(this.scenarioManager);
            const jsonString = JSON.stringify(gameState, null, 2);
            localStorage.setItem(`save_data_${slot}`, jsonString);
            console.log(`スロット[${slot}]にセーブしました。`, gameState);
        } catch (e) {
            console.error(`セーブに失敗しました: スロット[${slot}]`, e);
        }
    }

    // ★★★ ロード処理 ★★★
    async performLoad(slot, returnParams = null) {
        try {
            const jsonString = localStorage.getItem(`save_data_${slot}`);
            if (!jsonString) {
                console.error(`スロット[${slot}]のセーブデータが見つかりません。復帰できません。`);
                return;
            }
            const loadedState = JSON.parse(jsonString);
            
            // returnParamsがあれば、その内容でロードした変数を上書き
            if (returnParams) {
                console.log("復帰パラメータを反映します:", returnParams);
                for (const key in returnParams) {
                    const evalExp = `${key} = '${returnParams[key]}'`; 
                    this.stateManager.eval(evalExp);
                }
            }

            // ★★★ StateManagerのf変数をロードされた状態に同期 ★★★
            // この行がperformLoadの冒頭にないと、evalの前に古いfが使われてしまう
            this.stateManager.setState(loadedState); 

            console.log(`スロット[${slot}]からロードしました。`, loadedState);

            await rebuildScene(this.scenarioManager, loadedState);
            
            // ロードされた状態が待機状態なら、next()を呼ばずにユーザー入力を待つ
            if (loadedState.scenario.isWaitingClick || loadedState.scenario.isWaitingChoice) {
                console.log("ロード完了: 待機状態のため、ユーザーの入力を待ちます。");
            } else {
                console.log("ロード完了: 次の行からシナリオを再開します。");
                this.time.delayedCall(10, () => this.scenarioManager.next());
            }
            
        } catch (e) {
            console.error(`ロード処理でエラーが発生しました。`, e);
        }
    }

    /**
     * 溜まっている選択肢情報を元に、ボタンを一括で画面に表示する
     */
    displayChoiceButtons() {
        this.choiceInputBlocker.setVisible(true);
        this.choiceInputBlocker.input.enabled = true;
        this.children.bringToTop(this.choiceInputBlocker);

        const totalButtons = this.pendingChoices.length;
        const startY = (this.scale.height / 2) - ((totalButtons - 1) * 60);
        
        // ★★★ ボタンのスタイル定義 ★★★ (必要であれば統一化)
        const buttonStyle = {
            fontSize: '40px',
            fill: '#ccc',
            backgroundColor: '#333333',
            padding: { x: 40, y: 10 },
            align: 'center'
        };

        this.pendingChoices.forEach((choice, index) => {
            const y = startY + (index * 120);
            const button = this.add.text(this.scale.width / 2, y, choice.text, buttonStyle) // スタイルを適用
                .setOrigin(0.5)
                .setInteractive();
           
            this.children.bringToTop(button);
            button.on('pointerdown', () => {
                this.clearChoiceButtons(); 
                this.scenarioManager.jumpTo(choice.target);
                this.scenarioManager.next();
            });
            this.choiceButtons.push(button);
        });
    }
     
    /**
     * ボタンを消すためのヘルパーメソッド
     */
    clearChoiceButtons() {
        this.choiceInputBlocker.setVisible(false);
        this.choiceInputBlocker.input.enabled = false;

        this.choiceButtons.forEach(button => button.destroy());
        this.choiceButtons = [];
        this.pendingChoices = [];
        if (this.scenarioManager) {
            this.scenarioManager.isWaitingChoice = false;
        }
    }

    // ★★★ 全てのHUDを更新するメソッド (updateAllHud) ★★★
    updateAllHud() {
        // CoinHudが存在しない場合（初期起動時など）はインスタンス化
        if (!this.coinHud) {
            this.coinHud = new CoinHud(this, 100, 50); 
        }
        // PlayerHpBarが存在しない場合（初期起動時など）はインスタンス化
        if (!this.playerHpBar) {
            this.playerHpBar = new HpBar(this, 100, 100, 200, 25, 'player'); 
            this.playerHpBar.setVisible(false); // ノベルパートでは基本非表示
        }

        const currentCoin = this.stateManager.f.coin || 0;
        if (this.coinHud.coinText.text !== currentCoin.toString()) {
            this.coinHud.setCoin(currentCoin);
        }

        const currentPlayerHp = this.stateManager.f.player_hp || 0;
        const maxPlayerHp = this.stateManager.f.player_max_hp || 100;
        if (this.playerHpBar.currentHp !== currentPlayerHp || this.playerHpBar.maxHp !== maxPlayerHp) {
            this.playerHpBar.setHp(currentPlayerHp, maxPlayerHp);
        }
    }
}

/**
 * ロードした状態に基づいて、シーンの表示とシナリオの内部状態を完全に再構築するヘルパー関数
 * @param {ScenarioManager} manager - 操作対象のシナリオマネージャー
 * @param {Object} state - ロードした状態オブジェクト
 */
async function rebuildScene(manager, state) {
    console.log("--- rebuildScene 開始 ---", state);
    const scene = manager.scene;

    // 1. 現在の表示と状態をクリア
    scene.clearChoiceButtons();
    manager.layers.background.removeAll(true);
    manager.layers.character.removeAll(true);
    scene.characters = {};
    manager.soundManager.stopBgm(0); // フェードなしで即時停止
    manager.messageWindow.reset();
    scene.cameras.main.resetFX(); // カメラエフェクトもリセット
    
    // HUDも破棄して再生成に備える
    if (scene.coinHud) { scene.coinHud.destroy(); scene.coinHud = null; }
    if (scene.playerHpBar) { scene.playerHpBar.destroy(); scene.playerHpBar = null; }


    // 2. シナリオの「論理的な状態」を復元
    manager.currentFile = state.scenario.fileName;
    manager.currentLine = state.scenario.line;
    manager.ifStack = state.scenario.ifStack || [];
    manager.callStack = state.scenario.callStack || [];
    manager.isWaitingClick = state.scenario.isWaitingClick;
    manager.isWaitingChoice = state.scenario.isWaitingChoice;

    await manager.loadScenario(manager.currentFile);
    manager.currentLine = state.scenario.line; 

    // 3. 背景を復元
    if (state.layers.background) {
        const bg = scene.add.image(scene.scale.width / 2, scene.scale.height / 2, state.layers.background);
        bg.setDisplaySize(scene.scale.width, scene.scale.height);
        manager.layers.background.add(bg);
    }
    
    // 4. キャラクターを復元
    if (state.layers.characters) {
        for (const name in state.layers.characters) {
            const charaData = state.layers.characters[name];
            const chara = scene.add.image(charaData.x, charaData.y, charaData.storage);
            chara.setScale(charaData.scaleX, charaData.scaleY)
                 .setAlpha(charaData.alpha)
                 .setFlipX(charaData.flipX)
                 .setTint(charaData.tint);
            manager.layers.character.add(chara);
            scene.characters[name] = chara;
        }
    }

    // 5. BGMを復元
    if (state.sound && state.sound.bgm) {
        manager.soundManager.playBgm(state.sound.bgm, 0); 
    }
    
    // 6. メッセージウィンドウを復元 (クリック待ちだった場合)
    if (state.scenario.isWaitingClick) {
        manager.messageWindow.setText(state.scenario.currentText, false, () => {
            manager.messageWindow.showNextArrow();
        }, state.scenario.speakerName);
        manager.highlightSpeaker(state.scenario.speakerName);
    }

    // 7. 選択肢を復元
    if (state.scenario.isWaitingChoice) {
        scene.pendingChoices = state.scenario.pendingChoices || [];
        if (scene.pendingChoices.length > 0) {
            scene.displayChoiceButtons();
        }
    }
    
    console.log("--- rebuildScene 正常終了 ---");
}
