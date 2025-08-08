/**
 * [puppet_move] タグ
 * キャラクターを人形劇のように揺らしながら移動させる
 */
export function handlePuppetMove(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[puppet_move] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];
    if (!chara) { console.warn(`[puppet_move] キャラクター[${name}]が見つかりません。`); return Promise.resolve(); }

    const noWait = params.nowait === 'true';

    // nowait=falseの場合、Promiseを返して完了を待つ
    return new Promise(resolve => {
        // 1. パラメータのデフォルト値を設定
        const time = Number(params.time) || 2000;
        const targetX = params.x !== undefined ? Number(params.x) : chara.x;
        const targetY = params.y !== undefined ? Number(params.y) : chara.y;
        
        const swayAmount = Number(params.sway_amount) || 10;
        const swaySpeed = Number(params.sway_speed) || 250;
        const angle = Number(params.angle) || 0;
        const pivot = params.pivot || 'bottom';

        // 2. 回転軸(pivot)を設定
        if (pivot === 'bottom') chara.setOrigin(0.5, 1.0);
        else if (pivot === 'top') chara.setOrigin(0.5, 0);
        else chara.setOrigin(0.5, 0.5);

        // 3. 複数のTweenを同時に実行
        // Tween A: 全体の移動
        manager.scene.tweens.add({
            targets: chara,
            x: targetX,
            y: targetY,
            duration: time,
            ease: 'Sine.easeInOut'
        });

        // Tween B: 左右の揺れ
        manager.scene.tweens.add({
            targets: chara,
            angle: { from: angle - swayAmount, to: angle + swayAmount },
            duration: swaySpeed,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
        });
        
        // 4. 移動完了時に揺れを止める
        manager.scene.time.delayedCall(time, () => {
            manager.scene.tweens.killTweensOf(chara);
            chara.setPosition(targetX, targetY);
            chara.setAngle(0);
            chara.setOrigin(0.5, 0.5);
            
            // nowaitに関わらず、アニメーション完了時に解決する
            resolve();
        });

        // nowait=trueの場合、即座に解決
        if (noWait) {
            resolve();
        }
    });
}