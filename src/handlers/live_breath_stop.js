export function handleLiveBreathStop(manager, params) {
    const name = params.name;
    if (!name) { return Promise.resolve(); }
    const chara = manager.scene.characters[name];
    if (!chara) { return Promise.resolve(); }

    const breathTween = chara.getData('liveBreathTween');
    if (breathTween) {
        breathTween.stop();
        chara.setData('liveBreathTween', null);
        chara.setScale(1);
        chara.setOrigin(0.5, 0.5);
    }
    return Promise.resolve();
}