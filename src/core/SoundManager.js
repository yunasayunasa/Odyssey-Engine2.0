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
         this.fadeUpdater = null; // ゲームループに登録する更新関数の参照

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

   
      playBgm(key, fadeInTime = 0) {
        return new Promise(async resolve => {
            this.resumeContext();
            if (!this.configManager || (this.currentBgm && this.currentBgmKey === key)) {
                resolve(); return;
            }
            await this.stopBgm(fadeInTime > 0 ? fadeInTime / 2 : 0);
            const newBgm = this.sound.add(key, { loop: true, volume: 0 });
            newBgm.play();
            this.currentBgm = newBgm; this.currentBgmKey = key;
            const targetVolume = this.configManager.getValue('bgmVolume');

            if (fadeInTime > 0 && targetVolume > 0) {
                await this.fadeTo(newBgm, targetVolume, fadeInTime);
            } else {
                newBgm.setVolume(targetVolume);
            }
            resolve();
        });
    }

    stopBgm(fadeOutTime = 0) {
        return new Promise(resolve => {
            if (!this.currentBgm || !this.currentBgm.isPlaying) {
                resolve(); return;
            }
            const bgmToStop = this.currentBgm;
            this.currentBgm = null; this.currentBgmKey = null;

            if (fadeOutTime > 0 && bgmToStop.volume > 0) {
                this.fadeTo(bgmToStop, 0, fadeOutTime).then(() => {
                    bgmToStop.stop(); bgmToStop.destroy();
                    resolve();
                });
            } else {
                bgmToStop.stop(); bgmToStop.destroy();
                resolve();
            }
        });
    }

    // ★★★ ゲームの心臓部(STEPイベント)に同期する、究極の手動Tween ★★★
    fadeTo(soundObject, targetVolume, duration) {
        return new Promise(resolve => {
            // 既存のアップデーターがあれば、まずそれを停止・解除する
            if (this.fadeUpdater) {
                this.game.events.off(Phaser.Core.Events.STEP, this.fadeUpdater);
                this.fadeUpdater = null;
            }
            
            const startVolume = soundObject.volume;
            let startTime = -1;

            // STEPイベントは、Phaserの更新ループごとに呼び出される
            this.fadeUpdater = (time, delta) => {
                if (startTime === -1) {
                    startTime = time;
                }
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // soundObjectが破棄されていないか安全確認
                if (soundObject.scene) { 
                    soundObject.setVolume(Phaser.Math.Linear(startVolume, targetVolume, progress));
                }

                if (progress >= 1) {
                    // 完了したら、自身をSTEPイベントから解除する
                    this.game.events.off(Phaser.Core.Events.STEP, this.fadeUpdater);
                    this.fadeUpdater = null;
                    resolve();
                }
            };
            
            // ゲームのグローバルイベントに、このアップデーターを登録
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
