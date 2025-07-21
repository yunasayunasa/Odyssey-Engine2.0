export default class SoundManager {
    constructor(scene, configManager) {
        this.scene = scene;
        this.configManager = configManager;
        this.currentBgm = null;
        this.currentBgmKey = null; // ★ プロパティとして明示的に初期化

        // ★★★ AudioContextの遅延初期化 ★★★
        this.audioContext = null; 
        // ユーザーの最初の操作でAudioContextを有効化する
        this.scene.input.once('pointerdown', () => {
            if (this.scene.sound.context.state === 'suspended') {
                this.scene.sound.context.resume();
            }
            // PhaserのAudioContextを流用する
            this.audioContext = this.scene.sound.context;
            console.log("AudioContext is ready.");
        }, this);

        // --- 設定変更イベントの監視 ---
        this.configManager.on('change:bgmVolume', (newValue) => {
            if (this.currentBgm && this.currentBgm.isPlaying) {
                this.currentBgm.setVolume(newValue);
            }
        });

        this.configManager.on('change:seVolume', (newValue) => {
            // (将来的な拡張用)
        });
    }
   // ★★★ 追加: Tweenを実行するための、現在アクティブなシーンを取得するヘルパー ★★★
    _getTweenRunnerScene() {
        // 自身の親シーンがアクティブなら、それを使う
        if (this.scene && this.scene.scene.isActive()) {
            return this.scene;
        }
        // 親シーンがアクティブでない場合（pause/stopされている）、
        // 常にアクティブなSystemSceneをフォールバックとして使う
        const systemScene = this.scene.scene.get('SystemScene');
        if (systemScene && systemScene.scene.isActive()) {
            return systemScene;
        }
        // どちらも見つからない場合は、自身のシーンを返す（エラーになる可能性があるが、最善を尽くす）
        return this.scene;
    }
    playSe(key, options = {}) {
        if (!key) return;
        const se = this.scene.sound.add(key);
        let volume = this.configManager.getValue('seVolume');
        if (options.volume !== undefined) {
            volume = Number(options.volume);
        }
        se.setVolume(volume);
        se.play();
    }

    playBgm(key, fadeInTime = 0) {
        if (!key) return;

        if (this.currentBgm && this.currentBgm.isPlaying) {
            this.scene.tweens.add({
                targets: this.currentBgm,
                volume: 0,
                duration: fadeInTime,
                onComplete: () => {
                    this.currentBgm.stop();
                }
            });
        }

        const newBgm = this.scene.sound.add(key, { loop: true, volume: 0 });
        newBgm.play();
        this.currentBgm = newBgm;
        this.currentBgmKey = key;

        this.scene.tweens.add({
            targets: newBgm,
            volume: this.configManager.getValue('bgmVolume'),
            duration: fadeInTime
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
    stopBgm(fadeOutTime = 0) {
        if (this.currentBgm && this.currentBgm.isPlaying) {
            if (fadeOutTime > 0) {
                this.scene.tweens.add({
                    targets: this.currentBgm,
                    volume: 0,
                    duration: fadeOutTime,
                    onComplete: () => {
                        this.currentBgm.stop();
                        this.currentBgm = null;
                        this.currentBgmKey = null;
                    }
                });
            } else {
                this.currentBgm.stop();
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