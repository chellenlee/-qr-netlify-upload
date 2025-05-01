# QRコードデータアップロードアプリ

このアプリは、マラソン等のイベントにおいて、QRコードから読み取った通過情報をCSVとして記録し、
DropboxにアップロードするWebアプリです。Netlify Functionsを使用し、安全なAPIキー管理を実現します。

## 構成

- `public/index.html` : フロントエンドUI
- `netlify/functions/upload.js` : DropboxへのCSVアップロード
- `netlify/functions/check.js` : DropboxからCSV取得・統合
- `netlify.toml` : Netlifyビルド設定

## セットアップ手順（GitHub連携用）

1. GitHubに新しいリポジトリを作成
2. 本プロジェクトの内容をアップロード
3. Netlifyにログインし、「Add new site」→「Import from Git」からGitHub連携
4. ビルド設定は以下の通り：

```
Publish directory: public
Build command: （空欄）
```

5. DropboxのアクセストークンをNetlifyの環境変数 `DROPBOX_TOKEN` に追加

## 注意

- このリポジトリにはDropboxのアクセストークンを含めないでください
- 本番環境ではHTTPS上での動作を確認してください
