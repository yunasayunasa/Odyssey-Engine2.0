/**
 * [mesh_breath_start] タグ
 * キャラクターの呼吸モーションを開始する (頂点操作)
 */
export function handleMeshBreathStart(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[mesh_breath_start] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];

    if (!chara || !chara.vertices) {
        console.warn(`[mesh_breath_start] 対象キャラクター[${name}]はMeshではありません。`);
        return Promise.resolve();
    }

    if (chara.getData('meshBreathTween')) chara.getData('meshBreathTween').stop();

    const speed = Number(params.speed) || 3500;
    const amount = Number(params.amount) || 1.5;

    // 2x2グリッドの頂点を取得
    // 0--1--2
    // |  |  |
    // 3--4--5
    // |  |  |
    // 6--7--8
    const topCenterVertex = chara.vertices[1];
    const centerVertex = chara.vertices[4];
    
    const breathTween = manager.scene.tweens.add({
        targets: [topCenterVertex, centerVertex],
        y: `-=${amount}`,
        duration: speed / 2,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
    });

    chara.setData('meshBreathTween', breathTween);
    return Promise.resolve();
}
