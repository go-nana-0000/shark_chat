# サメチャット backend

## デバッグ/本番切り替え方法

- `.env`内の以下の定数をコメントアウト/解除する
    ```
    # VITE_BACKEND_TARGET=local → ローカル
    # VITE_BACKEND_TARGET=staging → クラウドデバッグ
    # VITE_BACKEND_TARGET=production → クラウド本番
    ```

## デバッグ方法
- Windows PowerShellで以下を実行
    ```
    npm run dev
    ```

## リリース方法
- Windows PowerShellで以下を実行
    ```
    ./deploy.ps1
    ```
- WinSCPで生成されたものをアップロードする
