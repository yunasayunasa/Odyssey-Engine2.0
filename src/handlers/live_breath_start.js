// ★★★ src/handlers/live_breath_start.js をこのコードで置き換えてください ★★★

export function handleLiveBreathStart(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[live_breath_start] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];
    if (!chara || !chara.points) { // Ropeオブジェクトか確認
        console.warn(`[live_breath_start] キャラクター[${name}]はRopeオブジェクトではありません。`);
        return Promise.resolve();
    }

    if (chara.getData('liveBreathTween')) chara.getData('liveBreathTween').stop();

    const speed = Number(params.speed) || 3500;
    const amount = Number(params.amount) || 1.5;

    // Ropeのpoints配列を取得 (2x2グリッドなので9個のVector2オブジェクト)
    // 0--1--2
    // 3--4--5
    // 6--7--8
    const points = chara.points;
    const topCenterPoint = points[1];
    const centerPoint = points[4];
    
    const breathTween = manager.scene.tweens.add({
        targets: [topCenterPoint, centerPoint],
        y: `-=${amount}`, // yプロパティを直接Tweenできる
        duration: speed / 2,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
    });

    chara.setData('liveBreathTween', breathTween);
    return Promise.resolve();
}