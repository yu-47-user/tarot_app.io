# tarot_app

GitHub Pages で公開するための静的Webアプリ構成です。

- `public/` 配下が公開ディレクトリです。
- `index.html`, `script.js`, `style.css` などは `public/` 直下に配置してください。
- 画像は `public/assets/tarot/`（大アルカナ）、`public/assets/tarot/minor/`（小アルカナ）に分けてください。
- データファイルは `public/data/`、保存データは `public/saves/` です。

## 公開手順

1. `public/` 配下のファイル・フォルダをリポジトリのルート、または `gh-pages` ブランチのルートにコピーしてください。
2. GitHub Pages の公開対象を `/ (root)` または `gh-pages` ブランチに設定してください。
3. 小アルカナ画像は `public/assets/tarot/minor/` に配置してください。

## ディレクトリ構成例

```
public/
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
  saves/
```

## 注意
- 小アルカナ画像が `minor/` フォルダに入っていることを確認してください。
- 画像パスは `deck.json` で `tarot/minor/xxx.jpg` 形式になっている必要があります。
