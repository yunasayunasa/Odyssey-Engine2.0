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

    const vertices = [];
    const uvs = [];
    const indices = [];

    for (let iy = 0; iy <= v_segments; iy++) {
        const v = iy / v_segments;
        for (let ix = 0; ix <= h_segments; ix++) {
            const u = ix / h_segments;
            const vx = (u * width) - (width / 2);
            const vy = (v * height) - (height / 2);
            vertices.push(vx, vy, 0);  // z=0 を明示的に入れる（重要）
            uvs.push(u, v);
        }
    }

    for (let iy = 0; iy < v_segments; iy++) {
        for (let ix = 0; ix < h_segments; ix++) {
            const a = iy * (h_segments + 1) + ix;
            const b = a + 1;
            const c = a + (h_segments + 1);
            const d = c + 1;
            indices.push(a, c, d);
            indices.push(a, d, b);
        }
    }

    console.log('[mesh_show] vertices:', vertices.length / 3);
    console.log('[mesh_show] uvs:', uvs.length / 2);
    console.log('[mesh_show] faces:', indices.length / 3, 'triangles');

    const mesh = manager.scene.add.mesh(x, y, storage, null, vertices, uvs, indices);

    mesh.setAlpha(1);
    mesh.setTint(0xffffff);
    mesh.setScale(1);

    manager.layers.character.add(mesh);
    manager.scene.characters[name] = mesh;

    return new Promise(resolve => {
        if (time > 0) {
            mesh.setAlpha(0);
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