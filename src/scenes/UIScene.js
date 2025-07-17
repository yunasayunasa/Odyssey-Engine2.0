export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: true });

        // --- UI要素と状態を、すべてプロパティとして初期化 ---
        this.menuButton = null;
        this.panel = null;
        this.isPanelOpen = false;
    }

    create() {
        console.log("UIScene: 作成・初期化");
        const gameWidth = 1280;
        const gameHeight = 720;

        // --- 1. パネルと、その中のボタンを生成 ---
        this.panel = this.add.container(0, gameHeight + 120); // 初期位置は画面下
        
        const panelBg = this.add.rectangle(gameWidth / 2, 0, gameWidth, 120, 0x000000, 0.8).setInteractive();
        const saveButton = this.add.text(0, 0, 'セーブ', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        const loadButton = this.add.text(0, 0, 'ロード', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        const backlogButton = this.add.text(0, 0, '履歴', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        const configButton = this.add.text(0, 0, '設定', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        const autoButton = this.add.text(0, 0, 'オート', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        const skipButton = this.add.text(0, 0, 'スキップ', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        
        this.panel.add([panelBg, saveButton, loadButton, backlogButton, configButton, autoButton, skipButton]);

        // --- 2. パネル内のボタンのレイアウトを確定 ---
        const buttons = [saveButton, loadButton, backlogButton, configButton, autoButton, skipButton];
        const areaStartX = 250;
        const areaWidth = gameWidth - areaStartX - 100;
        const buttonMargin = areaWidth / buttons.length;
        buttons.forEach((button, index) => {
            button.setX(areaStartX + (buttonMargin * index) + (buttonMargin / 2));
        });

        // --- 3. メインの「メニュー」ボタンを生成・配置 ---
        this.menuButton = this.add.text(100, gameHeight - 50, 'MENU', { fontSize: '36px', fill: '#fff' }).setOrigin(0.5).setInteractive();

        // --- 4. すべてのイベントリスナーを、ここで一括設定 ---
        
        // パネル背景は、クリックイベントを止めるだけ
        panelBg.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
        });

        // メニューボタンは、パネルの開閉をトリガー
        this.menuButton.on('pointerdown', (pointer, localX, localY, event) => {
            this.togglePanel();
            event.stopPropagation();
        });

        // 各機能ボタン
        saveButton.on('pointerdown', (pointer, localX, localY, event) => {
            this.openScene('SaveLoadScene', { mode: 'save' });
            event.stopPropagation();
        });
        loadButton.on('pointerdown', (pointer, localX, localY, event) => {
            this.openScene('SaveLoadScene', { mode: 'load' });
            event.stopPropagation();
        });
        backlogButton.on('pointerdown', (pointer, localX, localY, event) => {
            this.openScene('BacklogScene');
            event.stopPropagation();
        });
        configButton.on('pointerdown', (pointer, localX, localY, event) => {
            this.openScene('ConfigScene');
            event.stopPropagation();
        });
        autoButton.on('pointerdown', (pointer, localX, localY, event) => {
            this.toggleGameMode('auto');
            event.stopPropagation();
        });
        skipButton.on('pointerdown', (pointer, localX, localY, event) => {
            this.toggleGameMode('skip');
            event.stopPropagation();
        });
    }

    // --- 以下、このクラスが持つメソッド群 ---

    togglePanel() {
        this.isPanelOpen = !this.isPanelOpen;
        const targetY = this.isPanelOpen ? 720 - 60 : 720 + 120;
        this.tweens.add({
            targets: this.panel,
            y: targetY,
            duration: 300,
            ease: 'Cubic.easeInOut'
        });
    }

    openScene(sceneKey, data = {}) {
        this.scene.pause('GameScene');
        // Config, Backlog, SaveLoadシーンを開くときは、UI自身も止める
      /*  if (['ConfigScene', 'BacklogScene', 'SaveLoadScene'].includes(sceneKey)) {
            this.scene.pause();
        }*/
        this.scene.launch(sceneKey, data);
    }
    
    toggleGameMode(mode) {
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.scenarioManager) {
            const currentMode = gameScene.scenarioManager.mode;
            const newMode = currentMode === mode ? 'normal' : mode;
            gameScene.scenarioManager.setMode(newMode);
        }
    }
}