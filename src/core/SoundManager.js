export default class SoundManager {
    constructor(game) {
        this.game = game;
        this.sound = game.sound;
        this.configManager = game.registry.get('configManager');
        this.currentBgm = null; // Phaser.Sound.BaseSoundオブジェクト
        
        // ★★★ 状態管理用のプロパティを追加 ★★★
        this.isStopping = false; // 停止処理中フラグ
        this.isStarting = false; // 再生処理中フラグ

        if (this.configManager) {
            this.configManager.on('change:bgmVolume', this.onBgmVolumeChange, this);
        }
        this.game.events.once(Phaser.Core.Events.DESTROY, this.destroy, this);
    }
    // AudioContextを安全に再開
    resumeContext() {
        if (this.sound.context.state === 'suspended') {
            this.sound.context.resume().then(() => console.log("SoundManager: AudioContextが再開されました。"));
        }
    }

   
     async playBgm(key, fadeInTime = 0) {
        if (this.isStarting || this.isStopping) return; // 処理中なら何もしない
        if (this.currentBgm && this.currentBgm.texture.key === key && this.currentBgm.isPlaying) return;

        this.isStarting = true;

        await this.stopBgm(fadeInTime > 0 ? fadeInTime / 2 : 0);

        const newBgm = this.sound.add(key, { loop: true, volume: 0 });
        const targetVolume = this.configManager.getValue('bgmVolume');
        newBgm.play();

        // ★★★ 新しいBGMをセットするのは、再生開始後 ★★★
        this.currentBgm = newBgm;

        if (fadeInTime > 0 && targetVolume > 0) {
            await new Promise(resolve => this.game.tweens.add({
                targets: newBgm, volume: targetVolume, duration: fadeInTime, onComplete: resolve
            }));
        } else {
            newBgm.setVolume(targetVolume);
        }
        
        this.isStarting = false;
    }

    async stopBgm(fadeOutTime = 0) {
        if (this.isStopping || !this.currentBgm || !this.currentBgm.isPlaying) {
            return;
        }
        this.isStopping = true;

        const bgmToStop = this.currentBgm;

        if (fadeOutTime > 0 && bgmToStop.volume > 0) {
            await new Promise(resolve => this.game.tweens.add({
                targets: bgmToStop, volume: 0, duration: fadeOutTime, onComplete: resolve
            }));
        }
        
        // ★★★ フェード完了後、または即時にインスタンスを破棄 ★★★
        if (bgmToStop.isPlaying) {
            bgmToStop.stop();
        }
        bgmToStop.destroy();
        
        // ★★★ 破棄処理が終わった後に、currentBgmをnullにする ★★★
        if (this.currentBgm === bgmToStop) {
            this.currentBgm = null;
        }

        this.isStopping = false;
    }

    // ★★★ ロック機構を組み込んだ、究極の手動Tween ★★★
    fadeTo(soundObject, targetVolume, duration) {
        return new Promise(resolve => {
            if (this.isFading) { // 二重チェック
                resolve(); return;
            }
            this.isFading = true; // ★ 処理開始時にロックする

            const startVolume = soundObject.volume;
            let startTime = -1;

            this.fadeUpdater = (time, delta) => {
                if (startTime === -1) startTime = time;
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                if (soundObject.scene) { 
                    soundObject.setVolume(Phaser.Math.Linear(startVolume, targetVolume, progress));
                }

                if (progress >= 1) {
                    this.game.events.off(Phaser.Core.Events.STEP, this.fadeUpdater);
                    this.fadeUpdater = null;
                    this.isFading = false; // ★ 処理完了時にロックを解除する
                    resolve();
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
        if (this.currentBgm && this.currentBgm.isPlaying) {
            // Phaser3.60以降、キーはtexture.keyで取得するのが最も安全
            return this.currentBgm.texture.key;
        }
        return null;
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
