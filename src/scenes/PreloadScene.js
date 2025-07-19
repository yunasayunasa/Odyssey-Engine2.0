// src/scenes/PreloadScene.js (二重起動問題を解決するための修正 - ステップ1-2)

import ConfigManager from '../core/ConfigManager.js'; // ConfigManagerをここでimport

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        // ★★★ 修正箇所: constructorからactive:trueを削除 (main.jsで制御するため) ★★★
        super('PreloadScene'); 
        // UI要素への参照を初期化 (stop()で破棄するため)
        this.progressBar = null;
        this.progressBox = null;
        this.percentText = null;
        this.loadingText = null; // 'Now Loading...' text
    }

    preload() {
        console.log("PreloadScene: 起動。全アセットのロードを開始します。");
        
        // --- 1. ロード画面UIの表示 (preloadでUIも作るのが一般的) ---
        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x222222, 0.8).fillRect(340, 320, 600, 50);
        this.progressBar = this.add.graphics(); 
        this.percentText = this.add.text(640, 345, '0%', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        this.loadingText = this.add.text(640, 280, 'Now Loading...', { fontSize: '36px', fill: '#ffffff' }).setOrigin(0.5);
        
        // ロードの進捗イベントリスナー
        this.load.on('progress', (value) => {
            this.percentText.setText(parseInt(value * 100) + '%');
            this.progressBar.clear().fillStyle(0xffffff, 1).fillRect(350, 330, 580 * value, 30);
        });
        
        // --- 2. 全てのアセットをロードキューに追加 (preloadメソッド内で行う) ---
        // 最初に asset_define.json と webfont.js をロード
        this.load.json('asset_define', 'assets/asset_define.json');
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

        // ★★★ 修正箇所: preload()内でasset_define.jsonのロード完了を待つロジックを追加 ★★★
        // preload()内で追加されたアセットが全てロードされた後、このコールバックが呼ばれます。
        this.load.once('complete', () => {
            console.log("PreloadScene: preload段階のアセットロード完了。asset_define.jsonを読み込みます。");
            const assetDefine = this.cache.json.get('asset_define');

            // asset_define.json の内容に基づいて、残りの全てのアセットをロードキューに追加
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

            // ★★★ 全てのアセットがキューに追加されたので、最終的なロードを開始 ★★★
            // これにより、create()は全てのアセットがロードされた後に実行されることが保証されます。
            this.load.start(); 
        }, this); // コールバックのスコープをPreloadSceneインスタンスにする

        // ★★★ 修正箇所: ここで最初のロードを開始（preloadの最後） ★★★
        // これにより、preload() が完了し、create() が呼ばれる前に asset_define.json が利用可能になります。
        this.load.start(); 
    }

    create() {
        console.log("PreloadScene: create 開始。全てのゲームアセットがロード済みです。");
        // create() が呼ばれる時点では、全てのゲームアセットはロード済みであるため、
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
            
        // ★★★ SystemSceneを起動し、そのCREATEイベントを待って初期ゲーム開始を依頼する ★★★
        // SystemSceneはmain.jsでactive:falseになっているため、launchする必要がある
        this.scene.launch('SystemScene'); 
        const systemScene = this.scene.get('SystemScene'); // launchしたのでインスタンスが取得できるはず
        
        if (systemScene) {
            // SystemSceneが完全にcreateされたことを確認してからstartInitialGameを呼び出す
            systemScene.events.once(Phaser.Scenes.Events.CREATE, () => {
                systemScene.startInitialGame(charaDefs, 'test.ks'); 
                console.log("PreloadScene: SystemSceneのCREATEイベント受信、初期ゲーム起動を依頼しました。");
            });
        } else {
            console.error("PreloadScene: SystemSceneのインスタンスが取得できませんでした。ゲーム起動に失敗。");
            // フェールセーフとして、エラー時に何らかの処理を行う
            // this.game.destroy(true); 
        }

        // PreloadSceneは役割を終えるので停止する
        this.scene.stop(this.scene.key);
    }

    // ★★★ stop() メソッドを追加し、ロード画面UIを破棄 ★★★
    stop() {
        super.stop();
        console.log("PreloadScene: stop されました。ロード画面UIを破棄します。");
        if (this.progressBar) { this.progressBar.destroy(); this.progressBar = null; }
        if (this.progressBox) { this.progressBox.destroy(); this.progressBox = null; }
        if (this.percentText) { this.percentText.destroy(); this.percentText = null; }
        if (this.loadingText) { this.loadingText.destroy(); this.loadingText = null; }
    }
}