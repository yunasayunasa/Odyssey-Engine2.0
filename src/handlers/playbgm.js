// src/handlers/playbgm.js (Promiseを正しく解決する)

/**
 * [playbgm] タグの処理
 * BGMを再生し、フェードインが完了するまで待機する。
 * @param {ScenarioManager} manager
 * @param {Object} params - { storage, fadein }
 * @returns {Promise<void>}
 */
export function handlePlayBgm(manager, params) {
    // ★★★ 修正箇所: Promiseを返すように全体を書き換える ★★★
    return new Promise(resolve => {
        const key = params.storage;
        const fadeInTime = params.fadein ? parseInt(params.fadein, 10) : 0;

        // SoundManagerに、完了時にresolveを呼び出すよう依頼
        manager.soundManager.playBgm(key, fadeInTime, resolve);
    });
}