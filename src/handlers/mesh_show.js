/**
 * [mesh_show] タグ
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

    const texture = manager.scene.textures.get(storage);
    if (!texture || texture.key === '__MISSING') {
        console.error(`[mesh_show] テクスチャ[${storage}]が見つかりません。`);
        return Promise.resolve();
    }
    const { width, height } = texture.getSourceImage();

    // Meshオブジェクトを生成するための頂点・UV・面情報
    const vertices = [ -width / 2, -height / 2, width / 2, -height / 2, -width / 2, height / 2, width / 2, height / 2 ];
    const uvs = [ 0, 0, 1, 0, 0, 1, 1, 1 ];
    const faces = [ 0, 2, 3, 0, 3, 1 ];

    const chara = manager.scene.add.mesh(x, y, storage, null, vertices, uvs, null, false, faces);
    
    // 呼吸モーションのために2x2のグリッドに分割
    chara.setGrid(2, 2); 
    
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
