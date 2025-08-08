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
        
        // ★ 形状を手動でリセットする
        // Ropeのpointsは元の形状を覚えていないので、再計算してあげる
        const { width, height } = chara.texture.getSourceImage();
        const points = [];
        const horizontalSegments = 2;
        const verticalSegments = 2;
        for (let i = 0; i <= verticalSegments; i++) {
            for (let j = 0; j <= horizontalSegments; j++) {
                points.push(new Phaser.Math.Vector2(j * (width / horizontalSegments), i * (height / verticalSegments)));
            }
        }
        // updatePointsに新しいpoints配列を渡して形状を更新
        chara.updatePoints(points);
    }
    return Promise.resolve();
}