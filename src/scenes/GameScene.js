import ScenarioManager from '../core/ScenarioManager.js';
import SoundManager from '../core/SoundManager.js';
import CoinHud from '../ui/CoinHud.js';
import HpBar from '../ui/HpBar.js';
import StateManager from '../core/StateManager.js';
import MessageWindow from '../ui/MessageWindow.js';
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
import { handleWalk } from '../handlers/walk.js';
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
import { handleVoice } from '../handlers/voice.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({key:'GameScene', active :false});
        // プロパティの初期化
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
        this.coinHud = null;
        this.playerHpBar = null;
          this.isPerformingLoad = false; // ★★★ 追加: ロード処理中フラグ ★★★
        this.isSceneFullyReady = false; // シーンが完全に準備完了したかのフラグ
    }

    init(data) {
        this.charaDefs = data.charaDefs;
        this.startScenario = data.startScenario || 'test.ks';
        this.startLabel = data.startLabel || null;
  this.isPerformingLoad = false; // ★★★ init時にリセット ★★★
        this.isResuming = data.resumedFrom ? true : false;
        this.returnParams = data.returnParams || null;
        this.isSceneFullyReady = false; // init時にリセット
    }

    preload() {
        this.load.text('test.ks', 'assets/test.ks'); 
        this.load.text('scene2.ks', 'assets/scene2.ks'); 
        this.load.text('overlay_test.ks', 'assets/overlay_test.ks');
    }

   // src/scenes/GameScene.js の create() メソッドの正しい形

    create() {
        console.log("GameScene: クリエイト処理を開始します。");
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
        // this.choiceInputBlocker.input.enabled = false; // setVisible(false)で十分なので、この行は不要

        // --- マネージャー/UIクラスの生成 ---
        this.configManager = this.sys.registry.get('configManager');
        this.stateManager = this.sys.registry.get('stateManager'); 
        this.soundManager = new SoundManager(this, this.configManager);
        this.messageWindow = new MessageWindow(this, this.soundManager, this.configManager);
        this.layer.message.add(this.messageWindow); 
        this.scenarioManager = new ScenarioManager(this, this.layer, this.charaDefs, this.messageWindow, this.soundManager, this.stateManager, this.configManager);

        // --- HUDのインスタンス化 ---
        // ★★★ 修正箇所: CoinHudとHpBarにstateManagerを渡してインスタンス化 ★★★
        // これにより、各HUDが自分自身でStateManagerの変更を監視するようになります。
         this.coinHud = new CoinHud(this, 100, 50, this.stateManager); 
        this.playerHpBar = new HpBar(this, 100, 100, 200, 25, 'player', this.stateManager); // ★★★ この行にthis.stateManagerを追加 ★★★
        this.playerHpBar.setVisible(false);

        // ★★★ 削除: GameSceneがStateManagerのイベントを購読するロジックは不要になる ★★★
        // this.stateManager.on('f-variable-changed', this.onFVariableChanged, this); // この行を削除

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
            console.log("GameScene: 復帰処理を開始します。");
            this.performLoad(0, this.returnParams); 
        } else {
            console.log("GameScene: 通常起動します。");
            this.performSave(0);
           
            this.scenarioManager.loadScenario(this.startScenario, this.startLabel);

            // シーンの準備完了フラグを立てる
            this.isSceneFullyReady = true; 
            this.time.delayedCall(10, () => this.scenarioManager.next());
        }
        
        this.input.on('pointerdown', () => this.scenarioManager.onClick());
        console.log("GameScene: create 完了");
    }

      // ★★★ 修正箇所: stop()メソッドでイベントリスナーを解除 ★★★
      // ★★★ 削除: stop()メソッド内のイベントリスナー解除ロジックも不要 ★★★
    stop() {
        super.stop();
         if (this.stateManager) {
            // ★★★ 修正箇所: this.stateManager.events.off -> this.stateManager.off ★★★
            this.stateManager.off('f-variable-changed', this.onFVariableChanged, this);
        }
    
        // ★★★ coinHudの破棄は残す ★★★
        if (this.coinHud) { this.coinHud.destroy(); this.coinHud = null; }
    }

 // ★★★ セーブ処理 ★★★
     // ★★★ セーブ処理 (スロット0をオートセーブスロットとして使う) ★★★
    performSave(slot) {
        // [jump]や[call]の直前に、現在の状態をオートセーブする
        if (slot === 0) {
            console.log("オートセーブを実行します...");
        }
        try {
            const gameState = this.stateManager.getState(this.scenarioManager);
            const jsonString = JSON.stringify(gameState, null, 2);
            localStorage.setItem(`save_data_${slot}`, jsonString);
            console.log(`スロット[${slot}]にセーブしました。`);
        } catch (e) {
            console.error(`セーブに失敗しました: スロット[${slot}]`, e);
        }
    }

/**
 * 溜まっている選択肢情報を元に、ボタンを一括で画面に表示する
 */
displayChoiceButtons() {
     // ★ 選択肢表示時に、ブロッカーを最前面に表示
    this.choiceInputBlocker.setVisible(true);
    this.children.bringToTop(this.choiceInputBlocker);
    // Y座標の計算を、全体のボタン数に基づいて行う
    const totalButtons = this.pendingChoices.length;
    const startY = (this.scale.height / 2) - ((totalButtons - 1) * 60); // 全体が中央に来るように開始位置を調整
// ★★★ ボタンの見た目をここで定義 ★★★
    const buttonStyle = {
        fontSize: '40px', // 文字を少し大きく
        fill: '#ccc',
        backgroundColor: '#333333',
        // 内側の余白を調整
        padding: {
            x: 40, // 横の余白を増やす
            y: 10  // 縦の余白を増やす
        },
        align: 'center'
    };
     const buttonHeight = 120; // ボタン間のY座標の間隔
    this.pendingChoices.forEach((choice, index) => {
        const y = startY + (index * 120); // ボタン間のスペース

    const button = this.add.text(this.scale.width / 2, y, choice.text, { fontSize: '40px', fill: '#fff', backgroundColor: '#555', padding: { x: 20, y: 10 }})
        .setOrigin(0.5)
        .setInteractive();
   
        this.children.bringToTop(button);
        button.on('pointerdown', () => {
           
            this.scenarioManager.jumpTo(choice.target);
             this.clearChoiceButtons();
              this.scenarioManager.next(); 
        });

        this.choiceButtons.push(button);
    });

    //this.pendingChoices = []; // 溜めていた情報はクリア
}
 
// ★★★ ボタンを消すためのヘルパーメソッドを追加 ★★★
// GameScene.js の clearChoiceButtons() メソッド

clearChoiceButtons() {
    this.choiceInputBlocker.setVisible(false);
    this.choiceButtons.forEach(button => button.destroy());
    this.choiceButtons = [];
    this.pendingChoices = []; // 念のためこちらもクリア
    
    // ★★★ 修正箇所: isWaitingChoice はここで解除するが、next()は呼ばない ★★★
    if (this.scenarioManager) {
        this.scenarioManager.isWaitingChoice = false;
    }
    // next() の呼び出しは選択肢ボタンの onPointerDown イベントハンドラ内で行われるべき
}



 // src/scenes/GameScene.js の performLoad メソッド (最終版)
  async performLoad(slot, returnParams = null) {
     // ★★★ 修正箇所: ロード処理中であれば、二重実行を防止 ★★★
        if (this.isPerformingLoad) {
            console.warn("GameScene: performLoadが既に実行中です。二重呼び出しをスキップします。");
            // 二重呼び出しの場合でも、SystemSceneのフラグを解除するためにイベントを発生させる必要があるかも
            // ただし、この場合はGameSceneがSystemSceneのisProcessingTransitionをリセットしないよう注意
            return; 
        }
        this.isPerformingLoad = true; // ロード処理を開始
        try {
            const jsonString = localStorage.getItem(`save_data_${slot}`);
            if (!jsonString) {
                console.error(`スロット[${slot}]のセーブデータが見つかりません。復帰できません。`);
                // ロード失敗時もイベントを発行して SystemScene のフラグを解除する
                // ★SystemSceneが既に修正済みである前提★
                const systemScene = this.scene.get('SystemScene');
                if (systemScene) systemScene.events.emit('gameScene-load-complete'); // <- この行が重要
                return;
            }
            const loadedState = JSON.parse(jsonString);
            
            this.stateManager.setState(loadedState);

            if (returnParams) {
                console.log("復帰パラメータを反映します:", returnParams);
                for (const key in returnParams) {
                    const value = returnParams[key];
                    let evalExp;

                    if (typeof value === 'string') {
                        evalExp = `${key} = \`${value.replace(/`/g, '\\`')}\``; 
                    } else if (typeof value === 'number' || typeof value === 'boolean') {
                        evalExp = `${key} = ${value}`;
                    } else if (typeof value === 'object' && value !== null) {
                        try {
                            const stringifiedValue = JSON.stringify(value).replace(/`/g, '\\`'); 
                            evalExp = `${key} = JSON.parse(\`${stringifiedValue}\`)`;
                        } catch (e) {
                            console.warn(`[GameScene] returnParamsでJSONシリアライズできないオブジェクトが検出されました。スキップします: ${key} =`, value, e);
                            continue; 
                        }
                    } else {
                        console.warn(`[GameScene] 未知の型のreturnParams値が検出されました。スキップします: ${key} =`, value);
                        continue; 
                    }

                    this.stateManager.eval(evalExp);
                }
            }

            console.log(`スロット[${slot}]からロードしました。`, loadedState);

            await rebuildScene(this.scenarioManager, loadedState);
            
            if (loadedState.scenario.isWaitingClick || loadedState.scenario.isWaitingChoice) {
                console.log("ロード完了: 待機状態のため、ユーザーの入力を待ちます。");
            } else {
                console.log("ロード完了: 次の行からシナリオを再開します。");
                this.time.delayedCall(10, () => this.scenarioManager.next());
            }
            
            // ★★★ 全ての復帰処理が完了した後にフラグを立てる ★★★
            this.isSceneFullyReady = true; 
             console.log("---ロードフラグ  ---");
            // SystemSceneにロード完了を通知するカスタムイベントを発行
            // ★SystemSceneが既に修正済みである前提★
            const systemScene = this.scene.get('SystemScene');
            if (systemScene) systemScene.events.emit('gameScene-load-complete');
        console.log("---ロードコンプリート、イベント発行---");
        } catch (e) {
            console.error(`ロード処理でエラーが発生しました。`, e);
            // ★★★ 修正箇所: ロード失敗時もSystemSceneに通知し、フラグを解除させる ★★★
            const systemScene = this.scene.get('SystemScene');
            if (systemScene) systemScene.events.emit('gameScene-load-complete');
        }
    }
}
// ★★★ rebuildScene ヘルパー関数 (最終版) ★★★
async function rebuildScene(manager, state) {
    console.log("--- rebuildScene 開始 ---", state);
    const scene = manager.scene;

    // 1. 現在の表示と状態をクリア
    scene.clearChoiceButtons();
    manager.layers.background.removeAll(true);
    manager.layers.character.removeAll(true);
    scene.characters = {};
    manager.soundManager.stopBgm(); // フェードなしで即時停止
    manager.messageWindow.reset();
    scene.cameras.main.resetFX(); // カメラエフェクトもリセット

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
        // ★ BGMはフェードインなしで再生するのが一般的
        manager.soundManager.playBgm(state.sound.bgm, 0); 
    }
    
    // 6. メッセージウィンドウを復元 (クリック待ちだった場合)
    if (state.scenario.isWaitingClick) {
        // ★ 話者情報も渡して復元 ★
        manager.messageWindow.setText(state.scenario.currentText, false, () => {
            manager.messageWindow.showNextArrow();
        }, state.scenario.speakerName);
        // ハイライトも復元
        manager.highlightSpeaker(state.scenario.speakerName);
    }

    // ★★★ 7. 選択肢を復元 (順番を修正、条件を明確化) ★★★
    // isWaitingChoiceがtrueの場合のみ、pendingChoicesを復元し、ボタンを表示する
    if (state.scenario.isWaitingChoice && state.scenario.pendingChoices && state.scenario.pendingChoices.length > 0) {
        scene.pendingChoices = state.scenario.pendingChoices;
        scene.displayChoiceButtons(); // ★ これが呼ばれるようにする ★
        console.log("選択肢を復元し、表示しました。");
    } else {
        scene.pendingChoices = []; // 選択肢がない場合は空にする
    }
    
    console.log("--- rebuildScene 正常終了 ---");
    
}