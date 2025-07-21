export default class SoundManager {
    // ★★★ 修正箇所: constructorの引数を変更 ★★★
    constructor(soundManager, systemScene, configManager) {
        // this.sceneではなく、tweenを実行するためのsystemSceneへの参照を保持
        this.systemScene = systemScene; 
        // PhaserのグローバルなSoundManagerへの参照を保持
        this.sound = soundManager; 
        this.configManager = configManager; // ConfigManagerへの参照を保持
        this.currentBgm = null;
        this.currentBgmKey = null;

      

        // --- 設定変更イベントの監視 ---
        this.configManager.on('change:bgmVolume', (newValue) => {
            if (this.currentBgm && this.currentBgm.isPlaying) {
                this.currentBgm.setVolume(newValue / 100); // 0-1の範囲に変換
            }
        });
        // (seVolumeも同様に)
    }
   // ★★★ 追加: AudioContextを安全に再開するためのヘルパーメソッド ★★★
    _resumeAudioContext() {
        if (this.sound.context && this.sound.context.state === 'suspended') {
            this.sound.context.resume();
            console.log("SoundManager: AudioContext is resuming...");
        }
    }

    playSe(key, options = {}) {
        if (!key) return;
        // ★★★ 追加: 再生前にAudioContextを再開 ★★★
        this._resumeAudioContext();
        
        const se = this.sound.add(key);
        let volume = this.configManager.getValue('seVolume') / 100;
        if (options.volume !== undefined) {
            volume = Number(options.volume);
        }
        se.setVolume(volume);
        se.play();
    }

    playBgm(key, fadeInTime = 0) {
         if (!key) return;
        // ★★★ 追加: 再生前にAudioContextを再開 ★★★
        this._resumeAudioContext();

        if (this.currentBgmKey === key) return;

        // 既存のBGMを停止
        if (this.currentBgm && this.currentBgm.isPlaying) {
            // ★★★ 修正箇所: this.scene.tweens -> this.systemScene.tweens ★★★
            this.systemScene.tweens.add({
                targets: this.currentBgm,
                volume: 0,
                duration: fadeInTime,
                onComplete: () => {
                    this.currentBgm.stop();
                }
            });
        }

          const newBgm = this.sound.add(key, { loop: true, volume: 0 });
        newBgm.play();
        this.currentBgm = newBgm;
        this.currentBgmKey = key;

        // フェードイン
        if (fadeInTime > 0) {
            this.systemScene.tweens.add({
                targets: newBgm,
                volume: this.configManager.getValue('bgmVolume') / 100,
                duration: fadeInTime
            });
        } else {
            newBgm.setVolume(this.configManager.getValue('bgmVolume') / 100);
        }
    }

    stopBgm(fadeOutTime = 0) {
        if (this.currentBgm && this.currentBgm.isPlaying) {
            if (fadeOutTime > 0) {
                // ★★★ 修正箇所: this.scene.tweens -> this.systemScene.tweens ★★★
                this.systemScene.tweens.add({
                    targets: this.currentBgm,
                    volume: 0,
                    duration: fadeOutTime,
                    onComplete: () => {
                        if (this.currentBgm) {
                            this.currentBgm.stop();
                            this.currentBgm.destroy();
                            this.currentBgm = null;
                            this.currentBgmKey = null;
                        }
                    }
                });
            } else {
                this.currentBgm.stop();
                this.currentBgm.destroy();
                this.currentBgm = null;
                this.currentBgmKey = null;
            }
        }
    }

    getCurrentBgmKey() {
        if (this.currentBgm && this.currentBgm.isPlaying) {
            return this.currentBgmKey;
        }
        return null;
    }
    
    
    playSynth(waveType = 'square', frequency = 1200, duration = 0.05) {
        // ★ AudioContextが有効になるまで何もしない
        if (!this.audioContext || this.audioContext.state !== 'running') {
            console.warn("AudioContext is not ready. Cannot play synth sound.");
            return;
        }
    // ★★★ audioContextの参照をthis.sound.contextに直接変更 ★★★
        const audioContext = this.sound.context;
        if (!audioContext || audioContext.state !== 'running') {
            console.warn("AudioContext is not ready. Cannot play synth sound.");
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