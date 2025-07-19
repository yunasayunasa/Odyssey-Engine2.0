import ConfigManager from '../core/ConfigManager.js'; // ConfigManagerをここでimport

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        console.log("PreloadScene: 起動。全アセットのロードを開始します。");
        
        // --- 1. ロード画面UIの表示 ---
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8).fillRect(340, 320, 600, 50);
        const percentText = this.add.text(640, 345, '0%', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(640, 280, 'Now Loading...', { fontSize: '36px', fill: '#ffffff' }).setOrigin(0.5);
        
        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear().fillStyle(0xffffff, 1).fillRect(350, 330, 580 * value, 30);
        });
        
        // --- 2. アセットのロード ---
        this.load.json('asset_define', 'assets/asset_define.json');
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
    }

        create() {
        console.log("PreloadScene: ロード完了。ゲームの初期設定を行います。");
        const assetDefine = this.cache.json.get('asset_define');
        const configManager = new ConfigManager();
        this.registry.set('configManager', configManager);
        
        // --- アセットをロードキューに追加 ---
        for (const key in assetDefine.images) {
            this.load.image(key, assetDefine.images[key]);
        }
        for (const key in assetDefine.sounds) {
            this.load.audio(key, assetDefine.sounds[key]);
        }
        for (const key in assetDefine.videos) {
            this.load.video(key, assetDefine.videos[key]);
        }
        // ★ ゲームで使う可能性のあるシナリオファイルをすべてロード
        this.load.text('scene1.ks', 'assets/scene1.ks');
        this.load.text('scene2.ks', 'assets/scene2.ks');
        this.load.text('overlay_test.ks', 'assets/overlay_test.ks');
        this.load.text('test.ks', 'assets/test.ks'); // テスト用
        this.load.text('test_main.ks', 'assets/test_main.ks'); // テスト用
        this.load.text('test_sub.ks', 'assets/test_sub.ks'); // テスト用

        // --- ロード完了後の処理を定義 ---
        this.load.once('complete', () => {
            console.log("全アセットロード完了。");
            
            // ★★★ キャラクター定義の生成を、このコールバックの中で行う ★★★
            const charaDefs = {};
            // assetDefineは、このスコープから参照できるのでOK
            for (const key in assetDefine.images) {
                const parts = key.split('_');
                if (parts.length === 2) {
                    const [charaName, faceName] = parts;
                    if (!charaDefs[charaName]) charaDefs[charaName] = { jname: charaName, face: {} };
                    charaDefs[charaName].face[faceName] = key;
                }
            }
            
            // ★★★ 生成したcharaDefsを渡して、次のシーンを開始 ★★★
            this.scene.start('GameScene', { 
                charaDefs: charaDefs,
                startScenario: 'test.ks' // ここで開始するシナリオを指定
            });
            this.scene.launch('UIScene');
            this.scene.launch('SystemScene');
        });
        
        // --- ロードを開始 ---
        this.load.start();
    }
}