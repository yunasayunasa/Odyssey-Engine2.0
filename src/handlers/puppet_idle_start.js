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

    if (pivot === 'bottom') chara.setOrigin(0.5, 1.0);
    else chara.setOrigin(0.5, 0.5);

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