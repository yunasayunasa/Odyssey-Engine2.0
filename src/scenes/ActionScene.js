// src/scenes/ActionScene.js

import CoinHud from '../ui/CoinHud.js'; // CoinHudは使用されていませんが、もし使うなら残します
export default class ActionScene extends Phaser.Scene {
    constructor() {
        super('ActionScene');
        this.receivedParams = null; 
        this.eventEmitted = false;
        this.winButton = null;
        this.loseButton = null;
    }

    init(data) {
        this.receivedParams = data.params || {}; // ★ jump.jsの仕様変更に合わせる
        console.log("ActionScene: init 完了。受け取ったパラメータ:", this.receivedParams);
        
        this.eventEmitted = false;
    }

    create() {
        console.log("ActionScene: create 開始");
        this.cameras.main.setBackgroundColor('#4a86e8');
        const player = this.add.text(100, 360, 'PLAYER', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        this.tweens.add({ targets: player, x: 1180, duration: 4000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
        
         // --- オーバーレイ表示リクエスト ---
        this.time.delayedCall(3000, () => {
            console.log("ActionScene: request-overlay を発行");
            this.scene.get('SystemScene').events.emit('request-overlay', { 
                from: this.scene.key,
                scenario: 'overlay_test.ks'
            });
        });

        // --- ★★★ 勝利ボタン ★★★ ---
        this.winButton = this.add.text(320, 600, 'ボスに勝利してノベルパートに戻る', { fontSize: '32px', fill: '#0c0', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        this.winButton.on('pointerdown', () => {
            // ★★★ 修正箇所: クリック時にボタンの入力を即座に無効化 ★★★
            this.winButton.disableInteractive(); 
            if (this.loseButton) this.loseButton.disableInteractive(); 

            // ★★★ 修正箇所: イベントがまだ発行されていない場合のみ発行 ★★★
            if (!this.eventEmitted) {
                this.eventEmitted = true; // フラグを立てる
                console.log("ActionScene: 勝利ボタンクリック -> return-to-novel を発行");
                this.scene.get('SystemScene').events.emit('return-to-novel', {
                    from: this.scene.key,
                    params: { 'f.battle_result': 'win' } 
                });
            } else {
                console.warn("ActionScene: return-to-novel イベントは既に発行されています。スキップします。");
            }
        });

        // --- ★★★ 敗北ボタン ★★★ ---
        this.loseButton = this.add.text(960, 600, 'ボスに敗北してノベルパートに戻る', { fontSize: '32px', fill: '#c00', backgroundColor: '#000' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        this.loseButton.on('pointerdown', () => {
            // ★★★ 修正箇所: クリック時にボタンの入力を即座に無効化 ★★★
            this.loseButton.disableInteractive(); 
            if (this.winButton) this.winButton.disableInteractive(); 

            // ★★★ 修正箇所: イベントがまだ発行されていない場合のみ発行 ★★★
            if (!this.eventEmitted) {
                this.eventEmitted = true; // フラグを立てる
                console.log("ActionScene: 敗北ボタンクリック -> return-to-novel を発行");
                this.scene.get('SystemScene').events.emit('return-to-novel', {
                    from: this.scene.key,
                    params: { 'f.battle_result': 'lose' } 
                });
            } else {
                console.warn("ActionScene: return-to-novel イベントは既に発行されています。スキップします。");
            }
        });
        console.log("ActionScene: create 完了");
    

     // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ これが修正の核心 ★★★
        // ★★★ 5ヶ条のルール1：createの最後にscene-readyを発行 ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        this.events.emit('scene-ready');
        console.log("ActionScene: create 完了。scene-readyイベントを発行しました。");
    }
    
    // ★★★ 5ヶ条のルール4：shutdownで後片付け ★★★
    shutdown() {
        console.log("ActionScene: shutdown されました。");
        // このシーンは動的なイベントやタイマーを生成していないので、
        // 現状はコンソールログだけでOK。
        // もしthis.time.addEventなどを使ったら、ここでdestroyする。
    }

    // ★★★ 以下のメソッドは不要なので削除 ★★★
    // start() {}
    // stop() {}
    // resume() {}
}
