// ★★★ src/handlers/live_show.js をこの最終コードで置き換えてください ★★★

/**
 * [live_show] タグ
 * Live2D風モーション用のキャラクターをRopeオブジェクトとして表示する (最終確定版・改弐)
 */
export function handleLiveShow(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[live_show] nameは必須です。'); return Promise.resolve(); }
    
    const storage = params.storage;
    if (!storage) { console.warn('[live_show] storageは必須です。'); return Promise.resolve(); }
    
    // パラメータ取得
    let x = params.x !== undefined ? Number(params.x) : manager.scene.scale.width / 2;
    let y = params.y !== undefined ? Number(params.y) : manager.scene.scale.height / 2;
    const time = Number(params.time) || 0;

    if (manager.scene.characters[name]) {
        manager.scene.characters[name].destroy();
    }

    // --- Ropeオブジェクトの生成 ---

    const texture = manager.scene.textures.get(storage);
    if (!texture || texture.key === '__MISSING') {
        console.error(`[live_show] テクスチャ[${storage}]が見つかりません。`);
        return Promise.resolve();
    }
    const { width, height } = texture.getSourceImage();

    // Ropeは原点が左上(0, 0)固定なので、
    // 画像の中心が指定の(x, y)に来るように、表示座標を補正する
    x = x - width / 2;
    y = y - height / 2;

    // points配列を作成 (原点(0,0)からの相対座標で)
    const points = [];
    const horizontalSegments = 2; // 水平分割数
    const verticalSegments = 2;   // 垂直分割数
    for (let i = 0; i <= verticalSegments; i++) {
        for (let j = 0; j <= horizontalSegments; j++) {
            // ここでの座標は、Ropeオブジェクトの左上からの相対位置
            points.push(new Phaser.Math.Vector2(j * (width / horizontalSegments), i * (height / verticalSegments)));
        }
    }
    
    // Ropeオブジェクトを生成
    // 最後の引数`colors`と`alphas`は、今回は使わないのでfalseまたは省略
    const chara = manager.scene.add.rope(x, y, storage, null, points);
    
    // ★★★ RopeにはsetOriginがないので、この行を削除 ★★★
    // chara.setOrigin(0.5, 0.5);

    // --- 生成ここまで ---

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