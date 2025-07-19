// src/scenes/PreloadScene.js (Phaser起動問題を解決するための最終修正)

import ConfigManager from '../core/ConfigManager.js';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        // main.jsでactive:trueが設定されるため、ここではactiveは指定しない
        super({ key: 'PreloadScene', active: true }); 
        
         //UI要素への参照を初期化 (stop()で破棄するため)
        this.progressBar = null;
        this.progressBox = null;
        this.percentText = null;
        this.loadingText = null;
    }

    preload() {
        console.log("PreloadScene: preload開始 - ロード画面UIを生成し、アセットをキューに追加します。");
        
        // --- 1. ロード画面UIの表示 (preloadでUIを生成) ---
        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x222222, 0.8).fillRect(340, 320, 600, 50);
        this.progressBar = this.add.graphics(); 
        this.percentText = this.add.text(640, 345, '0%', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        this.loadingText = this.add.text(640, 280, 'Now Loading...', { fontSize: '36px', fill: '#ffffff' }).setOrigin(0.5);
        
        // ロードの進捗イベントリスナーを登録
        this.load.on('progress', (value) => {
            this.percentText.setText(parseInt(value * 100) + '%');
            this.progressBar.clear().fillStyle(0xffffff, 1).fillRect(350, 330, 580 * value, 30);
        });
        
        // --- 2. 全てのアセットをロードキューに追加 (preloadメソッド内で行う) ---
        // asset_define.json と webfont.js をロード
        this.load.json('asset_define', 'assets/asset_define.json');
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

        // ★★★ 修正箇所: preload()内で最初のロードが完了した後の処理を定義 ★★★
        // この 'complete' イベントは、preload()内でキューに追加されたアセット（asset_define.jsonとwebfont.js）が
        // 全てロードされた後に発火します。
        this.load.once('complete', () => {
            console.log("PreloadScene: preload段階のアセット（asset_define.json等）ロード完了。");
            const assetDefine = this.cache.json.get('asset_define');

            // asset_define.json の内容に基づいて、残りの全てのアセットをロードキューに「追加」
            for (const key in assetDefine.images) { this.load.image(key, assetDefine.images[key]); }
            for (const key in assetDefine.sounds) { this.load.audio(key, assetDefine.sounds[key]); }
            for (const key in assetDefine.videos) { this.load.video(key, assetDefine.videos[key]); }
            
            // ゲームで使う可能性のあるシナリオファイルをすべてロード
            this.load.text('scene1.ks', 'assets/scene1.ks');
            this.load.text('scene2.ks', 'assets/scene2.ks');
            this.load.text('overlay_test.ks', 'assets/overlay_test.ks');
            this.load.text('test.ks', 'assets/test.ks'); 
            this.load.text('test_main.ks', 'assets/test_main.ks'); 
            this.load.text('test_sub.ks', 'assets/test_sub.ks'); 

            // ★★★ ここで、追加したアセットのロードを「開始」します。
            // これにより、preload()メソッドの実行が完了し、create()メソッドが呼び出される前に、
            // 全てのアセットがロードされることが保証されます。
            this.load.start(); 
        }, this); // コールバックのスコープをPreloadSceneインスタンスにする

        // ★★★ 修正箇所: preload()の最後に、初期ロード（asset_define.json）を開始します。 ★★★
        // preload()が実行されると、自動的にロードが開始されるため、通常は明示的なthis.load.start()は不要ですが、
        // 二段階ロードのこのパターンでは必要です。
        this.load.start(); 
    }

    create() {
        console.log("PreloadScene: create 開始 - 全てのゲームアセットがロード済みです。");
        // create() が呼ばれる時点では、全てのアセットはロード済みであるため、
        // ここではロードキューへの追加やthis.load.start()は行いません。
        
        // ConfigManagerを初期化し、Registryにセット
        const configManager = new ConfigManager();
        this.registry.set('configManager', configManager);
        
        // キャラクター定義の生成 (assetDefineはcacheから取得)
        const assetDefine = this.cache.json.get('asset_define');
        const charaDefs = {};
        for (const key in assetDefine.images) {
            const parts = key.split('_');
            if (parts.length === 2) {
                const [charaName, faceName] = parts;
                if (!charaDefs[charaName]) charaDefs[charaName] = { jname: charaName, face: {} };
                charaDefs[charaName].face[faceName] = key;
            }
        }
            
        // SystemSceneを起動し、そのCREATEイベントを待って初期ゲーム開始を依頼する
        // SystemSceneはmain.jsでactive:falseになっているため、launchする必要がある
        this.scene.launch('SystemScene'); 
        const systemScene = this.scene.get('SystemScene'); 
        
        if (systemScene) {
            systemScene.events.once(Phaser.Scenes.Events.CREATE, () => {
                systemScene.startInitialGame(charaDefs, 'test.ks'); 
                console.log("PreloadScene: SystemSceneのCREATEイベント受信、初期ゲーム起動を依頼しました。");
            });
        } else {
            console.error("PreloadScene: SystemSceneのインスタンスが取得できませんでした。ゲーム起動に失敗。");
        }

        //this.scene.launch('UIScene'); 

            // GameSceneを開始
            this.scene.start('GameScene', { 
                charaDefs: charaDefs,
                startScenario: 'test.ks'
            });

        // PreloadSceneは役割を終えるので停止する
        this.scene.stop(this.scene.key);
    }

    stop() {
        super.stop();
        console.log("PreloadScene: stop されました。ロード画面UIを破棄します。");
        if (this.progressBar) { this.progressBar.destroy(); this.progressBar = null; }
        if (this.progressBox) { this.progressBox.destroy(); this.progressBox = null; }
        if (this.percentText) { this.percentText.destroy(); this.percentText = null; }
        if (this.loadingText) { this.loadingText.destroy(); this.loadingText = null; }
    }
}