// ★★★ src/handlers/live_breath_stop.js をこのコードで置き換えてください ★★★

export function handleLiveBreathStop(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[live_breath_stop] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];
    if (!chara || !chara.points) return Promise.resolve();

    const breathTween = chara.getData('liveBreathTween');
    if (breathTween) {
        breathTween.stop();
        chara.setData('liveBreathTween', null);
        // ★ Ropeの形状をリセットするには、updatePoints()を呼ぶ
        chara.updatePoints(); 
    }
    return Promise.resolve();
}