// src/core/SoundManager.js (遅延初期化による最終修正)

export default class SoundManager {
    constructor(soundManager, systemScene) {
        this.systemScene = systemScene; 
        this.sound = soundManager; 
        
        // ★★★ constructorでは、ConfigManagerへのアクセスは行わない ★★★
        this.configManager = null; 
        this.currentBgm = null;
        this.currentBgmKey = null;
    }

    // ★★★ ConfigManagerを受け取り、初期化を行うinit()メソッド ★★★
    init(configManager) {
        if (!configManager) {
            console.error("SoundManager.init: ConfigManagerが渡されていません！");
            return;
        }
        this.configManager = configManager;

        console.log("SoundManager: ConfigManagerを受け取り、初期化しました。");

        this.configManager.on('change:bgmVolume', (newValue) => {
            if (this.currentBgm && this.currentBgm.isPlaying) {
                this.currentBgm.setVolume(newValue / 100);
            }
        });
    }
    
    // ★★★ AudioContextを安全に再開するためのヘルパーメソッド ★★★
    resumeContext() {
        if (this.sound.context && this.sound.context.state === 'suspended') {
            this.sound.context.resume().then(() => {
                console.log("SoundManager: AudioContext has been resumed.");
            });
        }
    }

    playSe(key, options = {}) {
        if (!key || !this.configManager) return; // ★★★ configManagerのnullチェックを追加 ★★★
        this.resumeContext();
        
        const se = this.sound.add(key);
        let volume = this.configManager.getValue('seVolume') / 100;
        if (options.volume !== undefined) {
            volume = Number(options.volume);
        }
        se.setVolume(volume);
        se.play();
    }

    // ★★★ stopBgmがPromiseを返すように修正 ★★★
    stopBgm(fadeOutTime = 0) {
        return new Promise(resolve => {
            if (!this.currentBgm) {
                resolve();
                return;
            }
            
            // ★★★ Tweenは常にsystemSceneを使う ★★★
            this.systemScene.tweens.killTweensOf(this.currentBgm);

            if (fadeOutTime > 0) {
                this.systemScene.tweens.add({
                    targets: this.currentBgm,
                    volume: 0,
                    duration: fadeOutTime,
                });
                this.systemScene.time.delayedCall(fadeOutTime, () => {
                    if (this.currentBgm) {
                        this.currentBgm.stop();
                        this.currentBgm.destroy();
                        this.currentBgm = null;
                        this.currentBgmKey = null;
                    }
                    resolve();
                });
            } else {
                this.currentBgm.stop();
                this.currentBgm.destroy();
                this.currentBgm = null;
                this.currentBgmKey = null;
                resolve();
            }
        });
    }

     playBgm(key, fadeInTime = 0, onComplete = null) {
        if (!key) {
            if (onComplete) onComplete(); // キーがなければ即時完了
            return;
        }
        this.resumeContext();

        if (this.currentBgmKey === key) {
            if (onComplete) onComplete(); // 同じBGMなら即時完了
            return;
        }

        this.stopBgm(fadeInTime); // 既存のBGMをフェードアウト

        // ★★★ 新しいBGMの再生は、stopBgmのフェードアウトと同じ時間だけ待ってから開始 ★★★
        this.systemScene.time.delayedCall(fadeInTime, () => {
            const newBgm = this.sound.add(key, { loop: true, volume: 0 });
            newBgm.play();
            this.currentBgm = newBgm;
            this.currentBgmKey = key;

            if (fadeInTime > 0) {
                this.systemScene.tweens.add({
                    targets: newBgm,
                    volume: this.configManager.getValue('bgmVolume') / 100,
                    duration: fadeInTime,
                    // ★★★ フェードイン完了時にonCompleteを呼び出す ★★★
                    onComplete: () => {
                        if (onComplete) onComplete();
                    }
                });
            } else {
                newBgm.setVolume(this.configManager.getValue('bgmVolume') / 100);
                if (onComplete) onComplete(); // 即時再生でも完了を通知
            }
        });
    }
   
    getCurrentBgmKey() {
        if (this.currentBgm && this.currentBgm.isPlaying) {
            return this.currentBgmKey;
        }
        return null;
    }
    
    // playSynthはWeb Audio APIに直接依存するため、変更は最小限に
    playSynth(waveType = 'square', frequency = 1200, duration = 0.05) {
        const audioContext = this.sound.context;
        if (!audioContext || audioContext.state !== 'running' || !this.configManager) {
            console.warn("AudioContext is not ready or ConfigManager is not initialized.");
            return;
        }
       
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(this.configManager.getValue('seVolume'), this.audioContext.currentTime); // ★ SE音量を適用
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
}