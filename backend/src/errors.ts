// ChatError（ステータスコード付きのエラー）

// ルート側でそのままHTTPレスポンスに変換できるエラー
export class ChatError extends Error {
    status: 400 | 429 | 500;

    constructor(message: string, status: 400 | 429 | 500 = 500) {
        super(message);
        this.name = "ChatError";
        this.status = status;
    }
}
