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

   
       /**
     * BGMを再生する (最終修正版)
     * 既に再生中の曲があれば、それをフェードアウトさせてから新しい曲を再生する。
     * @param {string} key - 再生するBGMのアセットキー
     * @param {number} fadeTime - フェードイン/アウトにかける時間 (ms)
     */
    async playBgm(key, fadeTime = 500) {
        this.resumeContext();

        // 同じ曲が既に再生中なら何もしない
        if (this.currentBgm && this.currentBgm.isPlaying && this.currentBgmKey === key) {
            console.log(`[SoundManager] BGM '${key}' は既に再生中です。`);
            return;
        }
        
        // ★★★ 競合防止ロック (isFadingは残す) ★★★
        if (this.isFading) {
            console.warn(`[SoundManager] フェード処理中に新しいplayBgmリクエストがありました。無視します。`);
            return;
        }
        
        // 1. もし現在、別のBGMが再生中なら、それをフェードアウトさせる
        if (this.currentBgm && this.currentBgm.isPlaying) {
            console.log(`[SoundManager] 古いBGM '${this.currentBgmKey}' を停止します。`);
            // await を使って、停止処理が終わるのを「完全に」待つ
            await this.stopBgm(fadeTime); 
        }

        // 2. 新しいBGMをフェードインで再生する
        console.log(`[SoundManager] 新しいBGM '${key}' を再生します。`);
        
        const targetVolume = this.configManager.getValue('bgmVolume');
        const newBgm = this.sound.add(key, { loop: true, volume: 0 });
        
        this.currentBgm = newBgm;
        this.currentBgmKey = key;
        
        newBgm.play();

        if (fadeTime > 0 && targetVolume > 0) {
            await this.fadeTo(newBgm, targetVolume, fadeTime);
        } else {
            newBgm.setVolume(targetVolume);
        }
        console.log(`[SoundManager] BGM '${key}' の再生を開始しました。`);
    }

    /**
     * BGMを停止する (最終修正版)
     * @param {number} fadeOutTime - フェードアウトにかける時間 (ms)
     */
    async stopBgm(fadeOutTime = 500) {
        if (!this.currentBgm || !this.currentBgm.isPlaying) {
            this.currentBgm = null;
            this.currentBgmKey = null;
            return; // 止めるべきBGMがなければ即終了
        }
        
        if (this.isFading) {
            console.warn(`[SoundManager] フェード処理中に新しいstopBgmリクエストがありました。無視します。`);
            return;
        }

        const bgmToStop = this.currentBgm;
        const stoppingKey = this.currentBgmKey;
        
        // ★ 先にプロパティをnullにして、連続呼び出しを防ぐ
        this.currentBgm = null;
        this.currentBgmKey = null;
        
        console.log(`[SoundManager] BGM '${stoppingKey}' の停止処理を開始します。`);

        if (fadeOutTime > 0 && bgmToStop.volume > 0) {
            await this.fadeTo(bgmToStop, 0, fadeOutTime);
            // フェード完了後に破棄
            if (bgmToStop.isPlaying) {
                bgmToStop.stop();
            }
            bgmToStop.destroy();
        } else {
            // 即時停止
            if (bgmToStop.isPlaying) {
                bgmToStop.stop();
            }
            bgmToStop.destroy();
        }
        console.log(`[SoundManager] BGM '${stoppingKey}' を完全に停止・破棄しました。`);
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
