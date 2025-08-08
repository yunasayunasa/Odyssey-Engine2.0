// ★★★ src/handlers/mesh_show.js をこの最終コードで置き換えてください ★★★

/**
 * [mesh_show] タグ
 * キャラクターをMeshオブジェクトとして表示する (手動グリッド生成版)
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

    // --- ここからが手動でのグリッド情報生成 ---

    const h_segments = 2; // 水平分割数
    const v_segments = 2; // 垂直分割数

    const vertices = [];
    const uvs = [];
    
    // 頂点(vertices)とUV座標を計算
    for (let i = 0; i <= v_segments; i++) {
        const v = i / v_segments; // UVのV座標 (0.0 ~ 1.0)
        for (let j = 0; j <= h_segments; j++) {
            const u = j / h_segments; // UVのU座標 (0.0 ~ 1.0)
            
            // 頂点座標は画像の中心を(0,0)とする相対座標
            vertices.push((u * width) - (width / 2), (v * height) - (height / 2));
            // UV座標
            uvs.push(u, v);
        }
    }

    // 面(faces)情報を計算
    // 格子の一つ一つを2つの三角形で表現する
    const faces = [];
    for (let i = 0; i < v_segments; i++) {
        for (let j = 0; j < h_segments; j++) {
            const p1 = i * (h_segments + 1) + j;       // 左上
            const p2 = i * (h_segments + 1) + (j + 1); // 右上
            const p3 = (i + 1) * (h_segments + 1) + j; // 左下
            const p4 = (i + 1) * (h_segments + 1) + (j + 1); // 右下
            
            faces.push(p1, p3, p4); // 1つ目の三角形
            faces.push(p1, p4, p2); // 2つ目の三角形
        }
    }

    // --- グリッド情報生成ここまで ---
    
    // 生成した情報を使ってMeshオブジェクトを作成
    const chara = manager.scene.add.mesh(x, y, storage, null, vertices, uvs, null, false, faces);
    
    // ★ setGridは不要なので削除

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