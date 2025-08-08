/**
 * [live_breath_start] タグ
 * キャラクターの呼吸モーションを開始する
 */
export function handleLiveBreathStart(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[live_breath_start] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];
    if (!chara) { console.warn(`[live_breath_start] キャラクター[${name}]が見つかりません。`); return Promise.resolve(); }

    if (!chara.isMesh) {
        console.warn(`[live_breath_start] キャラクター[${name}]はメッシュではありません。[live_show]で表示してください。`);
        return Promise.resolve();
    }

    // 既存の呼吸Tweenがあれば停止
    if (chara.getData('liveBreathTween')) {
        chara.getData('liveBreathTween').stop();
    }

    // パラメータ
    const speed = Number(params.speed) || 3500; // 呼吸の速さ
    const amount = Number(params.amount) || 1.5; // 呼吸の深さ

    // メッシュの頂点を取得 (2x2グリッドを想定)
    // 0--1--2
    // |  |  |
    // 3--4--5
    // |  |  |
    // 6--7--8
    const topCenterVertex = chara.vertices[1];
    const centerVertex = chara.vertices[4];
    
    // 肩と胸の頂点を上下させるTween
    const breathTween = manager.scene.tweens.add({
        targets: [topCenterVertex, centerVertex],
        y: `-=${amount}`, // 現在位置から指定量だけ上に移動
        duration: speed / 2,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
    });

    chara.setData('liveBreathTween', breathTween);
    return Promise.resolve();
}