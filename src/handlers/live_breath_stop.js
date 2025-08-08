/**
 * [live_breath_stop] タグ
 * キャラクターの呼吸モーションを停止する
 */
export function handleLiveBreathStop(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[live_breath_stop] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];
    if (!chara) { console.warn(`[live_breath_stop] キャラクター[${name}]が見つかりません。`); return Promise.resolve(); }

    const breathTween = chara.getData('liveBreathTween');
    if (breathTween) {
        breathTween.stop();
        chara.setData('liveBreathTween', null);
        chara.resetVertices(); // ★ 頂点を元の位置に戻す
    }
    return Promise.resolve();
}