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
playBgm(key, fadeInTime = 0) {
        console.log(`[DEBUG] playBgm (instant): START with key [${key}]`);
        this.resumeContext();
        if (!this.configManager) { return; }
        if (this.currentBgm && this.currentBgm.isPlaying && this.currentBgmKey === key) {
            return;
        }

        // 以前のBGMを即座に停止
        this.stopBgm(0);

        const newBgm = this.sound.add(key, { loop: true });
        const targetVolume = this.configManager.getValue('bgmVolume');
        newBgm.setVolume(targetVolume);
        newBgm.play();
        
        this.currentBgm = newBgm;
        this.currentBgmKey = key;
        console.log(`[DEBUG] playBgm (instant): END. Volume set to ${targetVolume}`);
        
        // Promiseを返す必要がないので、asyncも不要
    }

    // ★★★ Tween を完全に削除 ★★★
    stopBgm(fadeOutTime = 0) {
        console.log(`[DEBUG] stopBgm (instant): START`);
        if (!this.currentBgm || !this.currentBgm.isPlaying) {
            console.log(`[DEBUG] stopBgm (instant): No BGM to stop.`);
            return;
        }
        
        this.currentBgm.stop();
        this.currentBgm.destroy();
        this.currentBgm = null;
        this.currentBgmKey = null;
        console.log(`[DEBUG] stopBgm (instant): END`);
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
