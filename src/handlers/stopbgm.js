/**
 * [stopbgm] タグの処理
 * 新しい非同期SoundManagerに対応
 * @param {ScenarioManager} manager
 * @param {Object} params - { fadeout }
 */
export async function handleStopBgm(manager, params) {
    const fadeOutTime = params.fadeout ? parseInt(params.fadeout, 10) : 0;

    // ★★★ asyncになったstopBgmの完了を、awaitで正しく待つ ★★★
    await manager.soundManager.stopBgm(fadeOutTime);
}