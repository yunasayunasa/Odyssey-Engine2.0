// src/core/SoundManager.js (最終確定版 - このコードを使用してください)

export default class SoundManager {
    /**
     * @param {Phaser.Game} game - Phaser.Gameのインスタンス
     */
    constructor(game) {
        // ★★★ 正しいバージョンは this.game を保持する ★★★
        this.game = game;
        this.sound = game.sound;
        this.configManager = game.registry.get('configManager');

        this.currentBgm = null;
        this.currentBgmKey = null;

        if (this.configManager) {
            this.configManager.on('change:bgmVolume', this.onBgmVolumeChange, this);
        }
        
        this.game.events.once(Phaser.Core.Events.DESTROY, this.destroy, this);
        console.log("SoundManager: グローバルサービスとして正常に初期化されました。");
    }

    resumeContext() {
        if (this.sound.context.state === 'suspended') {
            this.sound.context.resume().then(() => console.log("SoundManager: AudioContextが再開されました。"));
        }
    }

    playBgm(key, fadeInTime = 0) {
        return new Promise(resolve => {
            this.resumeContext();

            if (!this.configManager) {
                console.error("SoundManager: ConfigManagerが見つかりません。BGMを再生できません。");
                resolve();
                return;
            }
            if (this.currentBgm && this.currentBgm.isPlaying && this.currentBgmKey === key) {
                resolve();
                return;
            }

            this.stopBgm(fadeInTime > 0 ? fadeInTime / 2 : 0).then(() => {
                const newBgm = this.sound.add(key, { loop: true, volume: 0 });
                newBgm.play();

                this.currentBgm = newBgm;
                this.currentBgmKey = key;
                
                const targetVolume = this.configManager.getValue('bgmVolume'); // 0-1スケール

                // ★★★ 正しいバージョンは this.game.tweens を使用する ★★★
                if (fadeInTime > 0) {
                    this.game.tweens.add({
                        targets: newBgm,
                        volume: targetVolume,
                        duration: fadeInTime,
                        onComplete: resolve
                    });
                } else {
                    newBgm.setVolume(targetVolume);
                    resolve();
                }
            });
        });
    }

    stopBgm(fadeOutTime = 0) {
        return new Promise(resolve => {
            if (!this.currentBgm || !this.currentBgm.isPlaying) {
                resolve();
                return;
            }
            const bgmToStop = this.currentBgm;
            this.currentBgm = null;
            this.currentBgmKey = null;

            if (fadeOutTime > 0) {
                this.game.tweens.add({
                    targets: bgmToStop,
                    volume: 0,
                    duration: fadeOutTime,
                    onComplete: () => {
                        bgmToStop.stop();
                        bgmToStop.destroy();
                        resolve();
                    }
                });
            } else {
                bgmToStop.stop();
                bgmToStop.destroy();
                resolve();
            }
        });
    }

    playSe(key) {
        if (!this.configManager) return;
        this.resumeContext();
        const seVolume = this.configManager.getValue('seVolume'); // 0-1スケール
        this.sound.play(key, { volume: seVolume });
    }

    onBgmVolumeChange(newVolume) {
        if (this.currentBgm && this.currentBgm.isPlaying) {
            this.currentBgm.setVolume(newVolume); // 0-1スケール
        }
    }

    destroy() {
        if (this.configManager) {
            this.configManager.off('change:bgmVolume', this.onBgmVolumeChange, this);
        }
        this.stopBgm(0);
    }
}