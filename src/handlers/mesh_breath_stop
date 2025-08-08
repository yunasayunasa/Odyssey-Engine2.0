/**
 * [mesh_breath_stop] タグ
 * キャラクターの呼吸モーションを停止する (頂点操作)
 */
export function handleMeshBreathStop(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[mesh_breath_stop] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];

    if (!chara || !chara.vertices) return Promise.resolve();

    const breathTween = chara.getData('meshBreathTween');
    if (breathTween) {
        breathTween.stop();
        chara.setData('meshBreathTween', null);
        chara.resetGrid(); // setGridの状態をリセット
    }
    return Promise.resolve();
}
