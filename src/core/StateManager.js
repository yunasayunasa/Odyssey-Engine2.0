// core/StateManager.js

export default class StateManager {
    constructor() {
        // ゲーム内変数 (f) とシステム変数 (sf) を分離
        this.f = {};
        this.sf = this.loadSystemVariables(); 
        
        // ★ 履歴は sf (システム変数) に持たせるのが一般的
        if (!this.sf.history) {
            this.sf.history = [];
        }
    }

    /**
     * ★★★ 新しいgetState: ゲームの現在の状態をすべて収集して返す ★★★
     * @param {ScenarioManager} scenarioManager - 現在のシナリオの状態を取得するための参照
     * @returns {Object} 現在のゲーム状態のスナップショット
     */
   // core/StateManager.js の getState メソッド

    getState(scenarioManager) {
        // デバッグログはもう不要なら削除してOK
        // console.log("!!!!!!!!!! StateManager.getState が呼ばれました !!!!!!!!!!");

        const scene = scenarioManager.scene;
        
        const characterStates = {};
        for (const name in scene.characters) {
            const chara = scene.characters[name];
            if (chara && chara.visible && chara.alpha > 0) {
                characterStates[name] = {
                    storage: chara.texture.key,
                    x: chara.x, y: chara.y,
                    scaleX: chara.scaleX, scaleY: chara.scaleY,
                    alpha: chara.alpha, flipX: chara.flipX,
                    tint: chara.tintTopLeft,
                };
            }
        }
        
        const backgroundState = scenarioManager.layers.background.list.length > 0
            ? scenarioManager.layers.background.list[0].texture.key
            : null;

        const scenarioState = {
            fileName: scenarioManager.currentFile,
            line: scenarioManager.currentLine,
            ifStack: scenarioManager.ifStack,
            callStack: scenarioManager.callStack,
            isWaitingClick: scenarioManager.isWaitingClick,
            isWaitingChoice: scenarioManager.isWaitingChoice,
            pendingChoices: scene.pendingChoices,
            // ★★★ MessageWindowのプロパティを参照 ★★★
            currentText: scenarioManager.messageWindow.currentText,
            speakerName: scenarioManager.messageWindow.currentSpeaker,
        };
        
        // すべての状態を一つのオブジェクトに統合して返す
        return {
            saveDate: new Date().toLocaleString('ja-JP'),
            variables: { f: this.f }, 
            scenario: scenarioState,
            layers: {
                background: backgroundState,
                characters: characterStates,
            },
            sound: {
                // ★★★ 修正箇所: getCurrentBgmKey() を呼び出す ★★★
                bgm: scenarioManager.soundManager.getCurrentBgmKey(),
            }
        };
    }

    /**
     * ★★★ 新しいsetState: ロードした状態から変数を復元する ★★★
     * @param {Object} loadedState - localStorageから読み込んだ状態オブジェクト
     */
    setState(loadedState) {
        // 変数(f)のみを復元する責務を持つ
        this.f = loadedState.variables.f || {};
    }

  
    /**
     * 文字列のJavaScript式を安全に評価・実行する。
     * このメソッドは、ゲーム内変数fとシステム変数sfのスコープで実行される。
     * @param {string} exp - 実行する式 (例: "f.hoge = 10")
     * @returns {*} 評価結果
     */
    eval(exp) {
        try {
            const f = this.f;
            const sf = this.sf;

            // new Function のスコープ内で、式を安全に評価・実行する
            // fとsfを引数として渡し、スコープ内で利用可能にする
            const result = (function(f, sf) {
                'use strict'; // より安全な実行モード
                return eval(exp); 
            })(f, sf); // fとsfを引数として渡す

            // sf変数が変更された場合は、自動で保存 (evalタグでsfを操作した場合など)
            this.saveSystemVariables(); 

            return result;

        } catch (e) {
            console.error(`[eval] 式の評価中にエラーが発生しました: "${exp}"`, e);
            return undefined; // エラー時はundefinedを返す
        }
    }

    // システム変数のセーブ/ロード、履歴の追加は変更なし。
    saveSystemVariables() {
        try {
            // sfが変更されたら自動保存
            localStorage.setItem('my_novel_engine_system', JSON.stringify(this.sf));
        } catch (e) { console.error("システム変数の保存に失敗しました。", e); }
    }
    loadSystemVariables() {
        try {
            const data = localStorage.getItem('my_novel_engine_system');
            return data ? JSON.parse(data) : {};
        } catch (e) { console.error("システム変数の読み込みに失敗しました。", e); return {}; }
    }
    addHistory(speaker, dialogue) {
        this.sf.history.push({ speaker, dialogue });
        if (this.sf.history.length > 100) this.sf.history.shift();
        this.saveSystemVariables(); // 履歴はシステム変数なので即時保存
    }
    
    // updateCharaなどの個別のupdateメソッドは不要になるため削除
}