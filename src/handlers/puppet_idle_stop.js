/**
 * [puppet_idle_stop] タグ
 * キャラクターのその場での揺れを停止する
 */
export function handlePuppetIdleStop(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[puppet_idle_stop] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];
    if (!chara) { console.warn(`[puppet_idle_stop] キャラクター[${name}]が見つかりません。`); return Promise.resolve(); }

    const idleTween = chara.getData('puppetIdleTween');
    if (idleTween) {
        idleTween.stop();
        chara.setData('puppetIdleTween', null);
    }

    chara.angle = 0;
    chara.setOrigin(0.5, 0.5);
    return Promise.resolve();
}