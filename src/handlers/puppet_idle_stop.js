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

     // ★★★ ここから修正 ★★★
    // 原点を中央に戻す前に、現在のY座標を保持
    const currentY = chara.y;
    const wasBottomPivot = (chara.originY === 1.0); // 足元軸だったか？

    // 姿勢をまっすぐに戻し、原点も中央に戻す
    chara.angle = 0;
    chara.setOrigin(0.5, 0.5);

    // ★ もし足元軸だったなら、座標を補正して見た目の位置を維持
    if (wasBottomPivot) {
        chara.y = currentY - (chara.height / 2);
    }
    // ★★★ ここまで修正 ★★★
    return Promise.resolve();
}