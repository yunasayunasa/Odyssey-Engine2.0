// src/core/StateManager.js (最終版)

export default class StateManager extends Phaser.Events.EventEmitter { // ★★★ EventEmitterを継承 ★★
    constructor() {
        super(); // 親クラスのコンストラクタを呼び出す
        this.f = {};
        this.sf = this.loadSystemVariables(); 
        if (!this.sf.history) this.sf.history = [];
    }
     // ★★★ 追加: f変数を設定し、イベントを発行するメソッド ★★★
    setF(key, value) {
        if (this.f[key] !== value) {
            this.f[key] = value;
            this.emit('f-variable-changed', key, value);
        }
    }

    /**
     * ゲームの現在の状態をすべて収集して返す
     * @param {ScenarioManager} scenarioManager - 現在のシナリオの状態を取得するための参照
     * @returns {Object} 現在のゲーム状態のスナップショット
     */
    getState(scenarioManager) {
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
            currentText: scenarioManager.messageWindow.currentText,
            speakerName: scenarioManager.messageWindow.currentSpeaker,
        };
        
        return {
            saveDate: new Date().toLocaleString('ja-JP'),
            variables: { f: this.f }, 
            scenario: scenarioState,
            layers: {
                background: backgroundState,
                characters: characterStates,
            },
            sound: {
                bgm: scenarioManager.soundManager.getCurrentBgmKey(),
            }
        };
    }

    /**
     * ロードした状態から変数を復元する
     * @param {Object} loadedState - localStorageから読み込んだ状態オブジェクト
     */
    setState(loadedState) {
        this.f = loadedState.variables.f || {};
    }

     /**
     * 文字列のJavaScript式を安全に評価・実行する。
     * @param {string} exp - 実行する式 (例: "f.hoge = 10")
     * @returns {*} 評価結果
     */
    eval(exp) {
        try {
            // ★★★ 修正箇所: this.f が存在しない場合に備え、空のオブジェクトをデフォルト値とする ★★★
            const f = this.f || {};
            const sf = this.sf || {};

            const result = (function(f, sf) {
                'use strict';
                return eval(exp); 
            })(f, sf);

            // ★★★ 修正箇所: eval実行後に、ローカルのfをthis.fに再代入する ★★★
            this.f = f;

            // ★★★ 修正箇所: f変数が変更されたことを通知するイベントを発行 ★★★
            // 式から変更された変数名を特定するのは難しいため、
            // 'f.player_hp' のようなキーと、その新しい値をイベントで渡すのが理想的。
            // ここでは、単純化のため、evalが呼ばれたことを通知する。
            // より高度な実装として、式を解析して変更されたキーを特定することも可能。
            // 例: const changedKey = exp.split('=')[0].trim();
            // this.events.emit('f-variable-changed', changedKey, result);
            // 今回は、evalが呼ばれた事実のみを通知する。
            this.events.emit('eval-executed');


            this.saveSystemVariables(); 
            return result;

        } catch (e) {
            console.error(`[eval] 式の評価中にエラーが発生しました: "${exp}"`, e);
            return undefined; 
        }
    }

    // システム変数のセーブ/ロード、履歴の追加 (変更なし)
    saveSystemVariables() {
        try {
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
        this.saveSystemVariables();
    }
}
