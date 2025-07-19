// src/main.js (二重起動問題を解決するための修正 - ステップ1-1)

import PreloadScene from './scenes/PreloadScene.js';
/*import SystemScene from './scenes/SystemScene.js'; 
import UIScene from './scenes/UIScene.js';       
import GameScene from './scenes/GameScene.js';
import SaveLoadScene from './scenes/SaveLoadScene.js';
import ConfigScene from './scenes/ConfigScene.js';
import BacklogScene from './scenes/BacklogScene.js';
import ActionScene from './scenes/ActionScene.js';
import NovelOverlayScene from './scenes/NovelOverlayScene.js';*/

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'phaser-game',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720
    },
    scene: [ PreloadScene ] // オブジェクト形式ではなく、直接クラスを渡す
    // ★★★ 修正箇所: シーン設定をオブジェクトの配列形式に変更し、
    // PreloadSceneのみactive:true、他は全てactive:falseにする ★★★
    /*scene: [
        { key: 'PreloadScene', scene: PreloadScene, active: true }, // PreloadSceneを明示的にactive:true
        { key: 'SystemScene', scene: SystemScene, active: false }, // ここでactive:falseに設定
        { key: 'UIScene', scene: UIScene, active: false },       // ここでactive:falseに設定
        { key: 'GameScene', scene: GameScene, active: false },   // ここでactive:falseに設定
        { key: 'SaveLoadScene', scene: SaveLoadScene, active: false }, 
        { key: 'ConfigScene', scene: ConfigScene, active: false }, 
        { key: 'BacklogScene', scene: BacklogScene, active: false }, 
        { key: 'ActionScene', scene: ActionScene, active: false }, 
        { key: 'NovelOverlayScene', scene: NovelOverlayScene, active: false }
    ]*/
};

const game = new Phaser.Game(config);

// PreloadSceneはGameConfigでactive:trueなので、自動的に起動します。
// game.scene.start('PreloadScene'); のような明示的な呼び出しは不要です。