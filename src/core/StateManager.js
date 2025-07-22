export default class StateManager extends Phaser.Events.EventEmitter {
    constructor() {
        super();
        this.f = {};
        this.sf = {};
    }

    setF(key, value) {
        if (this.f[key] !== value) {
            this.f[key] = value;
            this.emit('f-variable-changed', key, value, this.f);
        }
    }

    eval(exp) {
        try {
            const f_before = { ...this.f };
            new Function('f', 'sf', `'use strict'; ${exp}`)(this.f, this.sf);
            const allFKeys = new Set([...Object.keys(f_before), ...Object.keys(this.f)]);
            allFKeys.forEach(key => {
                if (f_before[key] !== this.f[key]) {
                    this.emit('f-variable-changed', key, this.f[key], this.f);
                }
            });
        } catch (e) {
            console.warn(`[StateManager.eval] 式の評価エラー: "${exp}"`, e);
        }
    }

    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★
    // ★★★ このgetValueメソッドを復活させます ★★★
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★
    /**
     * 式を評価し、値を "読み取る" だけの安全なメソッド
     * @param {string} exp - 評価する式 (例: 'f.player_name')
     * @returns {*} 評価結果
     */
    getValue(exp) {
        try {
            // new Functionを使って、現在のfとsfのスコープで式を安全に評価する
            return new Function('f', 'sf', `'use strict'; return (${exp});`)(this.f, this.sf);
        } catch (e) {
            console.warn(`[StateManager.getValue] 式の評価エラー: "${exp}"`, e);
            // エラーの場合は、未定義を示すか、あるいは元の文字列をそのまま返す方が親切かもしれない
            return undefined; 
        }
    }

    getState(scenarioManager) {
        const state = {
            f: { ...this.f },
            sf: { ...this.sf },
            scenario: scenarioManager.getScenarioState(),
            sound: {
                bgmKey: scenarioManager.soundManager.getCurrentBgmKey()
            },
            layers: scenarioManager.getLayerState()
        };
        return state;
    }

    setState(loadedState) {
        this.f = {};
        if (loadedState.f) {
            for (const key in loadedState.f) {
                this.setF(key, loadedState.f[key]);
            }
        }
        this.sf = loadedState.sf || {};
    }
}