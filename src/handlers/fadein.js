/**
 * [fadein] タグの処理
 * 指定された色から画面をフェードインさせる
 * @param {ScenarioManager} manager
 * @param {Object} params - { time, color }
 * @returns {Promise<void>}
 */
export function handleFadein(manager, params) {
    return new Promise(resolve => {
        const time = Number(params.time) || 1000;
        
        // カラーコードのパース
        const colorStr = params.color || '000000'; // '0x'プレフィックスは不要
        const colorInt = parseInt(colorStr.replace(/^0x/, ''), 16);
        
        // PhaserのカメラはRGBの数値で色を受け取る
        const r = (colorInt >> 16) & 0xFF;
        const g = (colorInt >> 8) & 0xFF;
        const b = colorInt & 0xFF;
        
        // ★★★ カメラのフェード完了イベントを一度だけリッスンする ★★★
        manager.scene.cameras.main.once('camerafadeincomplete', () => {
            resolve(); // イベントが発火したらPromiseを解決
        });

        // カメラのフェードインエフェクトを開始
        manager.scene.cameras.main.fadeIn(time, r, g, b);
        
        // ★★★ delayedCall や finishTagExecution は不要 ★★★
    });
}