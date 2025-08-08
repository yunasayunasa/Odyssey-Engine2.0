// ★★★ src/handlers/live_show.js をこの最終コードで置き換えてください ★★★

/**
 * [live_show] タグ
 * Live2D風モーション用のキャラクターをRopeオブジェクトとして表示する (最終確定版)
 */
export function handleLiveShow(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[live_show] nameは必須です。'); return Promise.resolve(); }
    
    const storage = params.storage;
    if (!storage) { console.warn('[live_show] storageは必須です。'); return Promise.resolve(); }
    const x = params.x !== undefined ? Number(params.x) : manager.scene.scale.width / 2;
    const y = params.y !== undefined ? Number(params.y) : manager.scene.scale.height / 2;
    const time = Number(params.time) || 0;

    if (manager.scene.characters[name]) {
        manager.scene.characters[name].destroy();
    }

    // --- ここからがRopeオブジェクトの生成方法 ---

    // 1. 画像のサイズを取得
    const texture = manager.scene.textures.get(storage);
    if (!texture || texture.key === '__MISSING') {
        console.error(`[live_show] テクスチャ[${storage}]が見つかりません。`);
        return Promise.resolve();
    }
    const { width, height } = texture.getSourceImage();

    // 2. this.add.rope() を使ってRopeオブジェクトを生成
    //    Ropeは自動的に画像を水平方向に分割する。ここでは垂直方向にも分割したいので、
    //    手動でpoints配列を作成する。2x2のグリッドを作る。
    const points = [];
    const horizontalSegments = 2;
    const verticalSegments = 2;
    for (let i = 0; i <= verticalSegments; i++) {
        for (let j = 0; j <= horizontalSegments; j++) {
            points.push(new Phaser.Math.Vector2(j * (width / horizontalSegments), i * (height / verticalSegments)));
        }
    }
    
    // Ropeオブジェクトを生成し、原点を中央に設定
    const chara = manager.scene.add.rope(x, y, storage, null, points, true);
    chara.setOrigin(0.5, 0.5);

    // --- Ropeオブジェクトの生成ここまで ---

    manager.layers.character.add(chara);
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