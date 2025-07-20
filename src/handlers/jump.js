// src/handlers/jump.js

/**
 * [jump] タグの処理
 * シナリオ内の別ラベル、または別のPhaserシーンへジャンプする。
 * params属性で変数を渡すことができる。
 * @param {ScenarioManager} manager
 * @param {Object} params - { storage, target, params } // ★ params属性をJSDocに追加
 * @returns {Promise<void>}
 */
export function handleJump(manager, params) {
    const { storage, target } = params;
    
    // ★★★ 渡すパラメータを準備 ★★★
    let transitionParams = {};
    if (params.params) {
        try {
           const evaluatedParamsString = manager.embedVariables(params.params.replace(/'/g, '"'));
            transitionParams = JSON.parse(evaluatedParamsString);
        } catch (e) {
            console.error(`[jump] params属性の評価に失敗しました: "${params.params}"`, e);
        }
    }

    if (storage) {
        // --- 別シーンへのジャンプ (例: ActionScene) ---
        console.log(`[jump] 別シーン[${storage}]へジャンプします。`);
        
        // シーン遷移前にオートセーブを実行 (復帰時に前の状態に戻るため)
        manager.scene.performSave(0); 

        // SystemSceneにシーン遷移をリクエスト
        manager.scene.scene.get('SystemScene').events.emit('request-scene-transition', {
            to: storage,
            from: manager.scene.key, // どのシーンからのリクエストか伝える (例: 'GameScene')
            params: transitionParams // ★★★ 評価したパラメータを渡す ★★★
        });

    } else if (target && target.startsWith('*')) {
        // --- シナリオ内の別ラベルへのジャンプ ---
        console.log(`[jump] ラベル[${target}]へジャンプします。`);
        manager.jumpTo(target);
        
    } else {
        console.warn('[jump] 有効なstorage属性またはtarget属性が指定されていません。');
    }
    
    // 同期ハンドラなので、必ずPromiseを返す
    return Promise.resolve();
}