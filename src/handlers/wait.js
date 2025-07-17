/**
 * [wait] タグの処理
 * 指定された時間、シナリオの進行を停止させる
 * @param {ScenarioManager} manager
 * @param {Object} params - { time }
 * @returns {Promise<void>}
 */
export function handleWait(manager, params) {
    // ★★★ 戻り値をPromiseにすることで、ScenarioManagerが待ってくれるようになる ★★★
    return new Promise(resolve => {
        const time = Number(params.time);

        // timeが数値でない、または0以下の場合は、待たずに即座に完了
        if (isNaN(time) || time <= 0) {
            console.warn(`[wait] time属性には0より大きい数値を指定してください: ${params.time}`);
            resolve();
            return;
        }

        // Phaserのタイマー機能を使って、指定時間後にPromiseを解決する
        manager.scene.time.delayedCall(time, () => {
            // ★★★ 指定時間後に resolve() を呼ぶことで、待機が完了したことを通知 ★★★
            resolve();
        });

        // ★★★ finishTagExecution や next() は一切不要 ★★★
    });
}