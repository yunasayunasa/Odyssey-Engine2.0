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

    // ★★★ 追加: ConfigManagerを受け取り、初期化を行うinit()メソッド ★★★
    init(configManager) {
        if (!configManager) {
            console.error("SoundManager.init: ConfigManagerが渡されていません！");
            return;
        }
        this.configManager = configManager;

        console.log("SoundManager: ConfigManagerを受け取り、初期化しました。");

        // ★★★ constructorにあったイベントリスナー登録をここに移動 ★★★
        this.configManager.on('change:bgmVolume', (newValue) => {
            if (this.currentBgm && this.currentBgm.isPlaying) {
                this.currentBgm.setVolume(newValue / 100);
            }
        });
    }



   

   playSe(key, options = {}) {
        if (!key) return;
        
        
        const se = this.sound.add(key);
        let volume = this.configManager.getValue('seVolume') / 100;
        if (options.volume !== undefined) {
            volume = Number(options.volume);
        }
        se.setVolume(volume);
        se.play();
    }

 
      // ★★★ 修正箇所: stopBgmがPromiseを返すように変更 ★★★
    stopBgm(fadeOutTime = 0) {
        return new Promise(resolve => {
            if (!this.currentBgm) {
                resolve(); // BGMがなければ即時完了
                return;
            }
            
            const tweenRunner = this._getTweenRunnerScene();
            tweenRunner.tweens.killTweensOf(this.currentBgm);

            if (fadeOutTime > 0) {
                tweenRunner.tweens.add({
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
                // ★★★ tween.onCompleteに頼らず、時間で完了を保証 ★★★
                tweenRunner.time.delayedCall(fadeOutTime, resolve);
            } else {
                this.currentBgm.stop();
                this.currentBgm.destroy();
                this.currentBgm = null;
                this.currentBgmKey = null;
                resolve(); // 即時完了
            }
        });
    }

    // ★★★ 修正箇所: playBgmがasync/awaitを使い、Promiseを返すように変更 ★★★
    async playBgm(key, fadeInTime = 0) {
        if (!key || this.currentBgmKey === key) {
            return Promise.resolve(); // キーがない、または同じBGMなら即時完了
        }
        this.resumeContext();

        // ★★★ 修正箇所: 古いBGMの停止をawaitで確実に待つ ★★★
        await this.stopBgm(fadeInTime);

        // ★★★ 新しいBGMの再生処理もPromiseでラップする ★★★
        return new Promise(resolve => {
            const newBgm = this.sound.add(key, { loop: true, volume: 0 });
            newBgm.play();
            this.currentBgm = newBgm;
            this.currentBgmKey = key;

            const tweenRunner = this._getTweenRunnerScene();
            if (fadeInTime > 0) {
                tweenRunner.tweens.add({
                    targets: newBgm,
                    volume: this.configManager.getValue('bgmVolume') / 100,
                    duration: fadeInTime,
                });
                // ★★★ tween.onCompleteに頼らず、時間で完了を保証 ★★★
                tweenRunner.time.delayedCall(fadeInTime, resolve);
            } else {
                newBgm.setVolume(this.configManager.getValue('bgmVolume') / 100);
                resolve(); // 即時完了
            }
        });
    }

   // ★★★ 追加: SoundManagerが操作対象とするシーンを切り替えるメソッド ★★★
    setScene(newScene) {
        console.log(`SoundManager: 操作対象のシーンを ${this.scene.scene.key} から ${newScene.scene.key} に切り替えます。`);
        this.scene = newScene;
        // AudioContextの再開処理も、新しいシーンで再度行うようにする
        this.scene.input.once('pointerdown', () => {
            if (this.scene.sound.context.state === 'suspended') {
                this.scene.sound.context.resume();
            }
            this.audioContext = this.scene.sound.context;
            console.log("AudioContext is ready on new scene.");
        }, this);
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