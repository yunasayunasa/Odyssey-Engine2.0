// src/scenes/SystemScene.js (矛盾を解消し、堅牢性を高める最終修正)
import SoundManager from '../core/SoundManager.js'; // ★★★ この行を追加 ★★★
export default class SystemScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SystemScene' }); // main.jsでactive:falseに統一済み
        this.globalCharaDefs = null;
        this.isProcessingTransition = false; 
        this.targetSceneKey = null; 
        this.initialGameData = null;
        this.instanceId = Math.random(); // ★★★ 追加: デバッグ用のインスタンスID ★★★
    }

    init(data) {
        if (data && data.initialGameData) {
            this.initialGameData = data.initialGameData;
        }
    }

     create() {
        console.log("SystemScene: 起動・グローバルサービスのセットアップを開始。");

        // ★★★ 新しい責務: グローバルサービス(SoundManager)の生成と登録 ★★★
        const soundManager = new SoundManager(this.game);
        this.sys.registry.set('soundManager', soundManager);
        
        // ★★★ 修正箇所: グローバルなAudioContext再開リスナーをここに設置 ★★★
        this.input.once('pointerdown', () => {
            soundManager.resumeContext();
        }, this);
        
        console.log("SystemScene: SoundManagerを生成・登録しました。");






        // --- 1. [jump] や [call] によるシーン遷移リクエストを処理 ---
         this.events.on('request-scene-transition', (data) => {
            console.log(`[SystemScene] シーン遷移リクエスト: ${data.from} -> ${data.to}`, data.params);

            // ★★★ 修正箇所: 遷移元のシーンを汎用的に停止する ★★★
            // GameSceneだけでなく、BattleSceneなど、どのシーンからでも遷移できるようにする
            const fromScene = this.scene.get(data.from);
            if (fromScene && fromScene.scene.isActive()) {
                fromScene.input.enabled = false;
                fromScene.scene.stop(data.from);
                console.log(`[SystemScene] シーン[${data.from}]を停止しました。`);
            }
            
            // UISceneは停止しない。入力だけ無効化。
            if (this.scene.isActive('UIScene')) {
              this.scene.get('UIScene').input.enabled = false;
            }
            
            startAndMonitorScene(data.to, {
                charaDefs: this.globalCharaDefs,
                transitionParams: data.params, 
                startScenario: data.to === 'GameScene' ? 'test_main.ks' : null,
                startLabel: null,
            }, data.to === 'GameScene');
        });


        // --- 2. サブシーンからノベルパートへの復帰リクエストを処理 ---
        this.events.on('return-to-novel', (data) => {
            console.log(`[SystemScene ${this.instanceId}] ノベル復帰リクエスト: from ${data.from}`, data.params);

            const fromScene = this.scene.get(data.from);
            if (fromScene) { 
                fromScene.input.enabled = false;
            }
            if (data.from && this.scene.isActive(data.from)) { 
                this.scene.stop(data.from);
            }
             // ★★★ 追加: UISceneがisActiveであれば、表示を有効化する ★★★
        const uiSceneInstance = this.scene.get('UIScene');
        if (uiSceneInstance && uiSceneInstance.scene.isActive()) { 
            // setVisibleメソッドがあればそれを使うのが良い
            if (typeof uiSceneInstance.setVisible === 'function') {
                uiSceneInstance.setVisible(true); 
                 const uiScene = this.scene.get('UIScene'); 
                            if (uiScene && uiScene.scene.isActive()) { 
                                uiScene.input.enabled = true;
                            }
                            console.log("SystemScene: GameSceneとUISceneの入力を再有効化しました。");

            } else {
                // setVisibleがなければ、シーンのcameras.main.visibleで代用
                uiSceneInstance.cameras.main.visible = true;
            }
            console.log("SystemScene: UISceneの表示を有効化しました。");
        }
        
        // GameSceneへの復帰なので、必ずGameSceneのロード完了を待つ
        startAndMonitorScene('GameScene', {
            charaDefs: this.globalCharaDefs,
            resumedFrom: data.from,
            returnParams: data.params,
        }, true); 
    });
           
        // ★★★ 修正箇所: startInitialGameメソッドを、PreloadSceneから渡されたデータで起動するように修正 ★★★
           this.startInitialGame = (initialData) => {
            this.globalCharaDefs = initialData.charaDefs;
            console.log(`[SystemScene] 初期ゲーム起動リクエストを受信しました。`);
            this.scene.launch('UIScene');
            
            // startAndMonitorSceneを使ってGameSceneを起動
            startAndMonitorScene('GameScene', { 
                charaDefs: this.globalCharaDefs,
                startScenario: initialData.startScenario,
                startLabel: null,
            });
        };
        
        // ★★★ PreloadSceneから渡されたデータで初期ゲームを起動 ★★★
        if (this.initialGameData) {
            this.startInitialGame(this.initialGameData);
        }
    


        // --- オーバーレイ関連のイベントリスナー ---
        this.events.on('request-overlay', (data) => {
            console.log("[SystemScene] オーバーレイ表示リクエスト", data);
            // オーバーレイ表示中は、現在のシーンの入力を無効化
            const fromScene = this.scene.get(data.from);
            if (fromScene) {
                fromScene.input.enabled = false; 
            }
            // UISceneの入力は無効化しない (オーバーレイはUI上に重なるため)
            
            this.scene.launch('NovelOverlayScene', { 
                scenario: data.scenario,
                charaDefs: this.globalCharaDefs,
                returnTo: data.from
            });
        });
        
        this.events.on('end-overlay', (data) => {
            console.log(`[SystemScene] オーバーレイ終了`, data);
            this.scene.stop(data.from); 
            const returnScene = this.scene.get(data.returnTo);
            if (returnScene) { 
                returnScene.input.enabled = true; 
                console.log(`SystemScene: シーン[${data.returnTo}]の入力を再有効化しました。`);
            }
        });
          this.events.on('game-over-ui-ready', () => {
            console.log("[SystemScene] ゲームオーバーUIの準備完了通知を受信。ゲーム全体の入力を有効化します。");
            this.game.input.enabled = true;
            // 遷移中フラグは立てたままでも良いが、リトライ/タイトル選択は新しい遷移なのでリセットする
            this.isProcessingTransition = false;
            this.targetSceneKey = null;
        });
    }
}
    
