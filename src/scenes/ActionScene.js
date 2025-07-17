// ActionScene.js (最終版)
import CoinHud from '../ui/CoinHud.js';
export default class ActionScene extends Phaser.Scene {
    constructor() {
        super('ActionScene');
        this.receivedParams = null; // ★ 渡されたパラメータを保持するプロパティ
    }

    init(data) {
        // ★★★ 修正箇所: SystemSceneから渡されたパラメータを受け取る ★★★
        // SystemSceneで渡したキー名 ('transitionParams') と一致させる
        this.receivedParams = data.transitionParams || {}; 
        console.log("ActionScene: init 完了。受け取ったパラメータ:", this.receivedParams);
    }

    create() {
        console.log("ActionScene: create 開始");
        this.cameras.main.setBackgroundColor('#4a86e8');
        const player = this.add.text(100, 360, 'PLAYER', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        this.tweens.add({ targets: player, x: 1180, duration: 4000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
        
       // src/scenes/ActionScene.js の create() メソッド内 (例)

    // プレイヤーの名前をゲーム内で使う
    // const playerName = this.receivedParams.player_name;
    // const playerLevel = this.receivedParams.player_level;
    // const startArea = this.receivedParams.start_area;

    // console.log(`[ActionScene] プレイヤー名: ${playerName}, レベル: ${playerLevel}, 開始エリア: ${start_area}`);

    // Three.jsの初期化ロジックに渡す
    // initialize3DGame({ level: playerLevel, name: playerName, area: startArea });
    
        // --- オーバーレイ表示リクエスト ---
        this.time.delayedCall(3000, () => {
            console.log("ActionScene: request-overlay を発行");
            this.scene.get('SystemScene').events.emit('request-overlay', { 
                from: this.scene.key,
                scenario: 'overlay_test.ks'
            });
        });

        // --- ★★★ 勝利ボタン ★★★ ---
        const winButton = this.add.text(320, 600, 'ボスに勝利してノベルパートに戻る', { fontSize: '32px', fill: '#0c0', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        winButton.on('pointerdown', () => {
            console.log("ActionScene: 勝利ボタンクリック -> return-to-novel を発行");
            this.scene.get('SystemScene').events.emit('return-to-novel', {
                from: this.scene.key,
                params: { 'f.battle_result': 'win' } // 勝利結果を渡す
            });
        });

        // --- ★★★ 敗北ボタン ★★★ ---
        const loseButton = this.add.text(960, 600, 'ボスに敗北してノベルパートに戻る', { fontSize: '32px', fill: '#c00', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        loseButton.on('pointerdown', () => {
            console.log("ActionScene: 敗北ボタンクリック -> return-to-novel を発行");
            this.scene.get('SystemScene').events.emit('return-to-novel', {
                from: this.scene.key,
                params: { 'f.battle_result': 'lose' } // 敗北結果を渡す
            });
        });
    }

    // シーンが resume された時に、入力を再有効化する (SystemSceneがやるのでこのメソッドは不要)
    // resume() {
    //     // console.log("ActionScene: resume されました。入力を再有効化します。");
    //     // this.input.enabled = true;
    // }
}