// ★★★ src/handlers/live_show.js をこのRope版に戻してください ★★★
export function handleLiveShow(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[live_show] nameは必須です。'); return Promise.resolve(); }
    const storage = params.storage;
    if (!storage) { console.warn('[live_show] storageは必須です。'); return Promise.resolve(); }
    let x = params.x !== undefined ? Number(params.x) : manager.scene.scale.width / 2;
    let y = params.y !== undefined ? Number(params.y) : manager.scene.scale.height / 2;
    const time = Number(params.time) || 0;

    if (manager.scene.characters[name]) manager.scene.characters[name].destroy();

    const texture = manager.scene.textures.get(storage);
    if (!texture || texture.key === '__MISSING') {
        console.error(`[live_show] テクスチャ[${storage}]が見つかりません。`);
        return Promise.resolve();
    }
    const { width, height } = texture.getSourceImage();

    // Ropeの原点が左上固定なので、中心が(x, y)に来るように座標を補正
    x = x - width / 2;
    y = y - height / 2;

    const points = [];
    const hSeg = 2, vSeg = 2;
    for (let i = 0; i <= vSeg; i++) {
        for (let j = 0; j <= hSeg; j++) {
            points.push(new Phaser.Math.Vector2(j * (width / hSeg), i * (height / vSeg)));
        }
    }
    
    const chara = manager.scene.add.rope(x, y, storage, null, points);
    
    manager.layers.character.add(chara);
    // ★ highlightSpeakerがアルファを管理するので、初期アルファは1.0にする
    chara.setAlpha(0);
    manager.scene.characters[name] = chara;

    return new Promise(resolve => {
        if (time > 0) {
            manager.scene.tweens.add({
                targets: chara,
                alpha: 1,
                duration: time,
                ease: 'Linear',
                onComplete: resolve
            });
        } else {
            chara.setAlpha(1);
            resolve();
        }
    });
}