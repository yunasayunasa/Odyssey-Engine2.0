export default class SoundManager {
    constructor(game) {
        this.game = game;
        this.sound = game.sound;
        this.configManager = this.game.registry.get('configManager');
        if (!this.configManager) {
            console.error("SoundManager: ConfigManagerが見つかりません！");
        }
        this.currentBgm = null; // Phaser.Sound.BaseSoundオブジェクト
        
        // ★★★ 状態管理用のプロパティを追加 ★★★
        this.isStopping = false; // 停止処理中フラグ
        this.isStarting = false; // 再生処理中フラグ

         // ★★★ 音量変更イベントのリスナーを設定 ★★★
        // これがコンフィグ画面からの操作を反映させる部分
        this.configManager.on('change:bgmVolume', this.onBgmVolumeChange, this);
        this.game.events.once(Phaser.Core.Events.DESTROY, this.destroy, this);
    }
    // AudioContextを安全に再開
    resumeContext() {
        if (this.sound.context.state === 'suspended') {
            this.sound.context.resume().then(() => console.log("SoundManager: AudioContextが再開されました。"));
        }
    }
   // ★★★ コンフィグ変更時に再生中のBGM音量を更新するメソッド ★★★
    onBgmVolumeChange(newVolume) {
        if (this.currentBgm && this.currentBgm.isPlaying) {
            // isFading中はTweenと競合する可能性があるので避ける
            if (!this.isFading) {
                this.currentBgm.setVolume(newVolume);
            }
        }
    }
   
       /**
     * BGMを再生する (最終修正版)
     * 既に再生中の曲があれば、それをフェードアウトさせてから新しい曲を再生する。
     * @param {string} key - 再生するBGMのアセットキー
     * @param {number} fadeTime - フェードイン/アウトにかける時間 (ms)
     */
       /**
     * BGMを再生する (非同期競合対策版)
     */
     // playBgm から async を削除し、音量設定を確実に行う
    playBgm(key, fadeTime = 500) {
        this.resumeContext();

        if (this.isFading || (this.currentBgm && this.currentBgmKey === key)) {
            return;
        }

        // 古いBGMがあれば停止命令を出す (既存のロジックのまま)
        if (this.currentBgm && this.currentBgm.isPlaying) {
            this.stopBgm(fadeTime);
        }

        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ これが今回の修正の核心 ★★★
        // ★★★ 再生する瞬間に、ConfigManagerから最新の音量を取得 ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        const targetVolume = this.configManager.getValue('bgmVolume');
        console.log(`[SoundManager] playBgm: '${key}' を再生します。Configからの目標音量: ${targetVolume}`);

        const newBgm = this.sound.add(key, { 
            loop: true, 
            // ★ 初期音量をここで設定する（フェードインしない場合のため）
            volume: targetVolume 
        });

        this.currentBgm = newBgm;
        this.currentBgmKey = key;
        
        // ★★★ フェードインする場合、初期音量を0にリセットしてから再生 ★★★
        if (fadeTime > 0) {
            newBgm.setVolume(0);
        }
        
        newBgm.play();

        // フェードイン処理
        if (fadeTime > 0) {
            this.isFading = true;
            this.fadeTo(newBgm, targetVolume, fadeTime, () => {
                this.isFading = false;
            });
        }
    }

    /**
     * BGMを停止する (非同期競合対策版)
     */
    async stopBgm(fadeOutTime = 500) {
        if (!this.currentBgm || !this.currentBgm.isPlaying) {
            return;
        }

        if (this.isFading) {
            console.warn(`[SoundManager] フェード処理中に新しいstopBgmリクエストがありました。無視します。`);
            return;
        }
        this.isFading = true;

        const bgmToStop = this.currentBgm;
        const stoppingKey = this.currentBgmKey;
        
        console.log(`[SoundManager] BGM '${stoppingKey}' の停止処理を開始します。`);

        if (fadeOutTime > 0 && bgmToStop.volume > 0) {
            await this.fadeTo(bgmToStop, 0, fadeOutTime);
        }
        
        if (bgmToStop.isPlaying) bgmToStop.stop();
        bgmToStop.destroy();

        // ★ 完全に停止・破棄が完了した後に、状態をnullにする
        this.currentBgm = null;
        this.currentBgmKey = null;
        
        this.isFading = false;
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
