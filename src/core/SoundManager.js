export default class SoundManager {
    constructor(game) {
        this.game = game; this.sound = game.sound;
        this.configManager = game.registry.get('configManager');
        this.currentBgm = null; this.fadeUpdater = null;
        if (this.configManager) this.configManager.on('change:bgmVolume', this.onBgmVolumeChange, this);
        this.game.events.once(Phaser.Core.Events.DESTROY, this.destroy, this);
    }
    resumeContext(){ if(this.sound.context.state==='suspended')this.sound.context.resume(); }
    // AudioContextを安全に再開
    

   
         async playBgm(key, fadeInTime = 0) {
        if (this.currentBgm && this.currentBgm.texture.key === key && this.currentBgm.isPlaying) return;
        await this.stopBgm(fadeInTime > 0 ? fadeInTime / 2 : 0);
        const newBgm = this.sound.add(key, { loop: true, volume: 0 });
        newBgm.play(); this.currentBgm = newBgm;
        const targetVolume = this.configManager.getValue('bgmVolume');
        if (fadeInTime > 0 && targetVolume > 0) await this.fadeTo(newBgm, targetVolume, fadeInTime);
        else newBgm.setVolume(targetVolume);
    }

    async stopBgm(fadeOutTime = 0) {
        if (!this.currentBgm || !this.currentBgm.isPlaying) return;
        const bgmToStop = this.currentBgm; this.currentBgm = null;
        if (fadeOutTime > 0 && bgmToStop.volume > 0) {
            await this.fadeTo(bgmToStop, 0, fadeOutTime);
        }
        if (bgmToStop.isPlaying) bgmToStop.stop();
        bgmToStop.destroy();
    }

    fadeTo(soundObject, targetVolume, duration) {
        return new Promise(resolve => {
            if (this.fadeUpdater) this.game.events.off(Phaser.Core.Events.STEP, this.fadeUpdater);
            const startVolume = soundObject.volume; let startTime = -1;
            this.fadeUpdater = (time, delta) => {
                if (startTime === -1) startTime = time;
                const progress = Math.min((time - startTime) / duration, 1);
                if (soundObject.scene) soundObject.setVolume(Phaser.Math.Linear(startVolume, targetVolume, progress));
                if (progress >= 1) {
                    this.game.events.off(Phaser.Core.Events.STEP, this.fadeUpdater);
                    this.fadeUpdater = null; resolve();
                }
            };
            this.game.events.on(Phaser.Core.Events.STEP, this.fadeUpdater);
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
