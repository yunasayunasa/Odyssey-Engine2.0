// src/core/SoundManager.js (全面改訂版)

export default class SoundManager {
    /**
     * @param {Phaser.Game} game - Phaser.Gameのインスタンス
     */
    constructor(game) {
        // 特定のシーンではなく、PhaserのGameインスタンスを保持
        this.game = game;
        this.sound = game.sound;
        this.configManager = game.registry.get('configManager');

        this.currentBgm = null;
        this.currentBgmKey = null;

        // ボリューム変更をリッスン
        this.configManager.on('change:bgmVolume', this.onBgmVolumeChange, this);
        this.configManager.on('change:seVolume', this.onSeVolumeChange, this);
        
        // ゲームが破棄されるときにリスナーをクリーンアップ
        this.game.events.once(Phaser.Core.Events.DESTROY, this.destroy, this);

        console.log("SoundManager: グローバルサービスとして正常に初期化されました。");
    }

    // AudioContextを安全に再開
    resumeContext() {
        if (this.sound.context.state === 'suspended') {
            this.sound.context.resume().then(() => console.log("SoundManager: AudioContextが再開されました。"));
        }
    }

    /**
     * BGMを再生します。このメソッドはPromiseを返します。
     * @param {string} key - 再生するBGMのアセットキー
     * @param {number} fadeInTime - フェードイン時間(ms)
     * @returns {Promise<void>} フェードイン完了時に解決されるPromise
     */
    // ★★★ playBgmをasync/awaitで書き直して安全性を高める ★★★
  async playBgm(key, fadeInTime = 0) {
      console.log(`[LOG-BOMB] playBgm: START with key: ${key}`);
        this.resumeContext();
        if (!this.configManager) { return; }
        if (this.currentBgm && this.currentBgm.isPlaying && this.currentBgmKey === key) {
            return;
        }

        // 以前のBGMを停止し、完了を待つ
      console.log("[LOG-BOMB] playBgm: AWAITING inner stopBgm..."); // ★
        await this.stopBgm(fadeInTime > 0 ? fadeInTime / 2 : 0);
      console.log("[LOG-BOMB] playBgm: ゴーイングinner stopBgm..."); // ★

        const newBgm = this.sound.add(key, { loop: true, volume: 0 });
        newBgm.play();
        this.currentBgm = newBgm;
        this.currentBgmKey = key;
        const targetVolume = this.configManager.getValue('bgmVolume');

        if (fadeInTime > 0) {
            // Promiseを返すTweenを作成し、完了を待つ
            await new Promise(resolve => {
                   console.log("[LOG-BOMB] playBgm: AWAITING tween..."); // ★
                this.game.tweens.add({
                    targets: newBgm,
                    volume: targetVolume,
                    duration: fadeInTime,
                    onComplete: resolve// tween完了時にPromiseを解決
                     console.log("[LOG-BOMB] playBgm: エンドtween..."); // ★
                });
            });
        } else {
                console.log("[LOG-BOMB] playBgm: END"); // ★
            newBgm.setVolume(targetVolume);
        }
        // この関数の最後まで到達すれば、Promiseは自動的に解決される
    }

    // ★★★ stopBgmも念のためPromiseを返すことを保証 ★★★
    stopBgm(fadeOutTime = 0) {
        console.log("[LOG-BOMB] stopBgm: START"); // ★
   
        return new Promise(resolve => {
            if (!this.currentBgm || !this.currentBgm.isPlaying) {
              console.log("[LOG-BOMB] stopBgm: 終わり"); // ★
   
                resolve(); return;
            }
            const bgmToStop = this.currentBgm;
            this.currentBgm = null; this.currentBgmKey = null;

            if (fadeOutTime > 0) {
                this.game.tweens.add({
                    targets: bgmToStop,
                    volume: 0,
                    duration: fadeOutTime,
                    onComplete: () => { bgmToStop.stop(); bgmToStop.destroy(); resolve(); }
                });
            } else {
                bgmToStop.stop(); bgmToStop.destroy();
                   console.log("[LOG-BOMB] stopBgm: BGM stopped via tween. Resolving."); // ★
                resolve();
            }
        });
    }

  // ★ playSe も同様に修正
    playSe(key) {
        this.resumeContext();
        // ConfigManagerから取得した値をそのまま使う
        const seVolume = this.configManager.getValue('seVolume');
        this.sound.play(key, { volume: seVolume });
    }

    getCurrentBgmKey() {
        return (this.currentBgm && this.currentBgm.isPlaying) ? this.currentBgmKey : null;
    }

      onBgmVolumeChange(newVolume) {
        if (this.currentBgm && this.currentBgm.isPlaying) {
            // newVolumeは既に0-1の値なので、そのまま渡す
            this.currentBgm.setVolume(newVolume);
        }
    }
    
    onSeVolumeChange(newVolume) {
        // SEは再生時に音量を設定するため、ここでは何もしない
    }

    // ゲーム終了時に呼ばれるクリーンアップ処理
    destroy() {
        this.configManager.off('change:bgmVolume', this.onBgmVolumeChange, this);
        this.configManager.off('change:seVolume', this.onSeVolumeChange, this);
        this.stopBgm(0);
        console.log("SoundManager: 破棄されました。");
    }
}
