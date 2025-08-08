/**
 * [live_breath_start] タグ
 * キャラクターの呼吸モーションを開始する
 */
export function handleLiveBreathStart(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[live_breath_start] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];

    // 対象がRopeオブジェクトか（pointsプロパティを持つか）を確認
    if (!chara || !chara.points) {
        console.warn(`[live_breath_start] キャラクター[${name}]はRopeオブジェクトではありません。`);
        return Promise.resolve();
    }

    // 既存の呼吸Tweenがあれば停止
    if (chara.getData('liveBreathTween')) {
        chara.getData('liveBreathTween').stop();
    }

    // パラメータ取得
    const speed = Number(params.speed) || 3500;
    const amount = Number(params.amount) || 1.5;

    // Ropeのpoints配列を取得 (2x2グリッドなので9個のVector2オブジェクト)
    // 0--1--2
    // 3--4--5
    // 6--7--8
    const points = chara.points;
    const topCenterPoint = points[1];
    const centerPoint = points[4];
    
    // 頂点の元のY座標を保存しておく（Tweenで絶対値を指定するため）
    const originalTopY = topCenterPoint.y;
    const originalCenterY = centerPoint.y;
    
    const breathTween = manager.scene.tweens.add({
        targets: [topCenterPoint, centerPoint],
        // yプロパティを、元の位置からamountだけ引いた位置までアニメーションさせる
        y: { from: originalTopY, to: originalTopY - amount },
        duration: speed / 2,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
    });

    chara.setData('liveBreathTween', breathTween);
    return Promise.resolve();
}