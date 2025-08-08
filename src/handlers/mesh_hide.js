/**
 * [mesh_hide] タグ
 * Meshキャラクターを消去する
 */
export function handleMeshHide(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[mesh_hide] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];
    if (!chara) { return Promise.resolve(); }

    const time = Number(params.time) || 0;

    return new Promise(resolve => {
        manager.scene.tweens.killTweensOf(chara);

        if (time > 0) {
            manager.scene.tweens.add({
                targets: chara,
                alpha: 0,
                duration: time,
                ease: 'Linear',
                onComplete: () => {
                    chara.destroy();
                    delete manager.scene.characters[name];
                    resolve();
                }
            });
        } else {
            chara.destroy();
            delete manager.scene.characters[name];
            resolve();
        }
    });
}
