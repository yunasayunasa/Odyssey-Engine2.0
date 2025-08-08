/**
 * [live_breath_start] タグ
 * キャラクターの呼吸モーションを開始する
 * 対象は[live_show]で生成されたMesh機能付きImageオブジェクト
 */
export function handleLiveBreathStart(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[live_breath_start] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];

    // キャラクターが存在し、かつ .vertices プロパティを持つ（メッシュ化されている）か確認
    if (!chara || !chara.vertices) {
        console.warn(`[live_breath_start] 対象キャラクター[${name}]が見つからないか、メッシュではありません。[live_show]で表示してください。`);
        return Promise.resolve();
    }

    // 既存の呼吸Tweenがあれば停止してから新しいのを開始
    if (chara.getData('liveBreathTween')) {
        chara.getData('liveBreathTween').stop();
    }

    // パラメータの取得とデフォルト値
    const speed = Number(params.speed) || 3500; // 呼吸1サイクルの時間(ミリ秒)
    const amount = Number(params.amount) || 1.5; // 呼吸の深さ(ピクセル)

    // メッシュの頂点を取得 (2x2グリッドを想定)
    // 0--1--2 (上辺: 左、中央、右)
    // |  |  |
    // 3--4--5 (中辺: 左、中央、右)
    // |  |  |
    // 6--7--8 (下辺: 左、中央、右)
    const vertices = chara.vertices;

    // 動かす頂点を選択 (肩と胸の中心)
    const topCenterVertex = vertices[1];
    const centerVertex = vertices[4];
    
    // 頂点のY座標をアニメーションさせるTween
    const breathTween = manager.scene.tweens.add({
        targets: [topCenterVertex, centerVertex],
        y: `-=${amount}`, // 現在のY座標から `amount` ピクセルだけ上に移動
        duration: speed / 2, // 行って戻ってくるので、半分の時間で片道
        ease: 'Sine.easeInOut', // 滑らかな動き
        yoyo: true, // trueにすると、アニメーション終了後に元の状態に戻る
        repeat: -1, // -1で無限に繰り返す
    });

    // 作成したTweenをキャラクターオブジェクトに保存しておく
    chara.setData('liveBreathTween', breathTween);

    // このタグは即座に完了する
    return Promise.resolve();
}