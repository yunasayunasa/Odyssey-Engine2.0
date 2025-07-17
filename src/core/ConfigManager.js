// --- 設定項目の定義データ ---
// ここに項目を追加すれば、自動でUIやセーブ機能が対応する
const EventEmitter = Phaser.Events.EventEmitter;
const configDefs = {
    bgmVolume: { type: 'slider', label: 'BGM 音量', min: 0, max: 1, step: 0.1, defaultValue: 0.5 },
    seVolume: { type: 'slider', label: 'SE 音量', min: 0, max: 1, step: 0.1, defaultValue: 0.8 },
    textSpeed: { type: 'slider', label: 'テキスト速度', min: 0, max: 100, step: 10, defaultValue: 50 },
    typeSound: {
        type: 'option', // UIの種類 (スライダーではない)
        label: 'タイプ音',
        options: {
            'se': '効果音',      // 'se'という内部値に対して、UIでは'効果音'と表示
           // 'voice': '読み上げ',  // 'voice' -> '読み上げ'
            'none': '無し'        // 'none' -> '無し'
        },
        defaultValue: 'se' // デフォルトは効果音
    }
};

// ローカルストレージに保存する時のキー
const STORAGE_KEY = 'my_novel_engine_config';


export default class ConfigManager extends EventEmitter {
    constructor() {
        super(); 
        // 現在の設定値を保持するオブジェクト
        this.values = {};
        
        // 保存された設定値をロードする
        const savedValues = this.load();

        // --- 設定値の初期化 ---
        // 定義されているすべての項目についてループ
        for (const key in configDefs) {
            // 保存された値があればそれを使う。なければ定義のデフォルト値を使う。
            this.values[key] = savedValues[key] !== undefined ? savedValues[key] : configDefs[key].defaultValue;
        }
        console.log("ConfigManager 初期化完了:", this.values);
    }

    /**
     * 指定されたキーの設定値を取得する
     * @param {string} key - 取得したい設定のキー
     * @returns {*} 設定値
     */
    getValue(key) {
        return this.values[key];
    }

    /**
     * 指定されたキーの設定値を変更し、自動で保存する
     * @param {string} key - 変更したい設定のキー
     * @param {*} value - 新しい値
     */
    setValue(key, value) {
        // 値が実際に変更されたかチェック
        const oldValue = this.values[key];
        if (oldValue === value) return; // 変更がなければ何もしない

        this.values[key] = value;
        console.log(`設定変更: ${key} = ${value}`);
        this.save();
        
        // ★★★ 変更があったことをイベントで通知 ★★★
        // イベント名は 'change:[キー名]' とする (例: 'change:bgmVolume')
        this.emit(`change:${key}`, value, oldValue);
    }
    
    /**
     * 現在の設定値をローカルストレージに保存する
     */
    save() {
        try {
            const jsonString = JSON.stringify(this.values);
            localStorage.setItem(STORAGE_KEY, jsonString);
        } catch (e) {
            console.error("設定の保存に失敗しました。", e);
        }
    }

    /**
     * ローカルストレージから設定値を読み込む
     * @returns {Object} 読み込んだ設定値オブジェクト
     */
    load() {
        try {
            const jsonString = localStorage.getItem(STORAGE_KEY);
            return jsonString ? JSON.parse(jsonString) : {};
        } catch (e) {
            console.error("設定の読み込みに失敗しました。", e);
            return {}; // 失敗した場合は空のオブジェクトを返す
        }
    }

    /**
     * 設定項目の定義データを外部から参照できるようにする
     * @returns {Object}
     */
    getDefs() {
        return configDefs;
    }
}