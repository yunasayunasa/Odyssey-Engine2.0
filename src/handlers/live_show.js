/**
 * [live_show] タグ
 * Live2D風モーション用のキャラクターをMeshオブジェクトとして表示する
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

    // 既存のキャラクターがいれば破棄 (chara_showと管理リストを共有)
    if (manager.scene.characters[name]) {
        manager.scene.characters[name].destroy();
    }

    // ★ Imageの代わりにQuadを使う
    const chara = manager.scene.add.quad(x, y, storage);
    manager.layers.character.add(chara);

    // ★ 頂点を動かせるようにメッシュを有効化 (2x2グリッド = 9頂点)
    chara.setMesh(2, 2); 
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