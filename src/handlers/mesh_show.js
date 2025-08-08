export function handleMeshShow(manager, params) {
    const name = params.name;
    if (!name) {
        console.warn('[mesh_show] nameは必須です。');
        return Promise.resolve();
    }

    const storage = params.storage;
    if (!storage) {
        console.warn('[mesh_show] storageは必須です。');
        return Promise.resolve();
    }

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

    const frame = texture.get();
    const width = frame.width;
    const height = frame.height;

    console.log(`[mesh_show] width: ${width}, height: ${height}`);

    const h_segments = 2;
    const v_segments = 2;
    const total_vertices = (h_segments + 1) * (v_segments + 1);

    const vertices = [];
    const uvs = [];
    const colors = [];
    const alphas = [];

    for (let i = 0; i <= v_segments; i++) {
        const v = i / v_segments;
        for (let j = 0; j <= h_segments; j++) {
            const u = j / h_segments;

            // 頂点座標を中心に合わせる
            const vx = (u * width) - (width / 2);
            const vy = (v * height) - (height / 2);

            vertices.push(vx, vy);
            uvs.push(u, v);
            colors.push(0xffffff); // 白
            alphas.push(1);        // 不透明
        }
    }

    const faces = [];
    for (let i = 0; i < v_segments; i++) {
        for (let j = 0; j < h_segments; j++) {
            const p1 = i * (h_segments + 1) + j;
            const p2 = p1 + 1;
            const p3 = p1 + (h_segments + 1);
            const p4 = p3 + 1;
            faces.push(p1, p3, p4, p1, p4, p2);
        }
    }

    console.log('[mesh_show] vertices:', vertices.length / 2);
    console.log('[mesh_show] uvs:', uvs.length / 2);
    console.log('[mesh_show] colors:', colors.length);
    console.log('[mesh_show] alphas:', alphas.length);
    console.log('[mesh_show] faces:', faces.length / 3, 'triangles');

    const mesh = manager.scene.add.mesh(x, y, storage, null, vertices, uvs, colors, alphas, faces);

    mesh.setAlpha(1); // 初期状態で表示
    mesh.setTint(0xffffff); // 白（無加工）
    mesh.setOrigin(0.5); // 中心合わせ（念のため）

    // テスト的にスケール拡大してみる（画像が小さい場合に備え）
    // mesh.setScale(2);

    manager.layers.character.add(mesh);
    manager.scene.characters[name] = mesh;

    return new Promise(resolve => {
        if (time > 0) {
            mesh.setAlpha(0); // フェードイン対応
            manager.scene.tweens.add({
                targets: mesh,
                alpha: 1,
                duration: time,
                ease: 'Linear',
                onComplete: resolve
            });
        } else {
            resolve();
        }
    });
}