const Container = Phaser.GameObjects.Container;

export default class MessageWindow extends Container {
    constructor(scene, soundManager, configManager) {
        super(scene, 0, 0);

        this.scene = scene; // ★ シーンへの参照を保持
        this.soundManager = soundManager;
        this.configManager = configManager;
        this.charByCharTimer = null;
        this.isTyping = false;

        // ★★★ セーブ＆ロード用の状態保持プロパティ ★★★
        this.currentText = '';
        this.currentSpeaker = null;

        // --- ウィンドウとテキストのセットアップ ---
        const gameWidth = scene.scale.width;
        const gameHeight = scene.scale.height;
        const windowY = gameHeight - 180;
        this.windowImage = scene.add.image(gameWidth / 2, windowY, 'message_window');

        const padding = 35;
        const textWidth = this.windowImage.width - (padding * 2);
        const textHeight = this.windowImage.height - (padding * 2);

        this.textObject = scene.add.text(
            this.windowImage.x - (this.windowImage.width / 2) + padding,
            this.windowImage.y - (this.windowImage.height / 2) + padding,
            '',
            {
                fontFamily: '"Noto Sans JP", sans-serif',
                fontSize: '36px',
                fill: '#ffffff',
                fixedWidth: textWidth,
                fixedHeight: textHeight
            }
        );

        // --- コンフィグと連携するテキスト速度 ---
        this.textDelay = 50; // デフォルト値
        this.updateTextSpeed(); // コンフィグから初期値を取得
        this.configManager.on('change:textSpeed', this.updateTextSpeed, this);

        // --- クリック待ちアイコン ---
        const iconX = (gameWidth / 2) + (this.windowImage.width / 2) - 60;
        const iconY = windowY + (this.windowImage.height / 2) - 50;
        this.nextArrow = scene.add.image(iconX, iconY, 'next_arrow');
        this.nextArrow.setScale(0.5).setVisible(false);
        this.arrowTween = scene.tweens.add({
            targets: this.nextArrow,
            y: this.nextArrow.y - (10 * this.nextArrow.scaleY),
            duration: 400,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            paused: true
        });

        // --- コンテナに追加 & シーンに登録 ---
        this.add([this.windowImage, this.textObject, this.nextArrow]);
        scene.add.existing(this);
    }

    // ★★★ コンフィグ値から速度を更新するヘルパーメソッド ★★★
    updateTextSpeed() {
        const textSpeedValue = this.configManager.getValue('textSpeed');
        this.textDelay = 100 - textSpeedValue;
        console.log(`テキスト表示速度を ${this.textDelay}ms に更新`);
    }

    // ★★★ セッターをリネーム（より明確に） ★★★
    setTypingSpeed(newSpeed) {
        this.textDelay = newSpeed;
    }

  /**
 * スタイル付きテキストチャンク配列を表示する (新バージョン)
 * @param {Array<object>} chunks - 改行適用済みのスタイル付きチャンク配列
 * @param {boolean} useTyping - テロップ表示を使うかどうか
 * @param {string|null} speaker - 話者名
 * @returns {Promise<void>}
 */
async setRichText(chunks, useTyping = true, speaker = null) {
    // まずウィンドウをリセットする (既存のテキストやタイマーをクリア)
    this.reset(); 
    this.currentSpeaker = speaker;

    // ★ 既存のtextObjectは非表示にして、座標の基準としてのみ使う
    this.textObject.setVisible(false);

    // ★ 複数のTextオブジェクトを管理するコンテナ
    // コンテナの座標を、元のtextObjectの位置に設定する
    const textContainer = this.scene.add.container(this.textObject.x, this.textObject.y);
    
    // ★ このコンテナをMessageWindow自身に追加する
    this.add(textContainer);
    // ★ textContainerが破棄されるように、管理リストに追加する
    // あとでreset()メソッドで破棄する
    this.textContainer = textContainer;


    let currentX = 0;
    let currentY = 0;
    // デフォルトのfontSizeから行の高さを計算
    const lineHeight = parseInt(this.textObject.style.fontSize.replace('px', '')) * 1.4;

    const defaultStyle = { 
        fontFamily: this.textObject.style.fontFamily, 
        fontSize: this.textObject.style.fontSize, 
        fill: this.textObject.style.fill 
    };

    // isTypingフラグをセット
    this.isTyping = true;

    for (const chunk of chunks) {
        // [br]や\nによる改行処理
        if (chunk.text.includes('\n')) {
            const lines = chunk.text.split('\n');
            for (let i = 0; i < lines.length; i++) {
                // 各行のテキストを処理
                await typeLine(lines[i], chunk.style);
                // 最後の行以外は改行
                if (i < lines.length - 1) {
                    currentX = 0;
                    currentY += lineHeight;
                }
            }
            continue; // このチャンクの処理は終わり
        }
        
        // 通常のテキストチャンクを処理
        await typeLine(chunk.text, chunk.style);
    }
    
    // 内部関数としてタイピング処理を定義
    const typeLine = async (lineText, styleOverride) => {
        const style = { ...defaultStyle, ...styleOverride };

        for (const char of lineText) {
            const charObj = this.scene.add.text(currentX, currentY, char, style);
            textContainer.add(charObj);
            
            currentX += charObj.width;

            if (useTyping && this.textDelay > 0) {
                await new Promise(r => setTimeout(r, this.textDelay));
            }
        }
    };

    this.isTyping = false;
    return;
}

    /**
     * テキストを設定し、表示完了をPromiseで通知するメソッド (新バージョン)
     * @param {string} text - 表示する全文
     * @param {boolean} useTyping - テロップ表示を使うかどうか
     * @param {string|null} speaker - 話者名（任意）
     * @returns {Promise<void>} 表示完了時に解決されるPromise
     */
    setText(text, useTyping = true, speaker = null) {
        return new Promise(resolve => {
            // ★ 現在の状態をプロパティとして保存
            this.currentText = text;
            this.currentSpeaker = speaker;
    
            // ★ 既存のタイマーがあれば完全に停止・破棄
            if (this.charByCharTimer) {
                this.charByCharTimer.remove();
                this.charByCharTimer = null;
            }
            // ★ テキストをクリア
            this.textObject.setText('');
    
            const typeSoundMode = this.configManager.getValue('typeSound');
    
            // タイピングなし、または即時表示の場合
            if (!useTyping || text.length === 0 || this.textDelay <= 0) {
                this.textObject.setText(text);
                this.isTyping = false;
                resolve(); // 即座にPromiseを解決して完了を通知
                return;
            }
            
            // タイピングありの場合
            this.isTyping = true;
            let index = 0;
            
            this.charByCharCharTimer = this.scene.time.addEvent({
                delay: this.textDelay,
                callback: () => {
                    if (typeSoundMode === 'se') {
                        this.soundManager.playSe('popopo');
                    }
                    // ここで直接 text を参照するように変更
                    this.textObject.text += text[index];
                    index++;
                    if (index === text.length) {
                        if(this.charByCharCharTimer) this.charByCharCharTimer.remove();
                        this.isTyping = false;
                        resolve(); // ★ すべて表示し終わったらPromiseを解決！
                    }
                },
                callbackScope: this,
                loop: true
            });
        });
    }
    
    // MessageWindow.js

    setText(text, useTyping = true, speaker = null) {
        // ★ Promiseのresolve関数をクラスのプロパティに保持する
        this.typingResolve = null; 

        return new Promise(resolve => {
            // ★ resolve関数を保持
            this.typingResolve = resolve; 

            this.currentText = text;
            this.currentSpeaker = speaker;
    
            if (this.charByCharTimer) {
                this.charByCharTimer.remove();
                this.charByCharTimer = null;
            }
            this.textObject.setText('');
    
            const typeSoundMode = this.configManager.getValue('typeSound');
    
            if (!useTyping || text.length === 0 || this.textDelay <= 0) {
                this.textObject.setText(text);
                this.isTyping = false;
                if (this.typingResolve) this.typingResolve(); // 即座に解決
                return;
            }
            
            this.isTyping = true;
            this.fullText = text; // fullTextプロパティを確実に設定
            let index = 0;
            
            this.charByCharTimer = this.scene.time.addEvent({
                delay: this.textDelay,
                callback: () => {
                    if (typeSoundMode === 'se') {
                        this.soundManager.playSe('popopo');
                    }
                    this.textObject.text += this.fullText[index];
                    index++;
                    if (index === this.fullText.length) {
                        if(this.charByCharTimer) this.charByCharTimer.remove();
                        this.charByCharTimer = null;
                        this.isTyping = false;
                        if (this.typingResolve) this.typingResolve(); // 完了時に解決
                    }
                },
                callbackScope: this,
                loop: true
            });
        });
    }

    skipTyping() {
        if (!this.isTyping || !this.charByCharTimer) return;

        this.textObject.setText(this.fullText);

        this.charByCharTimer.remove();
        this.charByCharTimer = null;
        this.isTyping = false;
        
        // ★ 保持していたresolve関数を呼び出して、Promiseを解決させる
        if (this.typingResolve) {
            this.typingResolve();
            this.typingResolve = null; // 一度使ったらクリア
        }
    }

    // ★★★ ロード時にウィンドウの状態をリセットするためのメソッド ★★★
    reset() {
        this.textObject.setText('');
        this.currentText = '';
        this.currentSpeaker = null;
        this.isTyping = false;
        if (this.charByCharTimer) {
            this.charByCharTimer.remove();
        }
        this.hideNextArrow();
          // ★ textContainerが存在すれば破棄する処理を追加
    if (this.textContainer) {
        this.textContainer.destroy();
        this.textContainer = null;
    }

    // ★ 基準となるtextObjectは常に存在し、空にしておく
    this.textObject.setText('').setVisible(false);
    }

    showNextArrow() {
        this.nextArrow.setVisible(true);
        if (this.arrowTween.isPaused()) {
            this.arrowTween.resume();
        }
    }
    
    hideNextArrow() {
        this.nextArrow.setVisible(false);
        if (this.arrowTween.isPlaying()) {
            this.arrowTween.pause();
        }
    }

    get textBoxWidth() {
        return this.textObject.width;
    }
}
