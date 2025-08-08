/**
 * [mesh_show] タグ (最終・確定・安定版)
 * キャラクターをMeshオブジェクトとして表示する
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

    // 画像があなたのエンジン内で既にロードされていることを前提とする
    const texture = manager.scene.textures.get(storage);
    if (!texture || texture.key === '__MISSING') {
        console.error(`[mesh_show] アセット[${storage}]が見つかりません。PreloadSceneまたは@assetでロードされていますか？`);
        return Promise.resolve();
    }
    const { width, height } = texture.getSourceImage();

    // --- フラット配列によるグリッド情報生成 ---
    const h_segments = 2, v_segments = 2;
    const vertices = [], uvs = [], colors = [], alphas = [];
    for (let i = 0; i <= v_segments; i++) {
        const v = i / v_segments;
        for (let j = 0; j <= h_segments; j++) {
            const u = j / h_segments;
            vertices.push((u * width) - (width / 2), (v * height) - (height / 2));
            uvs.push(u, v);
            colors.push(0xffffff);
            alphas.push(1);
        }
    }
    const faces = [];
    for (let i = 0; i < v_segments; i++) {
        for (let j = 0; j < h_segments; j++) {
            const p1 = i * (h_segments + 1) + j, p2 = p1 + 1, p3 = p1 + (h_segments + 1), p4 = p3 + 1;
            faces.push(p1, p3, p4, p1, p4, p2);
        }
    }
    
    // add.meshの引数に、フラット配列を渡す
    const chara = manager.scene.add.mesh(x, y, storage, null, vertices, uvs, faces, false, null, colors, alphas);
    
    manager.layers.character.add(chara);
    chara.setAlpha(0);
    manager.scene.characters[name] = chara;

    return new Promise(resolve => {
        if (time > 0) {
            manager.scene.tweens.add({ targets: chara, alpha: 1, duration: time, ease: 'Linear', onComplete: resolve });
        } else {
            chara.setAlpha(1);
            resolve();
        }
    });
}
