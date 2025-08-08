// ★★★ src/handlers/live_breath_start.js をこのコードで置き換えてください ★★★
export function handleLiveBreathStart(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[live_breath_start] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];
    if (!chara || !chara.points) {
        console.warn(`[live_breath_start] キャラクター[${name}]はRopeオブジェクトではありません。`);
        return Promise.resolve();
    }

    if (chara.getData('liveBreathTween')) chara.getData('liveBreathTween').stop();

    const speed = Number(params.speed) || 3500;
    const amount = Number(params.amount) || 1.5;

    const points = chara.points;
    // 頂点の元のY座標を保存しておく
    const originalTopY = points[1].y;
    const originalCenterY = points[4].y;

    const topCenterPoint = points[1];
    const centerPoint = points[4];
    
    const breathTween = manager.scene.tweens.add({
        targets: [topCenterPoint, centerPoint],
        // ★ yプロパティを、絶対値で指定する
        y: { from: originalTopY, to: originalTopY - amount },
        duration: speed / 2,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
    });

    chara.setData('liveBreathTween', breathTween);
    return Promise.resolve();
}