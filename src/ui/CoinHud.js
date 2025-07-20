// src/ui/CoinHud.js

/**
 * コイン数を表示するHUDコンポーネント
 * Phaser.GameObjects.Containerを継承し、画像とテキストで構成される。
 */
export default class CoinHud extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene - このHUDが追加されるPhaserシーン
     * @param {number} x - HUDのX座標
     * @param {number} y - HUDのY座標
     */
     // ★★★ 修正箇所: constructorの引数にstateManagerを追加 ★★★
    constructor(scene, x, y, stateManager) {
        super(scene, x, y);

        this.stateManager = stateManager; // StateManagerへの参照を保持
        // ★★★ HUDの背景画像 (例: 'coin_panel'のような画像を別途用意) ★★★
        // 一旦シンプルな四角形にするか、既存のアセットを使う
        // 例として、シンプルな四角形を使用
        const panelBackground = scene.add.rectangle(0, 0, 150, 60, 0x000000, 0.7) // 幅150px, 高さ60pxの黒い半透明の四角
            .setOrigin(0.5); // 中央基準
        this.add(panelBackground);

        // ★★★ コインアイコン (例: 'coin_icon'のような画像を別途用意) ★★★
        // 一旦シンプルなテキストにするか、既存のアセットを使う
        // 例として、シンプルなテキストアイコンを使用
        const coinIcon = scene.add.text(-50, 0, '💰', { // -50pxはパネルの中央から左にずらす
            fontSize: '32px',
            fill: '#ffd700' // ゴールドカラー
        }).setOrigin(0.5);
        this.add(coinIcon);

        // ★★★ コイン数テキスト ★★★
        this.coinText = scene.add.text(30, 0, '0', { // 30pxはパネルの中央から右にずらす
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);
        this.add(this.coinText);

          // ... (省略: アイコンやテキストの作成) ...

        this.setCoin(this.stateManager.f.coin || 0); // 初期値を設定

        // ★★★ ここが重要: StateManagerの変更イベントを直接購読 ★★★
          this.stateManager.on('f-variable-changed', this.onFVariableChanged, this);

        scene.add.existing(this);

        // ★★★ UIなので、メッセージウィンドウより手前に表示 ★★★
        this.setDepth(100); // メッセージウィンドウのdepthが20なので、100は十分手前
    }

    /**
     * 表示するコイン数を更新する
     * @param {number} amount - 新しいコイン数
     */
    setCoin(amount) {
        this.coinText.setText(amount.toString());
    }
     // ★★★ 追加: f変数が変更されたときに呼ばれるコールバック ★★★
    onFVariableChanged(key, value) {
        if (key === 'coin' && this.coinText.text !== value.toString()) {
            this.setCoin(value);
        }
    }
// ★★★ 追加: 破棄される際にイベントリスナーを解除する ★★★
    destroy(fromScene) {
        console.log("CoinHud: destroyされました。イベントリスナーを解除します。");
        // StateManagerのイベントリスナーを解除
        if (this.stateManager) {
            this.stateManager.events.off('f-variable-changed', this.onFVariableChanged, this);
        }
        // 親のdestroyを呼び出す
        super.destroy(fromScene);
    }
}