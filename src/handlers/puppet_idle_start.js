/**
 * [puppet_idle_start] タグ
 * キャラクターをその場でゆらゆら揺らし始める
 */
export function handlePuppetIdleStart(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[puppet_idle_start] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];
    if (!chara) { console.warn(`[puppet_idle_start] キャラクター[${name}]が見つかりません。`); return Promise.resolve(); }

    if (chara.getData('puppetIdleTween')) {
        chara.getData('puppetIdleTween').stop();
    }

    const swayAmount = Number(params.amount) || 2;
    const swaySpeed = Number(params.speed) || 1000;
    const pivot = params.pivot || 'bottom';

    // ★★★ ここから修正 ★★★
    if (pivot === 'bottom') {
        // 原点を足元に変更する前に、現在のY座標を保持
        const originalY = chara.y;
        // 原点を足元に設定
        chara.setOrigin(0.5, 1.0);
        
        // ★ 座標のズレを補正 ★
        // 原点を中央から足元に変えると、画像の高さの半分だけ上にズレるので、
        // その分だけY座標を足して、見た目の位置を元に戻す。
        chara.y = originalY + (chara.height / 2);

    } else {
        chara.setOrigin(0.5, 0.5);
    }
    // ★★★ ここまで修正 ★★★

    const idleTween = manager.scene.tweens.add({
        targets: chara,
        angle: { from: -swayAmount, to: swayAmount },
        duration: swaySpeed,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
    });

    chara.setData('puppetIdleTween', idleTween);
    return Promise.resolve();
}