// src/handlers/playbgm.js (このコードが正しい)

/**
 * [playbgm] タグの処理
 * BGMを再生し、フェードインが完了するまで待機する。
 * @param {ScenarioManager} manager
 * @param {Object} params - { storage, fadein }
 * @returns {Promise<void>}
 */
export function handlePlayBgm(manager, params) {
    // ★★★ このPromiseベースのコードが、コールバックを受け取るSoundManagerと正しく連携します ★★★
    return new Promise(resolve => {
        const key = params.storage;
        const fadeInTime = params.fadein ? parseInt(params.fadein, 10) : 0;

        // SoundManagerに、完了時にresolveを呼び出すよう依頼
        manager.soundManager.playBgm(key, fadeInTime, resolve);
    });
}