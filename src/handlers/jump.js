// src/handlers/jump.js (evalを使う形に戻す)

export function handleJump(manager, params) {
    const { storage, target } = params;
    
    let transitionParams = {};
    if (params.params) {
        try {
            // ★★★ 修正箇所: embedVariablesやJSON.parseを使わず、文字列全体をStateManager.eval()に渡す ★★★
            // StateManager.eval() が f.love_meter などを解決してくれる
            transitionParams = manager.stateManager.eval(params.params);
            
            // evalが失敗した場合(undefined)に備え、空のオブジェクトをデフォルト値とする
            if (transitionParams === undefined) {
                transitionParams = {};
            }
        } catch (e) {
            // StateManager.eval()内でエラーが捕捉されるはずだが、念のため
            console.error(`[jump] params属性の評価に失敗しました: "${params.params}"`, e);
            transitionParams = {}; // エラー時は空のオブジェクト
        }
    }

    if (storage) {
        console.log(`[jump] 別シーン[${storage}]へジャンプします。`, transitionParams);
        
        manager.scene.performSave(0); 
// ★★★ 修正箇所: SystemSceneにリクエストを送る前に、GameScene自身をpauseする ★★★
        console.log("[jump] GameSceneをpauseします。");
        manager.scene.scene.pause(); // これでGameSceneが一時停止する

        manager.scene.scene.get('SystemScene').events.emit('request-scene-transition', {
            to: storage,
            from: manager.scene.key,
            params: transitionParams
        });

    } else if (target && target.startsWith('*')) {
        console.log(`[jump] ラベル[${target}]へジャンプします。`);
        manager.jumpTo(target);
        
    } else {
        console.warn('[jump] 有効なstorage属性またはtarget属性が指定されていません。');
    }
    
    return Promise.resolve();
}