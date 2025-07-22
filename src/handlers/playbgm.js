/**
 * [playbgm] タグの処理
 * 新しい非同期SoundManagerに対応
 * @param {ScenarioManager} manager
 * @param {Object} params - { storage, fadein }
 */
export async function handlePlayBgm(manager, params) {
    const key = params.storage;
    const fadeInTime = params.fadein ? parseInt(params.fadein, 10) : 0;
    
    // ★★★ asyncになったplayBgmの完了を、awaitで正しく待つ ★★★
    await manager.soundManager.playBgm(key, fadeInTime);
}