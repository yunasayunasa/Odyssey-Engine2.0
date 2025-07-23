; === オーバーレイ機能 総合テストシナリオ ===

; --- 1. 基本的な表示と変数操作 ---
[eval exp="sf.overlay_count = (sf.overlay_count || 0) + 1"]
[chara_show name="yuna" pos="center" time=500]
[wait time=500]

yuna:「アクションシーンの上に、私が表示されていますか？」
yuna:「背後ではPLAYERの文字が動き続けているはずです。」

; --- 2. オーバーレイ上での演出 ---
yuna:「では、こちらのレイヤーだけで演出を行いますね。」
[chara_mod name="yuna" x=1000 time=1000]
[playse storage="cursor-ok"]
yuna:「まず、右へ移動。」

[chara_mod name="yuna" x=280 time=1000]
[playse storage="cursor-cancel"]
yuna:「次に、左へ移動。」

[shake time=500]
yuna:「カメラのシェイクも、このオーバーレイシーンだけに影響します。」

; --- 3. グローバル変数(f変数)との連携 ---
yuna:「下のシーンが持つべきゲーム内変数も、ここから変更できますよ。」
[eval exp="f.score = (f.score || 0) + 100"]
yuna:「スコアに100ポイント加算しました。[s]」

; --- 4. 選択肢のテスト ---
yuna:「最後に選択肢のテストです。どちらかを選んでください。」

*choice1|選択肢A
@jump target="*label_A"

*choice2|選択-肢B
@jump target="*label_B"

[s]

*label_A
yuna:「Aが選ばれましたね。」
@jump target="*common_route"

*label_B
yuna:「Bが選ばれましたね。」
@jump target="*common_route"


*common_route
yuna:「これでテストは完了です。確認できたら、この会話を終了します。」
[chara_hide name="yuna" time=500]
[wait time=500]

; ★ 最後に必ずoverlay_endを呼んでシーンを閉じる
[overlay_end]