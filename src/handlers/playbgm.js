// src/handlers/playbgm.js (async/awaitを使った最終修正)

/**
 * [playbgm] タグの処理
 * BGMを再生し、フェード処理が完了するまで待機する。
 * @param {ScenarioManager} manager
 * @param {Object} params - { storage, fadein }
 */
export async function handlePlayBgm(manager, params) {
    const key = params.storage;
    const fadeInTime = params.fadein ? parseInt(params.fadein, 10) : 0;

    // ★★★ 修正箇所: SoundManager.playBgmが返すPromiseをawaitで待つ ★★★
    await manager.soundManager.playBgm(key, fadeInTime);
    
    // このasync関数が完了すると、ScenarioManagerのgameLoopが次に進む
}