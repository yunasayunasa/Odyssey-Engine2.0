// src/core/ConfigManager.js (改訂版)

const STORAGE_KEY = 'my_novel_engine_config';

export default class ConfigManager extends Phaser.Events.EventEmitter {
    
    // ★★★ クラス自身が設定定義を持つように変更 ★★★
    static get DEFS() {
        return {
            bgmVolume: { type: 'slider', label: 'BGM 音量', min: 0, max: 100, step: 10, defaultValue: 80 },
            seVolume: { type: 'slider', label: 'SE 音量', min: 0, max: 100, step: 10, defaultValue: 90 },
            textSpeed: { type: 'slider', label: 'テキスト速度', min: 0, max: 100, step: 10, defaultValue: 50 },
            typeSound: {
                type: 'option',
                label: 'タイプ音',
                options: { 'se': '効果音', 'none': '無し' },
                defaultValue: 'se'
            }
        };
    }

    constructor() {
        super();
        this.values = {};
        const savedValues = this.load();
        const defs = ConfigManager.DEFS;

        for (const key in defs) {
            this.values[key] = savedValues[key] !== undefined ? savedValues[key] : defs[key].defaultValue;
        }
        console.log("ConfigManager 初期化完了:", this.values);
    }

    getValue(key) {
        return this.values[key];
    }

    setValue(key, value) {
        const oldValue = this.values[key];
        if (oldValue === value) return;

        this.values[key] = value;
        this.save();
        this.emit(`change:${key}`, value, oldValue);
    }
    
    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.values));
    }

    load() {
        try {
            const jsonString = localStorage.getItem(STORAGE_KEY);
            return jsonString ? JSON.parse(jsonString) : {};
        } catch (e) {
            console.error("設定の読み込みに失敗しました。", e);
            return {};
        }
    }

    getDefs() {
        return ConfigManager.DEFS;
    }
}