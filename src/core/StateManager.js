// src/core/StateManager.js (最終版)

export default class StateManager {
    constructor() {
        // ゲーム内変数 (f) とシステム変数 (sf) を分離
        this.f = {};
        this.sf = this.loadSystemVariables(); 
        
        // ★★★ 変更点: イベントエミッターを追加 ★★★
        this.events = new Phaser.Events.EventEmitter();

        if (!this.sf.history) {
            this.sf.history = [];
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
     * 文字列のJavaScript式を評価・実行する
     * @param {string} exp - 実行する式 (例: "f.hoge = 10")
     */
    eval(exp) {
        try {
            const f = this.f;
            const sf = this.sf;

            // ★★★ 変更点: f変数の変更を検知するために、実行前の状態をコピー ★★★
            const oldF = { ...f };

            const result = (function(f, sf) {
                'use strict';
                return eval(exp); 
            })(f, sf);

            this.saveSystemVariables(); 

            // ★★★ 変更点: f変数が変更されたらイベントを発行 ★★★
            for (const key in f) {
                if (f[key] !== oldF[key]) {
                    this.events.emit('f-variable-changed', key, f[key], oldF[key]); // key, newValue, oldValue
                }
            }
            // ★★★ sf変数が変更された場合もイベントを発行 ★★★
            for (const key in sf) {
                // sfの変更検知はここでは行わない（saveSystemVariablesで永続化されるため）
                // 必要であれば、sfも同様に検知ロジックを追加可能
            }

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
