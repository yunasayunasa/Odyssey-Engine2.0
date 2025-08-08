// ★★★ src/handlers/live_show.js をこのコードで置き換えてください ★★★

/**
 * [live_show] タグ
 * キャラクターをMesh-Compatible Imageとして表示する (最終・安定化版)
 */
export function handleLiveShow(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[live_show] nameは必須です。'); return Promise.resolve(); }
    
    const storage = params.storage;
    if (!storage) { console.warn('[live_show] storageは必須です。'); return Promise.resolve(); }
    const x = params.x !== undefined ? Number(params.x) : manager.scene.scale.width / 2;
    const y = params.y !== undefined ? Number(params.y) : manager.scene.scale.height / 2;
    const time = Number(params.time) || 0;

    if (manager.scene.characters[name]) {
        manager.scene.characters[name].destroy();
    }

    // --- Imageオブジェクトとして生成 ---
    const chara = manager.scene.add.image(x, y, storage);
    
    // --- Meshとしての機能を追加 ---
    // Imageを強制的にMeshに変換する (内部的なハック)
    // これにより、.verticesプロパティなどが使えるようになる
    Phaser.GameObjects.Image.prototype.setMesh.call(chara, 2, 2);

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