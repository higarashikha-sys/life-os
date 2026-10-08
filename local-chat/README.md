# Local Chat

OpenAI / ChatGPT APIを使わず、PC内のOllamaでLLM推論を行うローカルチャットです。
会話履歴は `local_chat.db` (SQLite) に保存されます。

## 構成

- 推論: Ollama（localhost:11434）
- UI/API: FastAPI（localhost:8000）
- 履歴: SQLite
- OpenAI API: 不使用

## Windowsでの導入

1. OllamaをPCにインストールする。
2. PowerShellまたはコマンドプロンプトでモデルを取得する。

```bat
ollama pull qwen3:8b
```

3. このディレクトリの `start_windows.bat` を実行する。
4. ブラウザで `http://127.0.0.1:8000` を開く。

初回のみPython仮想環境と依存パッケージを作成します。

## スマホから使う

PCとスマホを同じLAN/Wi-Fiに接続し、PCのローカルIPを確認します。
例: PCが `192.168.1.20` の場合、スマホのブラウザから以下を開きます。

```text
http://192.168.1.20:8000
```

Windows FirewallでPython/8000番ポートのLAN内通信許可が必要な場合があります。

外出先から使う場合は、ポートをインターネットへ直接公開せず、Tailscale等のVPNを使ってPCへ接続してください。

## データの所在

- 会話本文: `local_chat.db`
- モデル本体: Ollamaのローカルモデル保存領域
- 履歴出力: UIの「履歴出力」からJSON

## プライバシー上の注意

このアプリ自身はOpenAIへ通信しません。ただし、モデルの初回ダウンロード、Pythonパッケージ導入、Ollamaの更新等ではインターネット通信が発生します。完全オフライン運用にする場合は、導入完了後にネットワークを切断してもチャット自体は動作します。

## モデル変更

Ollamaに複数モデルを入れるとUIのモデル一覧から選択できます。

例:

```bat
ollama pull qwen3:8b
ollama pull gemma3:12b
```

PC性能、とくにRAM/VRAMによって実用的なモデルサイズは変わります。
