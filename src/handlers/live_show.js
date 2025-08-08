// ★★★ src/handlers/live_show.js をこの最終コードで置き換えてください ★★★

/**
 * [live_show] タグ
 * Live2D風モーション用のキャラクターをMeshオブジェクトとして表示する (確定版)
 */
export function handleLiveShow(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[live_show] nameは必須です。'); return Promise.resolve(); }
    
    // パラメータ取得
    const storage = params.storage;
    if (!storage) { console.warn('[live_show] storageは必須です。'); return Promise.resolve(); }
    const x = params.x !== undefined ? Number(params.x) : manager.scene.scale.width / 2;
    const y = params.y !== undefined ? Number(params.y) : manager.scene.scale.height / 2;
    const time = Number(params.time) || 0;

    // 既存のキャラクターがいれば破棄
    if (manager.scene.characters[name]) {
        manager.scene.characters[name].destroy();
    }

    // --- ここからが正しいMeshオブジェクトの生成方法 ---

    // 1. Meshオブジェクトを生成するために、まず画像のサイズを取得する
    const texture = manager.scene.textures.get(storage);
    if (!texture || texture.key === '__MISSING') {
        console.error(`[live_show] テクスチャ[${storage}]が見つかりません。`);
        return Promise.resolve();
    }
    const { width, height } = texture.getSourceImage();

    // 2. this.add.mesh() を使ってMeshオブジェクトを生成
    //    Meshは頂点(vertices)とUV座標、面(faces)を指定する必要がある
    //    最もシンプルな四角形メッシュを作成する
    const vertices = [
        // x, y
        -width / 2, -height / 2, // 左上 (頂点0)
         width / 2, -height / 2, // 右上 (頂点1)
        -width / 2,  height / 2, // 左下 (頂点2)
         width / 2,  height / 2  // 右下 (頂点3)
    ];
    const uvs = [
        // u, v
        0, 0, // 左上
        1, 0, // 右上
        0, 1, // 左下
        1, 1  // 右下
    ];
    const faces = [
        0, 2, 3, // 1つ目の三角形 (左上 -> 左下 -> 右下)
        0, 3, 1  // 2つ目の三角形 (左上 -> 右下 -> 右上)
    ];

    const chara = manager.scene.add.mesh(x, y, storage, null, vertices, uvs, null, false, faces);
    
    // --- Meshオブジェクトの生成ここまで ---

    // ★ 頂点を動かせるように、より細かいグリッドに分割する
    chara.setGrid(2, 2); 
    
    // レイヤーに追加
    manager.layers.character.add(chara);
    chara.setAlpha(0);

    // 管理リストに登録
    manager.scene.characters[name] = chara;

    // フェードインアニメーション
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