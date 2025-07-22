export default class StateManager extends Phaser.Events.EventEmitter {
    constructor() {
        super();
        this.f = {};  // ゲーム変数 (f.hoge)
        this.sf = {}; // システム変数 (sf.hoge)
    }

    /**
     * f変数を設定し、変更があった場合にイベントを発行する
     * @param {string} key - 'f.'を含まない変数名 (例: 'player_hp')
     * @param {*} value - 設定する値
     */
    setF(key, value) {
        if (this.f[key] !== value) {
            this.f[key] = value;
            this.emit('f-variable-changed', key, value, this.f); // 第3引数として更新後のfオブジェクト全体を渡す
        }
    }

    /**
     * 文字列のJavaScript式を安全に評価・実行し、変更を通知する
     * @param {string} exp - 実行する式 (例: "f.player_hp = 100")
     */
    eval(exp) {
        try {
            const f_before = { ...this.f };
            const sf_before = { ...this.sf };

            // new Functionを使って安全に実行
            new Function('f', 'sf', `'use strict'; ${exp}`)(this.f, this.sf);

            // 変更があったf変数をチェックしてイベントを発行
            const allFKeys = new Set([...Object.keys(f_before), ...Object.keys(this.f)]);
            allFKeys.forEach(key => {
                if (f_before[key] !== this.f[key]) {
                    console.log(`[StateManager.eval] f.${key} が変更: ${f_before[key]} -> ${this.f[key]}`);
                    this.emit('f-variable-changed', key, this.f[key], this.f);
                }
            });

            // sf変数の変更も同様にチェック可能 (必要であれば)

        } catch (e) {
            console.warn(`[StateManager.eval] 式の評価エラー: "${exp}"`, e);
        }
    }

    /**
     * ゲーム状態のスナップショットを生成する
     * @param {ScenarioManager} scenarioManager
     * @returns {object} セーブ用データ
     */
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

    /**
     * ロードした状態を復元する
     * @param {object} loadedState
     */
    setState(loadedState) {
        this.f = {}; // 一旦リセット
        if (loadedState.f) {
            for (const key in loadedState.f) {
                // setF経由で値をセットし、イベントを強制発行する
                this.setF(key, loadedState.f[key]);
            }
        }
        this.sf = loadedState.sf || {};
    }
}