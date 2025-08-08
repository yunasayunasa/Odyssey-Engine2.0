/**
 * [live_breath_stop] タグ
 * キャラクターの呼吸モーションを停止する
 */
export function handleLiveBreathStop(manager, params) {
    const name = params.name;
    if (!name) { console.warn('[live_breath_stop] nameは必須です。'); return Promise.resolve(); }
    const chara = manager.scene.characters[name];

    // キャラクターが存在し、かつ .vertices プロパティを持つか確認
    if (!chara || !chara.vertices) {
        return Promise.resolve(); // 対象がいなければ何もしない
    }

    // キャラクターに保存しておいた呼吸Tweenを取得
    const breathTween = chara.getData('liveBreathTween');

    if (breathTween) {
        // Tweenを停止
        breathTween.stop();
        // データをクリア
        chara.setData('liveBreathTween', null);
        
        // ★★★ メッシュの頂点をすべて初期位置に戻す ★★★
        chara.resetVertices();
    }

    // このタグも即座に完了する
    return Promise.resolve();
}