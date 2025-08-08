// ★★★ src/handlers/mesh_show.js をこの最終コードで置き換えてください ★★★

/**
 * [mesh_show] タグ
 * キャラクターをMeshオブジェクトとして表示する (Color & Alpha対応版)
 */
export function handleMeshShow(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[mesh_show] nameは必須です。'); return Promise.resolve(); }
    
    const storage = params.storage;
    if (!storage) { console.warn('[mesh_show] storageは必須です。'); return Promise.resolve(); }
    const x = params.x !== undefined ? Number(params.x) : manager.scene.scale.width / 2;
    const y = params.y !== undefined ? Number(params.y) : manager.scene.scale.height / 2;
    const time = Number(params.time) || 0;

    if (manager.scene.characters[name]) {
        manager.scene.characters[name].destroy();
    }

    const texture = manager.scene.textures.get(storage);
    if (!texture || texture.key === '__MISSING') {
        console.error(`[mesh_show] テクスチャ[${storage}]が見つかりません。`);
        return Promise.resolve();
    }
    const { width, height } = texture.getSourceImage();

    const h_segments = 2;
    const v_segments = 2;
    const total_vertices = (h_segments + 1) * (v_segments + 1);

    const vertices = [];
    const uvs = [];
    
    for (let i = 0; i <= v_segments; i++) {
        const v = i / v_segments;
        for (let j = 0; j <= h_segments; j++) {
            const u = j / h_segments;
            vertices.push((u * width) - (width / 2), (v * height) - (height / 2));
            uvs.push(u, v);
        }
    }

    const faces = [];
    for (let i = 0; i < v_segments; i++) {
        for (let j = 0; j < h_segments; j++) {
            const p1 = i * (h_segments + 1) + j;
            const p2 = i * (h_segments + 1) + (j + 1);
            const p3 = (i + 1) * (h_segments + 1) + j;
            const p4 = (i + 1) * (h_segments + 1) + (j + 1);
            faces.push(p1, p3, p4, p1, p4, p2);
        }
    }

    // ★★★ ここからが修正箇所 ★★★
    // 頂点ごとの色とアルファ値を指定する配列を作成
    const colors = [];
    const alphas = [];
    for (let i = 0; i < total_vertices; i++) {
        colors.push(0xffffff); // すべての頂点を白(tintなし)に
        alphas.push(1);        // すべての頂点を不透明に
    }

    // this.add.meshの引数に、colorsとalphasを追加
    // シグネチャ: (x, y, texture, frame, vertices, uvs, colors, alphas, faces)
    const chara = manager.scene.add.mesh(x, y, storage, null, vertices, uvs, colors, alphas, faces);
    // ★★★ ここまでが修正箇所 ★★★
    
    manager.layers.character.add(chara);
    // フェードインに備えて、オブジェクト全体のアルファを0にする
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