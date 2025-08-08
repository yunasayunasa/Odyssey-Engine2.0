/**
 * [live_breath_stop] タグ
 * キャラクターの呼吸モーションを停止する
 */
export function handleLiveBreathStop(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[live_breath_stop] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];

    // 対象がRopeオブジェクトかを確認
    if (!chara || !chara.points) {
        return Promise.resolve();
    }

    // 呼吸Tweenを取得して停止
    const breathTween = chara.getData('liveBreathTween');
    if (breathTween) {
        breathTween.stop();
        chara.setData('liveBreathTween', null);
        
        // Ropeの形状を、生成時の元の状態に手動でリセットする
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