/**
 * [live_show] タグ
 * キャラクターをLive2D風モーション用のRopeオブジェクトとして表示する
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

    // 既存のキャラクターがいれば破棄
    if (manager.scene.characters[name]) {
        manager.scene.characters[name].destroy();
    }

    // --- Ropeオブジェクトの生成 ---

    // 1. 画像のテクスチャを取得
    const texture = manager.scene.textures.get(storage);
    if (!texture || texture.key === '__MISSING') {
        console.error(`[live_show] テクスチャ[${storage}]が見つかりません。`);
        return Promise.resolve();
    }
    const { width, height } = texture.getSourceImage();

    // 2. Ropeの原点が左上(0, 0)固定なので、画像の中心が指定の(x, y)に来るように、
    //    オブジェクト自体の表示座標を補正する
    x = x - width / 2;
    y = y - height / 2;

    // 3. Ropeをグリッド状に変形させるためのpoints配列を作成
    //    座標は、Ropeオブジェクトの左上からの相対位置で指定する
    const points = [];
    const horizontalSegments = 2; // 水平分割数
    const verticalSegments = 2;   // 垂直分割数
    for (let i = 0; i <= verticalSegments; i++) {
        for (let j = 0; j <= horizontalSegments; j++) {
            points.push(new Phaser.Math.Vector2(j * (width / horizontalSegments), i * (height / verticalSegments)));
        }
    }
    
    // 4. this.add.rope() でRopeオブジェクトを生成
    const chara = manager.scene.add.rope(x, y, storage, null, points);
    
    // --- 生成ここまで ---

    // レイヤーに追加
    manager.layers.character.add(chara);
    // フェードインに備えて最初は透明にする
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