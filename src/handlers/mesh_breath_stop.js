export function handleMeshBreathStop(manager, params) {
    const name = params.name;
    if (!name) { return Promise.resolve(); }
    const chara = manager.scene.characters[name];
    if (!chara || !chara.vertices) return Promise.resolve();

    const breathTween = chara.getData('meshBreathTween');
    if (breathTween) {
        breathTween.stop();
        chara.setData('meshBreathTween', null);
        
        // ★ 手動で頂点をリセットする
        const { width, height } = chara.texture.getSourceImage();
        const h_segments = 2;
        const v_segments = 2;
        let idx = 0;
        for (let i = 0; i <= v_segments; i++) {
            const v = i / v_segments;
            for (let j = 0; j <= h_segments; j++) {
                const u = j / h_segments;
                chara.vertices[idx] = (u * width) - (width / 2);
                chara.vertices[idx + 1] = (v * height) - (height / 2);
                idx += 2;
            }
        }

        // ★ 頂点データが変更されたことをPhaserに伝える
        chara.dirty = true;
    }
    return Promise.resolve();
}