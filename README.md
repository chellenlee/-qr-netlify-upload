# 橘湾岸QR2025春（Netlify Functions版）

このPWAは、マラソン計測現場でQRコードを読み取り、DropboxへCSV保存＆閲覧できるWebアプリです。
アクセストークンはNetlify Functions経由で安全に扱われます。

## 必要環境

- Netlify（無料アカウント）
- GitHub（コード管理）
- Dropboxアクセストークン（`DROPBOX_TOKEN`）をNetlifyに設定

## デプロイ手順

1. GitHubにこのフォルダ一式をアップロード
2. Netlifyで「New Site from Git」を選択し、このリポジトリを指定
3. 環境変数に `DROPBOX_TOKEN` を設定
4. ビルド設定：
   - Publish directory: `public`
   - Build command: 空欄でOK
