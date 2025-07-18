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
// import文に追加
import { handleFadeout } from '../handlers/fadeout.js';
import { handleFadein } from '../handlers/fadein.js';
import { handleVideo } from '../handlers/video.js';
import { handleStopVideo } from '../handlers/stopvideo.js';
import { handleVoice } from '../handlers/voice.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
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
         this.isSceneFullyReady = false; // ★★★ 追加: シーンが完全に準備完了したかのフラグ ★★★
    }

    init(data) {
        this.charaDefs = data.charaDefs;
        this.startScenario = data.startScenario || 'scene1.ks';
        this.startLabel = data.startLabel || null;

        // ★ isResumingとreturnParamsはSystemSceneとの連携で使うので残しておく
        this.isResuming = data.resumedFrom ? true : false;
        this.returnParams = data.returnParams || null;
         this.isSceneFullyReady = false; // ★init時にリセット★
    }

    preload() {
        // PreloadSceneでロード済みのはずだが、念のため
        this.load.text('scene1', 'assets/scene1.ks');
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');
        
         // --- レイヤー生成とdepth設定 (最終版) ---
        // 数値が大きいほど手前に描画される
        this.layer.background = this.add.container(0, 0).setDepth(0);  // 最奥
        this.layer.cg = this.add.container(0, 0).setDepth(0);         // 背景CGなど
        this.layer.character = this.add.container(0, 0).setDepth(0); // キャラクター
        this.layer.message = this.add.container(0, 0).setDepth(20);   // メッセージウィンドウ、選択肢ボタン

        // ★★★ GameSceneのコンストラクタで生成される inputBlocker も depth 設定 ★★★
        this.choiceInputBlocker = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height)
            .setInteractive()
            .setVisible(false)
            .setDepth(0); // メッセージウィンドウよりさらに手前（最前面）

        // --- マネージャー/UIクラスの生成 ---
        this.configManager = this.sys.registry.get('configManager');
        this.stateManager = new StateManager();
        this.soundManager = new SoundManager(this, this.configManager);
        this.messageWindow = new MessageWindow(this, this.soundManager, this.configManager);
        this.layer.message.add(this.messageWindow);
        this.scenarioManager = new ScenarioManager(this, this.layer, this.charaDefs, this.messageWindow, this.soundManager, this.stateManager, this.configManager);

         // ★★★ コイン表示HUDをインスタンス化 ★★★
    this.coinHud = new CoinHud(this, 100, 50); // 画面左上 (X=100, Y=50) に配置
    
    // ★★★ ゲームループの 'update' イベントで f.coin の値を監視し、HUDを更新 ★★★
    this.events.on('update', this.updateCoinHud, this);
    // または、StateManagerにf.coinの変更を通知する仕組みを作る（より高度）
    // ★★★ HPバーHUDをインスタンス化 (画面右上に隠しておくか、表示しない) ★★★
    // ノベルパートでは基本HPバーは非表示だが、テスト用に配置
    this.playerHpBar = new HpBar(this, 100, 100, 200, 25, 'player'); // プレイヤーHPバー
    this.playerHpBar.setVisible(false); // 通常は非表示

    // ★★★ ゲームループの 'update' イベントで f.player_hp の値を監視し、HUDを更新 ★★★
    this.events.on('update', this.updatePlayerHpBar, this);

        
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
          // --- ★★★ ゲーム開始ロジック (最終版) ★★★ ---
        if (this.isResuming) {
            // --- サブシーンからの復帰の場合 ---
            console.log("GameScene: 復帰処理を開始します。");
            
            // ★ 最後にセーブした「スロット0」をオートセーブとしてロードする
            this.performLoad(0, this.returnParams); 

        } else {
            // --- 通常の初回起動の場合 ---
            console.log("GameScene: 通常起動します。");
            // [jump]の前にオートセーブを実行しておく
            this.performSave(0); 
            
            this.scenarioManager.loadScenario(this.startScenario, this.startLabel);
            this.time.delayedCall(10, () => this.scenarioManager.next());
        }
         // ★★★ ゲームループの 'update' イベントで f.coin の値を監視し、HUDを更新 ★★★
        // イベントリスナーをプロパティに保持し、stop() で解除できるようにする
        this.updateCoinHudListener = this.events.on('update', this.updateCoinHud, this);
        
        // ★★★ ゲームループの 'update' イベントで f.player_hp の値を監視し、HUDを更新 ★★★
        // イベントリスナーをプロパティに保持し、stop() で解除できるようにする
        this.updatePlayerHpBarListener = this.events.on('update', this.updatePlayerHpBar, this);
        this.input.on('pointerdown', () => this.scenarioManager.onClick());
        console.log("GameScene: create 完了");
    }

     // ★★★ GameSceneに stop() メソッドを追加 ★★★
    stop() {
        super.stop();
        console.log("GameScene: stop されました。UI要素とイベントリスナーを破棄します。");

        // updateイベントリスナーを解除
        if (this.updateCoinHudListener) {
            this.updateCoinHudListener.removeListener('update', this.updateCoinHud, this);
            this.updateCoinHudListener = null;
        }
        if (this.updatePlayerHpBarListener) {
            this.updatePlayerHpBarListener.removeListener('update', this.updatePlayerHpBar, this);
            this.updatePlayerHpBarListener = null;
        }

        // HUDオブジェクトを破棄
        if (this.coinHud) { this.coinHud.destroy(); this.coinHud = null; }
        if (this.playerHpBar) { this.playerHpBar.destroy(); this.playerHpBar = null; }

        // メッセージウィンドウ、選択肢ブロッカー、レイヤーなども破棄 (必要であれば)
        // messageWindowはScenarioManagerが管理している可能性があるので注意
        if (this.messageWindow) { 
            // MessageWindow自体をPhaserオブジェクトとして管理しているならdestroy()
            // または、ScenarioManagerが適切にリセットしているか確認
            // 今回のエラーとは直接関係ないが、リソースリークを防ぐために考慮
        }
        if (this.choiceInputBlocker) { 
            this.choiceInputBlocker.destroy(); 
            this.choiceInputBlocker = null; 
        }

        // シーン内の表示オブジェクトをすべて破棄 (コンテナ内のオブジェクトも含む)
        // これを呼ぶと、this.layer.background.removeAll(true) などが不要になる場合がある
        // this.children.each(child => child.destroy()); // 全ての子要素を破棄
        // ただし、レイヤー管理と衝突する可能性があるので、既存の removeAll(true) が適切

        // rebuildSceneでremoveAll(true)しているので、ここではUI要素のdestroyに焦点を当てる
    }

     // ★★★ プレイヤーHPバーを更新するメソッドを修正 ★★★
    updatePlayerHpBar() {
        if (!this.isSceneFullyReady) return; // ★★★ シーンが準備完了するまで更新しない ★★★

        const currentPlayerHp = this.stateManager.f.player_hp || 0;
        const maxPlayerHp = this.stateManager.f.player_max_hp || 100;
        if (this.playerHpBar.currentHp !== currentPlayerHp || this.playerHpBar.maxHp !== maxPlayerHp) {
            this.playerHpBar.setHp(currentPlayerHp, maxPlayerHp);
        }
    }

   // ★★★ コインHUDを更新するメソッドを修正 ★★★
    updateCoinHud() {
        if (!this.isSceneFullyReady) return; // ★★★ シーンが準備完了するまで更新しない ★★★

        const currentCoin = this.stateManager.f.coin || 0;
        if (this.coinHud.coinText.text !== currentCoin.toString()) {
            this.coinHud.setCoin(currentCoin);
        }
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



  // GameScene.js の performLoad メソッド (最終版)

    // src/scenes/GameScene.js

// ... (他の import や GameScene クラスの定義)

   async performLoad(slot, returnParams = null) {
        try {
            const jsonString = localStorage.getItem(`save_data_${slot}`);
            if (!jsonString) {
                console.error(`スロット[${slot}]のセーブデータが見つかりません。復帰できません。`);
                // ★★★ 追加: ロード失敗時もイベントを発行して SystemScene のフラグを解除する ★★★
                this.scene.get('SystemScene').events.emit('gameScene-load-complete');
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
            
            // ★★★ 追加: 全ての復帰処理が完了した後にフラグを立てる ★★★
            this.isSceneFullyReady = true; 
            // SystemSceneにロード完了を通知するカスタムイベントを発行
            this.scene.get('SystemScene').events.emit('gameScene-load-complete');
        
        } catch (e) {
            console.error(`ロード処理でエラーが発生しました。`, e);
            // ★★★ 追加: ロード失敗時もイベントを発行して SystemScene のフラグを解除する ★★★
            this.scene.get('SystemScene').events.emit('gameScene-load-complete');
        }
    }}

// ... (rebuildScene ヘルパー関数など、後続のコード)
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
