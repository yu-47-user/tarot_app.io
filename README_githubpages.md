# tarot_app

GitHub Pages で公開するための静的 Web アプリ構成メモです。

- 公開元はリポジトリルートです。
- `index.html`, `script.js`, `style.css` などはリポジトリルート直下に配置します。
- 画像は `assets/tarot/`（大アルカナ）、`assets/tarot/minor/`（小アルカナ）に分けます。
- データファイルは `data/`、保存データはダウンロードファイルとして扱います。

## 公開手順

1. リポジトリルートのファイル・フォルダをそのまま GitHub Pages の公開対象にします。
2. GitHub Pages の公開対象を `/ (root)` に設定します。
3. サブパス公開でも崩れないよう、参照は相対パスのまま維持します。

## ディレクトリ構成例

```
repo/
  index.html
  script.js
  style.css
  assets/
    tarot/
      00_The_fool.jpg
      ...
      tarot_back.jpg
      minor/
        minor_wands_1.jpg
        ...
  data/
    deck.json
```

## 注意

- 小アルカナ画像が `minor/` フォルダに入っていることを確認してください。
- 画像パスは `deck.json` で実ファイル名と大文字小文字まで一致させてください。
- 画像保存は Canvas 生成、JSON 保存は File API に分離しています。
