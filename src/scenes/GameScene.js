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

        async create() { 
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
            .setDepth(0);
        this.choiceInputBlocker.on('pointerdown', () => console.log("選択肢を選んでください"));
        // this.choiceInputBlocker.input.enabled = false; // setVisible(false)で十分なので、この行は不要

        // --- マネージャー/UIクラスの生成 ---
        this.configManager = this.sys.registry.get('configManager');
        this.stateManager = this.sys.registry.get('stateManager'); 
           // ★★★ 修正箇所: SoundManagerをnewするのではなく、Registryから取得 ★★★
        this.soundManager = this.sys.registry.get('soundManager');
        this.messageWindow = new MessageWindow(this, this.soundManager, this.configManager);
        this.layer.message.add(this.messageWindow); 
        this.scenarioManager = new ScenarioManager(this, this.layer, this.charaDefs, this.messageWindow, this.soundManager, this.stateManager, this.configManager);
  // ★★★ 追加: 最初のクリックで一度だけAudioContextを有効化する ★★★
     
        // --- HUDのインスタンス化 ---
        // ★★★ 修正箇所: CoinHudとHpBarにstateManagerを渡してインスタンス化 ★★★
        // これにより、各HUDが自分自身でStateManagerの変更を監視するようになります。
           console.log("HpBarを生成する直前のthis.stateManager:", this.stateManager);
          this.coinHud = new CoinHud(this, {
            x: 100,
            y: 50,
            stateManager: this.stateManager // ★★★ ここでstateManagerを確実に渡す ★★★
        }); 
       // ★★★ 修正箇所: HpBarをオブジェクト形式の引数でインスタンス化 ★★★
        this.playerHpBar = new HpBar(this, {
            x: 100,
            y: 100,
            width: 200,
            height: 25,
            type: 'player',
            stateManager: this.stateManager // ★★★ ここでstateManagerを確実に渡す ★★★
        });
        this.playerHpBar.setVisible(false);
     // ★★★ 修正箇所: StateManagerのイベントリスナーをここで登録 ★★★
        this.stateManager.on('f-variable-changed', this.onFVariableChanged, this);

        // ★★★ 追加: 最初のクリックで一度だけAudioContextを有効化する ★★★
        this.input.once('pointerdown', () => {
            if (this.soundManager) {
                this.soundManager.resumeContext();
            }
        }, this);
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
        console.log("[LOG-BOMB] GameScene.create: AWAITING performLoad..."); // ★
        await this.performLoad(0, this.returnParams);
        console.log("[LOG-BOMB] GameScene.create: ...performLoad COMPLETED."); // ★
     } else {
        console.log("GameScene: 通常起動します。");
        this.performSave(0);
        this.scenarioManager.loadScenario(this.startScenario, this.startLabel);
        this.isSceneFullyReady = true;

        // ★★★ 修正の核心 (通常起動時) ★★★
        // イベントの発行を、ごくわずかに（1フレーム後）遅らせる
        this.time.delayedCall(1, () => {
            this.events.emit('gameScene-load-complete');
            console.log("GameScene: 通常起動完了。ロード完了イベントを発行しました。(遅延発行)");
        });
        this.time.delayedCall(10, () => this.scenarioManager.next());
    }
        this.input.on('pointerdown', () => this.scenarioManager.onClick());
        console.log("GameScene: create 完了");
            console.log("[LOG-BOMB] GameScene.create: END");
    }

    // ★★★ 修正箇所: stop()メソッドを一つに統一し、全てのクリーンアップを行う ★★★
    shutdown() {
    console.log("GameScene: shutdown されました。全てのマネージャーとリソースを停止・破棄します。");

    // 1. ScenarioManagerのループを完全に停止させる
    if (this.scenarioManager) {
        this.scenarioManager.stop();
    }

    // 2. StateManagerのイベントリスナーを解除
    if (this.stateManager) {
        // ★★★ 修正: GameSceneが独自に購読しているリスナーを全て解除 ★★★
        this.stateManager.off('f-variable-changed', this.onFVariableChanged, this);
        this.events.off('force-hud-update'); // もし使っていれば
    }
    
    // 3. 全てのPhaserオブジェクト（HUD、MessageWindowなど）を破棄
    // この部分は既存のままでOK
    if (this.coinHud) { this.coinHud.destroy(); this.coinHud = null; }
    if (this.playerHpBar) { this.playerHpBar.destroy(); this.playerHpBar = null; }
    if (this.messageWindow) { this.messageWindow.destroy(); this.messageWindow = null; }
    // ... 他のUI要素も同様にdestroy ...
    this.clearChoiceButtons();
    this.uiButtons.forEach(b => b.destroy());
    this.uiButtons = [];

    // 4. ★★★★★ このシーンが管理するBGMを停止しない ★★★★★
    // BGMの管理はSystemSceneと各シーンのcreateに任せるため、この行をコメントアウトまたは削除
    // if (this.soundManager) {
    //     this.soundManager.stopBgm(0); 
    // }
    
    super.shutdown(); // Phaser.Sceneの親シャットダウン処理を呼ぶ
}

      // ★★★ 修正箇所: onFVariableChanged, updatePlayerHpBar, updateCoinHudを削除し、onFVariableChangedに一本化 ★★★
    onFVariableChanged(key, value) {
        if (!this.isSceneFullyReady) return;

        if (key === 'coin' && this.coinHud) {
            this.coinHud.setCoin(value);
        } else if (key === 'player_hp' && this.playerHpBar) {
            const maxHp = this.stateManager.f.player_max_hp || 100;
            this.playerHpBar.setHp(value, maxHp);
        } else if (key === 'player_max_hp' && this.playerHpBar) {
            const currentHp = this.stateManager.f.player_hp || 0;
            this.playerHpBar.setHp(currentHp, value);
        }
    }
 // ★★★ セーブ処理 ★★★
     // ★★★ セーブ処理 (スロット0をオートセーブスロットとして使う) ★★★
    performSave(slot) {
    if (slot === 0) { // オートセーブの場合のみ
        // ★★★ BGMキーを `sf` (システム変数) に保存 ★★★
        const currentBgmKey = this.soundManager.getCurrentBgmKey();
        if (currentBgmKey) {
            this.stateManager.sf.tmp_current_bgm = currentBgmKey;
        } else {
            delete this.stateManager.sf.tmp_current_bgm;
        }
        // sf変数の変更を永続化
        this.stateManager.saveSystemVariables(); 
    }
    try {
        const gameState = this.stateManager.getState(this.scenarioManager);
        // ★★★ state.sound.bgmには常に最新の情報が入るようになる ★★★
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




async performLoad(slot, returnParams = null) {
    console.log("[LOG-BOMB] performLoad: START");
    this.isPerformingLoad = true;
    let success = false; // ロードが成功したかを追跡するフラグ

     try {
        const jsonString = localStorage.getItem(`save_data_${slot}`);
        if (!jsonString) {
            console.error(`スロット[${slot}]のセーブデータが見つかりません。`);
            // この場合、シーンは復元できないので、早期に終了
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

        
                        console.log("[LOG-BOMB] performLoad: AWAITING rebuildScene..."); // ★
            await rebuildScene(this.scenarioManager, loadedState);
            console.log("[LOG-BOMB] performLoad: ...rebuildScene COMPLETED."); // ★
          // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ これが新しい解決策：汎用的な更新イベントを発行 ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        this.events.emit('force-hud-update');
        console.log("GameScene: すべてのHUDに強制更新リクエストを発行しました。");
            if (loadedState.scenario.isWaitingClick || loadedState.scenario.isWaitingChoice) {
                console.log("ロード完了: 待機状態のため、ユーザーの入力を待ちます。");
            } else {
                console.log("ロード完了: 次の行からシナリオを再開します。");
                this.time.delayedCall(10, () => this.scenarioManager.next());
            }
            
                    this.isSceneFullyReady = true;
        console.log(`スロット[${slot}]からロードしました。`);
        success = true; // 成功フラグを立てる

    } catch (e) {
        console.error(`ロード処理でエラーが発生しました。`, e);
        success = false; // 失敗フラグ

    } finally {
        // ★★★ 修正の核心 ★★★
        // tryまたはcatchの処理が完了した後、"必ず"実行されるブロック
        this.isPerformingLoad = false;
         console.log("[LOG-BOMB] performLoad: FINALLY block reached."); // ★
        // イベントの発行を次のフレームに遅延させる
        this.time.delayedCall(1, () => {
            this.events.emit('gameScene-load-complete');
            
            console.log("[LOG-BOMB] performLoad: Event emitted from finally block."); // ★
            console.log("GameScene: 処理完了。ロード完了イベントを発行しました。(finallyブロック)");
        });
    }
}
}
// ★★★ rebuildScene ヘルパー関数 (最終版) ★★★
async function rebuildScene(manager, state) {
    console.log("[LOG-BOMB] rebuildScene: START"); // ★
    console.log("--- rebuildScene 開始 ---", state);
    const scene = manager.scene;

    // 1. 現在の表示と状態をクリア
    scene.clearChoiceButtons();
    manager.layers.background.removeAll(true);
    manager.layers.character.removeAll(true);
    scene.characters = {};
    console.log("[LOG-BOMB] rebuildScene: AWAITING stopBgm..."); // ★
    
    manager.messageWindow.reset();
    scene.cameras.main.resetFX(); // カメラエフェクトもリセット
console.log("[LOG-BOMB] rebuildScene: AWAITING stopBgm..."); // ★
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

        // ★★★★★ 5. BGMを復元 ★★★★★
    const soundManager = manager.soundManager;
    const currentBgmKey = soundManager.getCurrentBgmKey();
    const targetBgmKey = state.sound.bgm; // ★★★ `bgmKey` ではなく `bgm` ★★★

    // 再生すべきBGMキーがセーブデータに存在する場合
    if (targetBgmKey) {
        // 現在再生中の曲と違う場合のみ、新しい曲を再生
        if (currentBgmKey !== targetBgmKey) {
            await soundManager.playBgm(targetBgmKey, 500);
        }
    } else {
        // セーブデータにBGM情報がなく、何か再生中なら停止する
        if (currentBgmKey) {
            await soundManager.stopBgm(500);
        }
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
