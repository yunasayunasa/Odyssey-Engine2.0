; === サブルーチンテスト用シナリオ (呼び出される側) ===
; [call]で呼ばれ、[return]で戻ります。

*start
[chara_show name="yuna" pos="left" time=500]
[chara_show name="kaito" pos="right" time=500]

[fadein time=500]
[wait time=500]
kaito:「サブルーチンに突入しました！ここでセーブ＆ロードを試してください。」
[eval exp="f.sub_progress = 'entered_sub'"]
[log exp="f.sub_progress"]


yuna:「変数を変更します。戻った後に確認してください。」
[eval exp="f.sub_result = 'complete_from_subroutine'"]
 ; ★ 戻り値の文字列をより明確に
[log exp="f.sub_result"]
kaito:サブルーチンからのサブシーンテストも行います。
[jump storage="ActionScene" params="{player_level:f.love_meter, player_name:'&f.player_name;', start_area:'bridge', current_coin:f.coin, player_max_hp:f.player_max_hp, player_hp:f.player_hp}"]
yuna:サブルーチンからサブシーンテスト成功です！このあと元のメインルーチンに戻れるかな？
kaito:「[return]で戻ります。この直前でセーブ＆ロードしても大丈夫かな？」
[fadeout time=500]
[return]
