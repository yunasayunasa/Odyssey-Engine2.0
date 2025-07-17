import ScenarioManager from '../core/ScenarioManager.js';
import SoundManager from '../core/SoundManager.js';
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
import { handleOverlayEnd } from '../handlers/overlay_end.js';
import { handleFadeout } from '../handlers/fadeout.js';
import { handleFadein } from '../handlers/fadein.js';
import { Layout } from '../core/Layout.js';
import { handleVideo } from '../handlers/video.js';
import { handleVoice } from '../handlers/voice.js';
export default class NovelOverlayScene extends Phaser.Scene {
    constructor() {
        super('NovelOverlayScene');
       this.scenarioManager = null; this.soundManager = null; this.stateManager = null;
        this.messageWindow = null; this.configManager = null; this.layer = {};
        this.charaDefs = null; this.characters = {};
        this.inputBlocker = null; // プロパティとして初期化
    } 
    

      init(data) {
        this.startScenario = data.scenario;
        this.charaDefs = data.charaDefs;
        // ★★★ 戻り先のシーンキーを保存 ★★★
        this.returnTo = data.from; // 'request-overlay'で渡された'from'キー
    }
    

    // ★★★ preloadメソッドを追加し、必要なシナリオを読み込む ★★★
    // ★★★ 2. 受け取ったシナリオファイルだけをロードする ★★★
    preload() {
        if (this.startScenario) {
            console.log(`NovelOverlayScene: シナリオ[${this.startScenario}]を読み込みます。`);
            this.load.text(this.startScenario, `assets/${this.startScenario}`);
        }
    }
   create() {
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
        
        // --- レイヤー生成 ---
        this.layer.character = this.add.container(0, 0);
        this.layer.cg = this.add.container(0, 0);
        this.layer.message = this.add.container(0, 0);

        // ★★★ 全画面を覆う、透明で見えない入力ブロッカーを作成 ★★★
        // Sceneのaddメソッドで直接Sceneに追加する
        this.inputBlocker = this.add.rectangle(640, 360, 1280, 720)
            .setInteractive()
            .setVisible(false)
            .setDepth(100); // UIより手前に来るように高いDepthを設定

        this.configManager = this.sys.registry.get('configManager');
        this.stateManager = new StateManager();
        this.soundManager = new SoundManager(this, this.configManager);
        this.messageWindow = new MessageWindow(this, this.soundManager, this.configManager);
        
        // ★★★ messageWindowはSceneのadd.existingで追加する ★★★
        // MessageWindow自身がContainerを継承しているので、add.existingで追加するのが正しい
        // this.layer.message.add(this.messageWindow); は MessageWindow自身のadd.existing で置き換わる
        // this.add.existing(this.messageWindow); // MessageWindowコンストラクタ内で既に行われているはず

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
        this.scenarioManager.registerTag('overlay_end', handleOverlayEnd);
        this.scenarioManager.registerTag('fadeout', handleFadeout);
this.scenarioManager.registerTag('fadein', handleFadein);
this.scenarioManager.registerTag('video', handleVideo);
this.scenarioManager.registerTag('voice', handleVoice);
           // --- ゲーム開始 ---
        this.scenarioManager.load(this.startScenario);
        this.input.on('pointerdown', () => { 
            // inputBlockerを常に最前面に持ってくる (depthが低い場合)
            this.children.bringToTop(this.inputBlocker); // これはSceneのchildrenに対する操作
            this.scenarioManager.onClick(); 
        });
        this.time.delayedCall(10, () => { this.scenarioManager.next(); }, [], this);
        console.log("NovelOverlayScene: create 完了");
    }




    // ★★★ performSave を GameScene と同じ最新版に書き換える ★★★
     performSave(slot) {
        // ★★★★★ この行を追加 ★★★★★
        console.trace("performSave (Overlay) が呼び出されました！犯人は誰だ！");

        try {
            const gameState = this.stateManager.getState(this.scenarioManager);
            
            const jsonString = JSON.stringify(gameState, null, 2);
            localStorage.setItem(`save_data_${slot}`, jsonString);
            console.log(`スロット[${slot}]にセーブしました。`, gameState);
        } catch (e) {
            console.error(`セーブに失敗しました: スロット[${slot}]`, e);
        }
    }

/**
 * 溜まっている選択肢情報を元に、ボタンを一括で画面に表示する
 */
displayChoiceButtons() {
     this.inputBlocker.setVisible(true);
        this.children.bringToTop(this.inputBlocker); 

    // Y座標の計算を、全体のボタン数に基づいて行う
    const totalButtons = this.pendingChoices.length;
    const startY = (this.scale.height / 2) - ((totalButtons - 1) * 60); // 全体が中央に来るように開始位置を調整

    this.pendingChoices.forEach((choice, index) => {
        const y = startY + (index * 120); // ボタン間のスペース

    const button = this.add.text(this.scale.width / 2, y, choice.text, { fontSize: '36px', fill: '#fff', backgroundColor: '#555', padding: { x: 20, y: 10 }})
        .setOrigin(0.5)
        .setInteractive();
    
        button.on('pointerdown', () => {
            this.clearChoiceButtons();
            this.scenarioManager.jumpTo(choice.target);
        });

        this.choiceButtons.push(button);
    });

    this.pendingChoices = []; // 溜めていた情報はクリア
}


clearChoiceButtons() {
    this.inputBlocker.setVisible(false);
    this.choiceButtons.forEach(button => button.destroy());
    this.choiceButtons = [];
    this.pendingChoices = []; // 念のためこちらもクリア
    if (this.scenarioManager) {
        this.scenarioManager.isWaitingChoice = false;
    }
}


   // ★★★ performLoad を GameScene と同じ最新版に書き換える ★★★
    async performLoad(slot) {
        try {
            const jsonString = localStorage.getItem(`save_data_${slot}`);
            if (!jsonString) {
                console.warn(`スロット[${slot}]にセーブデータがありません。`);
                return;
            }
            const loadedState = JSON.parse(jsonString);

            // StateManagerに変数を復元させる
            this.stateManager.setState(loadedState);
            console.log(`スロット[${slot}]からロードしました。`, loadedState);

            // ★★★ rebuildScene を呼び出す (このファイルの下部にある関数) ★★★
            await rebuildScene(this.scenarioManager, loadedState);
            
            // ロード後の再開処理
            if (!this.scenarioManager.isWaitingChoice && !this.scenarioManager.isWaitingClick) {
                console.log("ロード完了: 次の行からシナリオを再開します。");
                this.time.delayedCall(10, () => { this.scenarioManager.next(); }, [], this);
            } else {
                console.log("ロード完了: ユーザーの入力を待機します。");
            }
            
        } catch (e) {
            console.error(`ロード処理でエラーが発生しました。`, e);
        }
    }
} // ← NovelOverlayScene クラスはここで閉じる

/**
 * ★★★ rebuildScene ヘルパー関数を GameScene と同じ最新版に書き換える ★★★
 * ロードした状態に基づいて、シーンの表示とシナリオの内部状態を完全に再構築する
 * @param {ScenarioManager} manager - 操作対象のシナリオマネージャー
 * @param {Object} state - ロードした状態オブジェクト
 */
async function rebuildScene(manager, state) {
    console.log("--- rebuildScene 開始 (Overlay) ---", state);
    const scene = manager.scene;

    // 1. 現在の表示と状態をクリア
    scene.clearChoiceButtons();
    // オーバーレイなので背景(bg)はクリアしない
    manager.layers.character.removeAll(true);
    scene.characters = {};
    manager.soundManager.stopBgm(); // BGMは独立しているのでクリア
    manager.messageWindow.reset();

    // 2. シナリオの「論理的な状態」を復元
    manager.currentFile = state.scenario.fileName;
    manager.currentLine = state.scenario.line;
    manager.ifStack = state.scenario.ifStack || [];
    manager.callStack = state.scenario.callStack || [];
    manager.isWaitingClick = state.scenario.isWaitingClick || false;
    manager.isWaitingChoice = state.scenario.isWaitingChoice || false;

    // シナリオテキストをキャッシュから再設定
    await manager.loadScenario(manager.currentFile);
    manager.currentLine = state.scenario.line; 

    // 3. 背景は復元しない（オーバーレイなので）
    
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
        manager.soundManager.playBgm(state.sound.bgm);
    }
    
    // 6. メッセージウィンドウを復元
    if (state.scenario.isWaitingClick) {
        manager.messageWindow.setSpeaker(state.scenario.speakerName);
        manager.messageWindow.setText(state.scenario.currentText, true); 
        manager.messageWindow.showClickIndicator();
    }

    // 7. 選択肢を復元
    if (state.scenario.isWaitingChoice) {
        scene.pendingChoices = state.scenario.pendingChoices || [];
        if (scene.pendingChoices.length > 0) {
            scene.displayChoiceButtons();
        }
    }
    
    console.log("--- rebuildScene 正常終了 (Overlay) ---");
}