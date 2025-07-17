import PreloadScene from './scenes/PreloadScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import SystemScene from './scenes/SystemScene.js';
import SaveLoadScene from './scenes/SaveLoadScene.js';
import ConfigScene from './scenes/ConfigScene.js';
import BacklogScene from './scenes/BacklogScene.js';
import ActionScene from './scenes/ActionScene.js';
import NovelOverlayScene from './scenes/NovelOverlayScene.js';
import ConfigManager from './core/ConfigManager.js';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'phaser-game',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720
    },
    // ★★★ すべてのシーンを、ただ配列に入れるだけ ★★★
    scene: [
        PreloadScene, 
        GameScene, 
        UIScene, 
        SystemScene, 
        SaveLoadScene, 
        ConfigScene, 
        BacklogScene, 
        ActionScene, 
        NovelOverlayScene
    ]
};

const game = new Phaser.Game(config);

// ★★★ preBootや手動addは、すべて削除 ★★★