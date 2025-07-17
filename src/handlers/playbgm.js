/**
 * [playbgm] タグの処理
 * BGMを再生、またはクロスフェードで切り替える
 * @param {ScenarioManager} manager
 * @param {Object} params - { storage, volume, time }
 * @returns {Promise<void>}
 */
export function handlePlayBgm(manager, params) {
    return new Promise(resolve => {
        const storage = params.storage;
        if (!storage) {
            console.warn('[playbgm] storageは必須です。');
            resolve();
            return;
        }

        // volume は SoundManager の config を参照するので、ここでは渡さないのが一般的
        // time はフェードイン時間
        const time = Number(params.time) || 0;

        // ★★★ SoundManagerに再生を依頼するだけ ★★★
        manager.soundManager.playBgm(storage, time);

        // ★★★ stateManagerの更新は不要 ★★★
        // SoundManagerが現在のBGMを管理し、セーブ時にStateManagerがそれを取得する

        // フェードイン時間分だけ待機してから完了を通知する
        manager.scene.time.delayedCall(time, () => {
            resolve();
        });
    });
}