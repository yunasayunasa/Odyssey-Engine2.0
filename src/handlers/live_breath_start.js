export function handleLiveBreathStart(manager, params) {
    const name = params.name;
    if (!name) { return Promise.resolve(); }
    const chara = manager.scene.characters[name];
    if (!chara) { return Promise.resolve(); }
    if (chara.getData('liveBreathTween')) chara.getData('liveBreathTween').stop();

    const speed = Number(params.speed) || 4000;
    const amount = Number(params.amount) || 0.015;

    chara.setOrigin(0.5, 0.7); // 呼吸の支点を「へそ」あたりに

    const breathTween = manager.scene.tweens.add({
        targets: chara,
        scaleY: 1 + amount,
        duration: speed / 2,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
    });

    chara.setData('liveBreathTween', breathTween);
    return Promise.resolve();
}