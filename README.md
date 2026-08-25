# Life OS 0.1

個人用の生活管理 Android アプリ試作版です。ネット接続なしで動き、記録は端末内に保存されます。

## 入っている機能

- Today
  - 今日のタスク
  - 今日の習慣
  - 研究・読書の「前回の続き」
  - 空き時間と集中度から「今から何する？」を提案
  - 日記へのクイック記録
- Inbox
  - 思いつきを未整理のまま保存
  - Inbox からタスク化
  - 分類・所要時間・集中度・期限付きタスクの作成
- 習慣
  - 週ごとの目標回数
  - 実行記録と実行率
- 研究・読書 / Projects
  - 「今日やったこと」
  - 「今考えていること」
  - 「次に見る場所・次の一手」
  - 作業時間
  - 過去の思考履歴を時系列表示
- 日記
  - 今日やったこと
  - 気分・疲労・集中
  - 気づき・考え
  - 明日の最初の一手
  - 気分・体力の5段階記録
- 履歴
  - 日記、タスク、習慣、研究、読書、趣味を横断検索
  - 種類・開始日・終了日で絞り込み
- Weekly Review
  - タスク完了数
  - 習慣実行率
  - 研究・読書等の作業時間
  - 放置タスク、習慣停滞、研究/読書の停止、日記上の疲労記述などから改善候補を提示
- バックアップ
  - Android のファイル選択画面を使って JSON 書き出し / 読み込み

## データ保存

データは WebView の localStorage に保存します。アプリを通常終了しても残ります。

アプリデータを削除・端末初期化すると消えるため、`設定 > JSONを書き出す` で定期的にバックアップしてください。

## AIについて

0.1 の改善提案は端末内のルール判定です。外部AIへ日記を送信しません。

今後、任意で LLM API を接続し、週次の記録要約・見落としている生活改善案・タスク分解を行う構成へ拡張できます。API送信の有無をユーザーが選べる設計にする想定です。

## Android Studioでビルド

必要条件:

- Android Studio
- Android SDK Platform 35
- JDK 17
- Gradle 8.9（プロジェクトに wrapper バイナリは同梱していません）

Android Studio でこのフォルダを開き、Gradle 8.9 を指定して `app` をビルドします。

出力:

`app/build/outputs/apk/debug/app-debug.apk`

## GitHub ActionsでAPKを作る

`.github/workflows/build-apk.yml` を同梱しています。GitHubリポジトリへ配置して Actions の `Build APK` を実行すると、`LifeOS-debug-apk` artifact が生成されます。

## 構造

- `app/src/main/assets/index.html` : 画面・ロジック・端末内データ
- `app/src/main/java/com/lifeos/personal/MainActivity.java` : Android WebView とバックアップ入出力
- `app/src/main/AndroidManifest.xml` : Android アプリ設定

## 現在の制約

- Google Calendar 同期なし
- Android 通知なし
- クラウド同期なし
- LLM API 接続なし
- WebView localStorage を使用しており、Room/SQLite ネイティブDB版ではない

0.1 は「実際に毎日使って、必要なデータ項目を確定する」ための試作です。長期運用後に Room/SQLite へ移行する方が安全です。
