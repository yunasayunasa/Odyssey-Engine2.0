// src/ui/HpBar.js

/**
 * HPバーを表示するHUDコンポーネント
 * Phaser.GameObjects.Containerを継承し、背景、バー本体、テキストで構成される。
 */
export default class HpBar extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene - このHUDが追加されるPhaserシーン
     * @param {number} x - HUDのX座標
     * @param {number} y - HUDのY座標
     * @param {number} width - バーの幅
     * @param {number} height - バーの高さ
     * @param {string} type - 'player' or 'enemy' (表示色や位置調整用)
     */
    constructor(scene, x, y, width = 200, height = 20, type = 'player') {
        super(scene, x, y);

        this.barWidth = width;
        this.barHeight = height;
        this.type = type;
        this.maxHp = 100; // 初期最大HP (後でsetMaxHpで設定可能にする)
        this.currentHp = 100; // 初期現在HP

        // ★★★ HPバーの背景 (黒) ★★★
        this.background = scene.add.rectangle(0, 0, width, height, 0x000000, 0.8)
            .setOrigin(0, 0.5); // 左端基準 (HPバーは左から右へ伸びるため)
        this.add(this.background);

        // ★★★ HPバー本体 (色) ★★★
        const barColor = (type === 'player') ? 0x00ff00 : 0xff0000; // プレイヤーは緑、敵は赤
        this.bar = scene.add.rectangle(0, 0, width, height, barColor)
            .setOrigin(0, 0.5); // 左端基準
        this.add(this.bar);

        // ★★★ HP数値テキスト ★★★
        this.hpText = scene.add.text(width / 2, 0, '100/100', {
            fontSize: (height * 0.8) + 'px', // バーの高さに合わせて調整
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5); // 中央基準
        this.add(this.hpText);

        // コンテナ全体をシーンに追加
        scene.add.existing(this);

        // UIなので、メッセージウィンドウより手前に表示
        this.setDepth(100);

        // 初期HPを設定
        this.setHp(this.maxHp, this.maxHp);
    }

    /**
     * HPバーの最大HPを設定する
     * @param {number} maxHp - 新しい最大HP
     */
    setMaxHp(maxHp) {
        this.maxHp = maxHp;
        this.setHp(this.currentHp, maxHp); // 表示も更新
    }

    /**
     * HPバーの現在HPと最大HPを更新する
     * @param {number} currentHp - 新しい現在HP
     * @param {number} [maxHp] - 新しい最大HP (省略可能、省略時は既存のmaxHpを使用)
     */
    setHp(currentHp, maxHp = this.maxHp) {
        this.currentHp = Phaser.Math.Clamp(currentHp, 0, maxHp); // 0-maxHpの範囲にクランプ
        this.maxHp = maxHp;

        // バーの幅を計算 (現在HP / 最大HP)
        const barScale = this.currentHp / this.maxHp;
        this.bar.width = this.barWidth * barScale;

        // HPテキストを更新
        this.hpText.setText(`${this.currentHp}/${this.maxHp}`);

        // HPが減少するアニメーション (オプション)
        if (this.scene.tweens && this.scene.tweens.isTweening(this.bar)) {
            // 既にアニメーション中なら中断
            this.scene.tweens.killTweensOf(this.bar);
        }
        // なめらかにHPが減るアニメーション
        this.scene.tweens.add({
            targets: this.bar,
            width: this.barWidth * barScale, // 目標の幅
            duration: 200, // アニメーション時間
            ease: 'Linear'
        });
    }
}