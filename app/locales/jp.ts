import { getClientConfig } from "../config/client";
import { SubmitKey } from "../store/config";
import { SAAS_CHAT_UTM_URL } from "@/app/constant";

const isApp = !!getClientConfig()?.isApp;

const jp = {
  WIP: "この機能は開発中です",
  Error: {
    Unauthorized: isApp
      ? `😆 会話中に問題が発生しましたが、心配しないでください:
    \\ 1️⃣ 設定なしで始めたい場合は、[ここをクリックしてすぐにチャットを開始 🚀](${SAAS_CHAT_UTM_URL})
    \\ 2️⃣ 自分のOpenAIリソースを使用したい場合は、[ここをクリックして](/#/settings)設定を変更してください ⚙️`
      : `😆 会話中に問題が発生しましたが、心配しないでください:
    \ 1️⃣ 設定なしで始めたい場合は、[ここをクリックしてすぐにチャットを開始 🚀](${SAAS_CHAT_UTM_URL})
    \ 2️⃣ プライベートデプロイ版を使用している場合は、[ここをクリックして](/#/auth)アクセストークンを入力してください 🔑
    \ 3️⃣ 自分のOpenAIリソースを使用したい場合は、[ここをクリックして](/#/settings)設定を変更してください ⚙️
 `,
  },
  Auth: {
    Return: "戻る",
    Title: "パスワードが必要です",
    Tips: "管理者がパスワード認証を有効にしました。以下にアクセスコードを入力してください",
    SubTips: "または、OpenAIまたはGoogle APIキーを入力してください",
    Input: "ここにアクセスコードを入力",
    Confirm: "確認",
    Later: "後で",
    SaasTips: "",
    TopTips: "",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count}件の会話`,
  },
  Chat: {
    MultiModel: {
      Title: "マルチモデルチャット設定",
      Enabled: "マルチモデル（有効）",
      Disabled: "マルチモデル（無効）",
      Count: (count: number) => `${count} モデル`,
      Description:
        "🎯 マルチモデルアリーナモードが有効になりました！モデルセレクターをクリックして、会話用に複数のモデルを選択してください。",
      OpenSelector: "モデルセレクターを開く",
      AlreadySelected: (count: number) => `(${count} 選択済み)`,
      Tips: "💡 ヒント：マルチモデルモードでは、複数のモデルを同時に選択でき、各モデルが独立してメッセージに応答するため、異なるモデルの応答を比較できます。",
      EnableToast:
        "🎯 マルチモデルモードが有効になりました！会話アリーナ用に複数のモデルを選択するには、モデルセレクターをクリックしてください",
      DisableToast: "マルチモデルモードが無効になりました",
      MinimumModelsError:
        "マルチモデル会話を有効にするには、少なくとも2つのモデルを選択してください",
      ModelsSelectedToast: (count: number) =>
        `${count} モデルが会話用に選択されました`,
    },
    UI: {
      SidebarToggle: "サイドバーを折りたたむ/展開",
      SearchModels: "モデルを検索...",
      SelectModel: "モデルを選択",
      ContextTooltip: {
        Current: (current: number, max: number) =>
          `現在のコンテキスト: ${current} / ${max}`,
        CurrentTokens: (current: number, max: number) =>
          `現在のトークン: ${current.toLocaleString()} / ${max.toLocaleString()}`,
        CurrentTokensUnknown: (current: number) =>
          `現在のトークン: ${current.toLocaleString()} / 不明`,
        EstimatedTokens: (estimated: number) =>
          `推定トークン: ${estimated.toLocaleString()}`,
        ContextTokens: (tokens: string) => `コンテキスト: ${tokens} トークン`,
      },
    },
    SubTitle: (count: number) => `合計${count}件の会話`,
    EditMessage: {
      Title: "メッセージ履歴を編集",
      Topic: {
        Title: "チャットテーマ",
        SubTitle: "現在のチャットテーマを変更",
      },
    },
    Actions: {
      ChatList: "メッセージリストを見る",
      CompressedHistory: "圧縮された履歴プロンプトを見る",
      Export: "チャット履歴をエクスポート",
      Copy: "コピー",
      Stop: "停止",
      Retry: "再試行",
      Pin: "固定",
      PinToastContent: "1件の会話をプリセットプロンプトに固定しました",
      PinToastAction: "見る",
      Delete: "削除",
      Edit: "編集",
      FullScreen: "フルスクリーン",
      RefreshTitle: "タイトルを更新",
      RefreshToast: "タイトル更新リクエストが送信されました",
      Speech: "読み上げ",
      StopSpeech: "停止",
      PreviousVersion: "前のバージョン",
      NextVersion: "次のバージョン",
      Debug: "デバッグ",
      CopyAsCurl: "cURLとしてコピー",
    },
    Commands: {
      new: "新しいチャット",
      newm: "アシスタントから新しいチャット",
      next: "次のチャット",
      prev: "前のチャット",
      clear: "コンテキストをクリア",
      fork: "チャットをコピー",
      del: "チャットを削除",
    },
    InputActions: {
      Stop: "応答を停止",
      ToBottom: "最新へスクロール",
      Theme: {
        auto: "自動テーマ",
        light: "ライトモード",
        dark: "ダークモード",
      },
      Prompt: "クイックコマンド",
      Masks: "すべてのアシスタント",
      Clear: "チャットをクリア",
      Reset: "チャットをリセット",
      ResetConfirm:
        "現在のチャットウィンドウの内容全体をリセットしてもよろしいですか？",
      Settings: "チャット設定",
      UploadImage: "画像をアップロード",
      Search: "検索",
      SearchOn: "検索有効",
      SearchOff: "検索無効",
      SearchEnabledToast:
        "🔍 検索機能が有効になりました！ウェブ検索ができるようになりました",
      SearchDisabledToast: "❌ 検索機能が無効になりました",
    },
    MCP: {
      Title: "MCPツールコントロール",
      Enable: "MCP機能を有効化",
      EnableDesc:
        "有効にすると、MCPツールを使用できます。無効にすると、MCP関連のプロンプトは送信されません",
      NoTools: "利用可能なMCPツールがありません",
      Loading: "読み込み中...",
      ClientFailed: "MCPクライアントの読み込みに失敗しました、サイレント処理",
      ToolsCount: (count: number) => `${count} ツール`,
    },
    Rename: "チャットの名前を変更",
    Typing: "入力中…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey}で送信`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "、Shift + Enterで改行";
      }
      return inputHints + "、/で補完をトリガー、:でコマンドをトリガー";
    },
    Send: "送信",
    TokenUsage: "使用量",
    TokenTooltip: {
      Context: "現在のコンテキスト",
      CurrentToken: "現在のトークン",
      EstimatedToken: "推定トークン",
      Unknown: "不明",
    },
    StartSpeak: "話し始める",
    StopSpeak: "話すのをやめる",
    Config: {
      Reset: "デフォルト値にリセット",
      SaveAs: "アシスタントとして保存",
    },
    IsContext: "コンテキストプロンプト",
    ShortcutKey: {
      Title: "キーボードショートカット",
      newChat: "新しいチャットを開く",
      focusInput: "入力フィールドにフォーカス",
      copyLastMessage: "最後の応答をコピー",
      copyLastCode: "最後のコードブロックをコピー",
      showShortcutKey: "ショートカットを表示",
      clearContext: "コンテキストをクリア",
    },
    Thinking: {
      Title: "思考の深さ",
      Dynamic: "動的思考",
      DynamicDesc: "モデルが思考の深さを自動的に決定します",
      Off: "思考無効",
      OffDesc: "思考プロセスなし",
      Light: "軽い思考",
      LightDesc: "1024トークン",
      Medium: "中程度の思考",
      MediumDesc: "4096トークン",
      Deep: "深い思考",
      DeepDesc: "8192トークン",
      VeryDeep: "非常に深い思考",
      VeryDeepDesc: "16384トークン",
      Notice:
        "thinkingBudgetをサポートするモデルのみが思考の深さを調整できます",
      ClaudeNotice: "Claudeシリーズモデルのみが思考の深さを調整できます",
      GeminiNotice: "Geminiシリーズモデルのみが思考の深さを調整できます",
      ClaudeLight: "思考",
      ClaudeLightDesc: "5000トークン",
      ClaudeMedium: "真剣に考える",
      ClaudeMediumDesc: "10000トークン",
      ClaudeDeep: "もっと真剣に考える",
      ClaudeDeepDesc: "20000トークン",
      ClaudeVeryDeep: "超思考",
      ClaudeVeryDeepDesc: "32000トークン",
      ClaudeDynamicDesc: "思考の深さを自動的に調整（デフォルト10000トークン）",
    },
  },
  Export: {
    Title: "チャット履歴を共有",
    Copy: "すべてコピー",
    Download: "ファイルをダウンロード",
    Share: "チャット履歴を共有",
    MessageFromYou: "ユーザー",
    MessageFromChatGPT: "ChatGPT",
    Format: {
      Title: "エクスポート形式",
      SubTitle: "MarkdownテキストまたはPNG画像としてエクスポートできます",
    },
    IncludeContext: {
      Title: "アシスタントコンテキストを含む",
      SubTitle: "メッセージにアシスタントコンテキストを表示するかどうか",
    },
    Steps: {
      Select: "選択",
      Preview: "プレビュー",
    },
    Image: {
      Toast: "スクリーンショットを生成中",
      Modal: "長押しまたは右クリックして画像を保存",
    },
    Artifacts: {
      Title: "ページを印刷",
      Error: "印刷エラー",
    },
  },
  Select: {
    Search: "メッセージを検索",
    All: "すべて選択",
    Latest: "最新の数件",
    Clear: "選択をクリア",
  },
  Memory: {
    Title: "履歴の要約",
    EmptyContent: "対話内容が短いため、要約は不要です",
    Send: "チャット履歴を自動的に圧縮し、コンテキストとして送信",
    Copy: "要約をコピー",
    Reset: "[未使用]",
    ResetConfirm: "履歴の要約をリセットしてもよろしいですか？",
  },
  Home: {
    NewChat: "新しいチャット",
    DeleteChat: "選択した会話を削除してもよろしいですか？",
    DeleteToast: "会話を削除しました",
    Revert: "元に戻す",
  },
  Settings: {
    Title: "設定",
    SubTitle: "すべての設定オプション",
    ShowPassword: "パスワードを表示",

    Tab: {
      General: "一般設定",
      Sync: "クラウド同期",
      Mask: "アシスタント",
      Prompt: "プロンプト",
      ModelService: "モデルサービス",
      ModelConfig: "モデル設定",
      Voice: "音声",
    },

    Danger: {
      Reset: {
        Title: "すべての設定をリセット",
        SubTitle: "すべての設定項目をデフォルト値にリセット",
        Action: "今すぐリセット",
        Confirm: "すべての設定をリセットしてもよろしいですか？",
      },
      Clear: {
        Title: "すべてのデータをクリア",
        SubTitle: "すべてのチャット、設定データをクリア",
        Action: "今すぐクリア",
        Confirm: "すべてのチャット、設定データをクリアしてもよろしいですか？",
      },
    },
    Lang: {
      Name: "Language", // ATTENTION: if you wanna add a new translation, please do not translate this value, leave it as `Language`
      All: "すべての言語",
    },
    Avatar: "アバター",
    FontSize: {
      Title: "フォントサイズ",
      SubTitle: "チャットコンテンツのフォントサイズ",
    },
    FontFamily: {
      Title: "チャットフォント",
      SubTitle:
        "チャットコンテンツのフォント、空白の場合はグローバルデフォルトフォントを適用します",
      Placeholder: "フォント名",
    },
    InjectSystemPrompts: {
      Title: "システムプロンプトの注入",
      SubTitle:
        "すべてのリクエストメッセージリストの先頭にChatGPTのシステムプロンプトを強制的に追加",
    },
    InputTemplate: {
      Title: "ユーザー入力のプリプロセス",
      SubTitle: "最新のメッセージをこのテンプレートに埋め込む",
    },

    Update: {
      Version: (x: string) => `現在のバージョン：${x}`,
      IsLatest: "最新バージョンです",
      CheckUpdate: "更新を確認",
      IsChecking: "更新を確認中...",
      FoundUpdate: (x: string) => `新しいバージョンを発見：${x}`,
      GoToUpdate: "更新へ進む",
      Success: "更新成功！",
      Failed: "更新失敗",
    },
    SendKey: "送信キー",
    Theme: "テーマ",
    TightBorder: "ボーダーレスモード",
    SendPreviewBubble: {
      Title: "プレビューバブル",
      SubTitle: "プレビューバブルでMarkdownコンテンツをプレビュー",
    },
    AutoGenerateTitle: {
      Title: "自動タイトル生成",
      SubTitle: "チャット内容に基づいて適切なタイトルを生成",
    },
    Sync: {
      CloudState: "クラウドデータ",
      NotSyncYet: "まだ同期されていません",
      Success: "同期に成功しました",
      Fail: "同期に失敗しました",

      Config: {
        Modal: {
          Title: "クラウド同期の設定",
          Check: "可用性を確認",
        },
        SyncType: {
          Title: "同期タイプ",
          SubTitle: "好きな同期サーバーを選択",
        },
        Proxy: {
          Title: "プロキシを有効化",
          SubTitle:
            "ブラウザで同期する場合、クロスオリジン制限を避けるためにプロキシを有効にする必要があります",
        },
        ProxyUrl: {
          Title: "プロキシURL",
          SubTitle: "このプロジェクトに組み込まれたクロスオリジンプロキシ専用",
        },

        WebDav: {
          Endpoint: "WebDAV エンドポイント",
          UserName: "ユーザー名",
          Password: "パスワード",
        },

        UpStash: {
          Endpoint: "UpStash Redis REST URL",
          UserName: "バックアップ名",
          Password: "UpStash Redis REST トークン",
        },
      },

      LocalState: "ローカルデータ",
      Overview: (overview: any) => {
        return `${overview.chat} 回の対話、${overview.message} 件のメッセージ、${overview.prompt} 件のプロンプト、${overview.mask} 件のマスク`;
      },
      ImportFailed: "インポートに失敗しました",
    },
    Mask: {
      ModelIcon: {
        Title: "モデルアイコンをAIアバターとして使用",
        SubTitle:
          "有効にすると、会話のAIアバターは現在のモデルアイコンを使用し、絵文字ではなくなります",
      },
    },
    AccessCode: {
      Title: "アクセスコード",
      SubTitle:
        "アクセス制御が有効になっています、アクセスコードを入力してください",
      Placeholder: "アクセスコードを入力",
      Status: {
        Enabled: "アクセス制御が有効",
        Valid: "アクセスコード有効",
        Invalid: "アクセスコード無効",
      },
    },
    Prompt: {
      Disable: {
        Title: "プロンプトの自動補完を無効化",
        SubTitle: "入力フィールドの先頭に / を入力して自動補完をトリガー",
      },
      List: "カスタムプロンプトリスト",
      ListCount: (builtin: number, custom: number) =>
        `組み込み ${builtin} 件、ユーザー定義 ${custom} 件`,
      Edit: "編集",
      Modal: {
        Title: "プロンプトリスト",
        Add: "新規作成",
        Search: "プロンプトを検索",
      },
      EditModal: {
        Title: "プロンプトを編集",
      },
    },
    HistoryCount: {
      Title: "履歴メッセージ数",
      SubTitle: "各リクエストに含まれる履歴メッセージの数",
    },
    CompressThreshold: {
      Title: "履歴メッセージの圧縮閾値",
      SubTitle: "未圧縮の履歴メッセージがこの値を超えた場合、圧縮が行われます",
    },

    Access: {
      SaasStart: {
        Title: "",
        Label: "",
        SubTitle: "",
        ChatNow: "",
      },
      AccessCode: {
        Title: "アクセスパスワード",
        SubTitle: "管理者が暗号化アクセスを有効にしました",
        Placeholder: "アクセスパスワードを入力してください",
      },
      CustomEndpoint: {
        Title: "カスタムエンドポイント",
        SubTitle: "カスタムAzureまたはOpenAIサービスを使用するかどうか",
      },
      Provider: {
        Title: "モデルプロバイダー",
        SubTitle: "異なるプロバイダーに切り替える",
        Name: {
          ByteDance: "ByteDance",
          Alibaba: "Alibaba Cloud",
          Moonshot: "Moonshot",
        },
        Status: {
          Enabled: "有効",
        },
        Models: {
          Title: "有効なモデル",
          SubTitle: "現在のプロバイダーで有効になっているモデルのリスト",
          NoModels: "有効なモデルがありません",
          Manage: "管理",
        },
        Description: {
          OpenAI: "OpenAI GPTシリーズモデル",
          Azure: "Microsoft Azure OpenAIサービス",
          Google: "Google Geminiシリーズモデル",
          Anthropic: "Anthropic Claudeシリーズモデル",
          ByteDance: "ByteDance Doubaoシリーズモデル",
          Alibaba: "Alibaba Cloud Qwenシリーズモデル",
          Moonshot: "Moonshot Kimiシリーズモデル",
          DeepSeek: "DeepSeekシリーズモデル",
          XAI: "xAI Grokシリーズモデル",
          SiliconFlow: "SiliconFlow",
          Custom: "カスタム",
        },
        Terms: {
          Provider: "プロバイダー",
        },
      },
      OpenAI: {
        ApiKey: {
          Title: "OpenAI APIキー",
          SubTitle: "カスタムOpenAIキーを使用",
          Placeholder: "sk-xxx",
        },

        Endpoint: {
          Title: "OpenAIエンドポイント",
          SubTitle:
            "http(s)://で始まる必要があるか、デフォルトで/api/openaiを使用",
        },
      },
      Azure: {
        ApiKey: {
          Title: "Azure APIキー",
          SubTitle: "AzureコンソールからAPIキーを確認してください",
          Placeholder: "Azure APIキー",
        },

        Endpoint: {
          Title: "Azureエンドポイント",
          SubTitle: "例：",
        },

        ApiVerion: {
          Title: "Azure APIバージョン",
          SubTitle: "AzureコンソールからAPIバージョンを確認してください",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "Anthropic APIキー",
          SubTitle:
            "カスタムAnthropicキーを使用してパスワードアクセス制限を回避",
          Placeholder: "Anthropic APIキー",
        },

        Endpoint: {
          Title: "エンドポイントアドレス",
          SubTitle: "例：",
        },

        ApiVerion: {
          Title: "APIバージョン（Claude APIバージョン）",
          SubTitle: "特定のAPIバージョンを選択して入力",
        },
      },
      Google: {
        ApiKey: {
          Title: "APIキー",
          SubTitle: "Google AIからAPIキーを取得",
          Placeholder: "Google AI Studio APIキーを入力",
        },

        Endpoint: {
          Title: "エンドポイントアドレス",
          SubTitle: "例：",
        },

        ApiVersion: {
          Title: "APIバージョン（gemini-pro専用）",
          SubTitle: "特定のAPIバージョンを選択",
        },
        GoogleSafetySettings: {
          Title: "Googleセーフティ設定",
          SubTitle: "コンテンツフィルタリングレベルを設定",
        },
      },
      Baidu: {
        ApiKey: {
          Title: "APIキー",
          SubTitle: "カスタムBaidu APIキーを使用",
          Placeholder: "Baidu APIキー",
        },
        SecretKey: {
          Title: "シークレットキー",
          SubTitle: "カスタムBaiduシークレットキーを使用",
          Placeholder: "Baiduシークレットキー",
        },
        Endpoint: {
          Title: "エンドポイントアドレス",
          SubTitle: "カスタム設定は.envでサポートされていません",
        },
      },
      Tencent: {
        ApiKey: {
          Title: "APIキー",
          SubTitle: "カスタムTencent APIキーを使用",
          Placeholder: "Tencent APIキー",
        },
        SecretKey: {
          Title: "シークレットキー",
          SubTitle: "カスタムTencentシークレットキーを使用",
          Placeholder: "Tencentシークレットキー",
        },
        Endpoint: {
          Title: "エンドポイントアドレス",
          SubTitle: "カスタム設定は.envでサポートされていません",
        },
      },
      ByteDance: {
        ApiKey: {
          Title: "インターフェースキー",
          SubTitle: "カスタムByteDance APIキーを使用",
          Placeholder: "ByteDance APIキー",
        },
        Endpoint: {
          Title: "エンドポイントアドレス",
          SubTitle: "例：",
        },
      },
      Alibaba: {
        ApiKey: {
          Title: "インターフェースキー",
          SubTitle: "カスタムAlibaba Cloud APIキーを使用",
          Placeholder: "Alibaba Cloud APIキー",
        },
        Endpoint: {
          Title: "エンドポイントアドレス",
          SubTitle: "例：",
        },
      },
      Moonshot: {
        ApiKey: {
          Title: "インターフェースキー",
          SubTitle: "カスタムMoonshot APIキーを使用",
          Placeholder: "Moonshot APIキー",
        },
        Endpoint: {
          Title: "エンドポイントアドレス",
          SubTitle: "例：",
        },
      },
      DeepSeek: {
        ApiKey: {
          Title: "インターフェースキー",
          SubTitle: "カスタムDeepSeek APIキーを使用",
          Placeholder: "DeepSeek APIキー",
        },
        Endpoint: {
          Title: "エンドポイントアドレス",
          SubTitle: "例：",
        },
      },
      XAI: {
        ApiKey: {
          Title: "インターフェースキー",
          SubTitle: "カスタムXAI APIキーを使用",
          Placeholder: "XAI APIキー",
        },
        Endpoint: {
          Title: "エンドポイントアドレス",
          SubTitle: "例：",
        },
      },
      SiliconFlow: {
        ApiKey: {
          Title: "インターフェースキー",
          SubTitle: "カスタムSiliconFlow APIキーを使用",
          Placeholder: "SiliconFlow APIキー",
        },
        Endpoint: {
          Title: "エンドポイントアドレス",
          SubTitle: "例：",
        },
      },
      ChatGLM: {
        ApiKey: {
          Title: "APIキー",
          SubTitle: "カスタムChatGLM APIキーを使用",
          Placeholder: "ChatGLM APIキー",
        },
        Endpoint: {
          Title: "エンドポイントアドレス",
          SubTitle: "例：",
        },
      },
      Iflytek: {
        ApiKey: {
          Title: "ApiKey",
          SubTitle: "iFlytek SparkコンソールからApiKeyを取得",
          Placeholder: "ApiKey",
        },
        ApiSecret: {
          Title: "ApiSecret",
          SubTitle: "iFlytek SparkコンソールからApiSecretを取得",
          Placeholder: "ApiSecret",
        },
        Endpoint: {
          Title: "エンドポイントアドレス",
          SubTitle: "例：",
        },
      },
      AI302: {
        ApiKey: {
          Title: "インターフェースキー",
          SubTitle: "カスタム302.AI APIキーを使用",
          Placeholder: "302.AI APIキー",
        },
        Endpoint: {
          Title: "エンドポイントアドレス",
          SubTitle: "例：",
        },
      },
      CustomProvider: {
        Add: {
          Title: "カスタムプロバイダーを追加",
          Button: "カスタムプロバイダーを追加",
          Description:
            "既存のプロバイダータイプに基づいてカスタムチャネルを追加",
        },
        Modal: {
          Title: "カスタムプロバイダーを追加",
          Name: {
            Title: "プロバイダー名",
            Placeholder: "カスタムプロバイダー名を入力",
            Required: "プロバイダー名を入力してください",
            Unique:
              "プロバイダー名は既に存在します、別の名前を使用してください",
          },
          Type: {
            Title: "プロバイダータイプ",
            OpenAI: "OpenAI - OpenAI API互換サービス",
            Google: "Google - Google Gemini API",
            Anthropic: "Anthropic - Anthropic Claude API",
          },
          ApiKey: {
            Title: "APIキー",
            Placeholder: "APIキーを入力",
            Required: "APIキーを入力してください",
          },
          Endpoint: {
            Title: "カスタムエンドポイント",
            Placeholder:
              "デフォルトエンドポイントを使用するには空のままにします",
            Optional: "（オプション）",
          },
          Cancel: "キャンセル",
          Confirm: "追加",
        },
        Config: {
          Type: "プロバイダータイプ",
          BasedOn: "に基づく",
          ApiKeyDescription: "カスタムプロバイダーのAPIキー",
          EndpointDescription: "カスタムAPIエンドポイントアドレス",
          EndpointPlaceholder: "APIエンドポイントアドレス",
          Delete: {
            Title: "プロバイダーを削除",
            SubTitle: "このカスタムプロバイダーとすべての設定を削除",
            Button: "削除",
            Confirm: "カスタムプロバイダーを削除してもよろしいですか",
            ConfirmSuffix: "？",
          },
        },
      },
    },

    Model: "モデル (model)",
    CompressModel: {
      Title: "圧縮モデル",
      SubTitle: "履歴を圧縮するために使用されるモデル",
    },
    Temperature: {
      Title: "ランダム性 (temperature)",
      SubTitle: "値が大きいほど応答がランダムになります",
    },
    TopP: {
      Title: "トップP (top_p)",
      SubTitle:
        "ランダム性に似ていますが、ランダム性と一緒に変更しないでください",
    },
    MaxTokens: {
      Title: "1回の応答制限 (max_tokens)",
      SubTitle: "1回の対話で使用される最大トークン数",
    },
    PresencePenalty: {
      Title: "新鮮度 (presence_penalty)",
      SubTitle: "値が大きいほど新しいトピックに移行する可能性が高くなります",
    },
    FrequencyPenalty: {
      Title: "頻度ペナルティ (frequency_penalty)",
      SubTitle: "値が大きいほど繰り返しの単語が減少します",
    },
    TTS: {
      Enable: {
        Title: "TTSを有効化",
        SubTitle: "テキスト読み上げサービスを有効化",
      },
      Autoplay: {
        Title: "自動再生を有効化",
        SubTitle:
          "自動的に音声を生成して読み上げ、まずテキスト読み上げスイッチを有効にする必要があります",
      },
      Model: "モデル",
      Engine: "変換エンジン",
      EngineConfig: {
        Title: "設定ノート",
        SubTitle:
          "OpenAI-TTSはモデルサービスのOpenAIプロバイダー設定を使用します。使用前にOpenAIプロバイダーに対応するAPIキーを追加してください",
      },
      Voice: {
        Title: "音声",
        SubTitle: "音声生成時に使用する音声",
      },
      Speed: {
        Title: "速度",
        SubTitle: "生成される音声の速度",
      },
    },
    Realtime: {
      Enable: {
        Title: "リアルタイムチャット",
        SubTitle: "リアルタイムチャット機能を有効化",
      },
      Provider: {
        Title: "モデルプロバイダー",
        SubTitle: "異なるプロバイダー間で切り替え",
      },
      Model: {
        Title: "モデル",
        SubTitle: "モデルを選択",
      },
      ApiKey: {
        Title: "APIキー",
        SubTitle: "APIキー",
        Placeholder: "APIキー",
      },
      Azure: {
        Endpoint: {
          Title: "エンドポイント",
          SubTitle: "エンドポイント",
        },
        Deployment: {
          Title: "デプロイメント名",
          SubTitle: "デプロイメント名",
        },
      },
      Temperature: {
        Title: "ランダム性 (temperature)",
        SubTitle: "高い値はよりランダムな応答を生み出します",
      },
    },
  },
  Store: {
    DefaultTopic: "新しいチャット",
    BotHello: "何かお手伝いできますか？",
    Error: "エラーが発生しました。後でもう一度試してください",
    Prompt: {
      History: (content: string) =>
        "これは前提としての履歴チャットの要約です：" + content,
      Topic:
        "この文の簡潔なテーマを四から五文字で返してください。説明、句読点、感嘆詞、余計なテキストは不要です。太字も不要です。テーマがない場合は「雑談」と返してください",
      Summarize:
        "対話の内容を簡潔に要約し、後続のコンテキストプロンプトとして使用します。200文字以内に抑えてください",
    },
  },
  Copy: {
    Success: "クリップボードに書き込みました",
    Failed: "コピーに失敗しました。クリップボードの権限を付与してください",
  },
  Download: {
    Success: "内容がダウンロードされました",
    Failed: "ダウンロードに失敗しました",
  },
  Context: {
    Toast: (x: any) => `${x} 件のプリセットプロンプトが含まれています`,
    Edit: "現在の対話設定",
    Add: "対話を追加",
    Clear: "コンテキストがクリアされました",
    Revert: "コンテキストを元に戻す",
  },

  ChatSettings: {
    Name: "会話設定",
  },
  Mcp: {
    Name: "MCP",
  },
  FineTuned: {
    Sysmessage: "あなたはアシスタントです",
  },
  SearchChat: {
    Name: "検索",
    Page: {
      Title: "チャット履歴を検索",
      Search: "検索キーワードを入力",
      NoResult: "結果が見つかりませんでした",
      NoData: "データがありません",
      Loading: "読み込み中",

      SubTitle: (count: number) => `${count} 件の結果が見つかりました`,
    },
    Item: {
      View: "表示",
    },
  },
  Mask: {
    Name: "アシスタント",
    DefaultName: "デフォルトアシスタント",
    Management: "アシスタント管理",
    NewMask: "新しいアシスタント",
    DefaultModel: "デフォルトモデル",
    DefaultModelDesc: "新しい会話用のデフォルトモデル",
    UseGlobalModel: "グローバルデフォルトモデルを使用",
    ConversationCount: (count: number) => `${count} 会話`,
    Page: {
      Title: "プリセットキャラクターアシスタント",
      SubTitle: (count: number) => `${count} 件のプリセットキャラクター定義`,
      Search: "キャラクターアシスタントを検索",
      Create: "新規作成",
    },
    Item: {
      Info: (count: number) => `${count} 件のプリセット会話が含まれています`,
      Chat: "会話",
      View: "表示",
      Edit: "編集",
      Delete: "削除",
      DeleteConfirm: "削除してもよろしいですか？",
    },
    EditModal: {
      Title: "プリセットアシスタントを編集",
      Download: "プリセットをダウンロード",
      Clone: "プリセットをクローン",
    },
    Config: {
      Avatar: "キャラクターアバター",
      Name: "キャラクター名",
      Sync: {
        Title: "グローバル設定を使用",
        SubTitle: "現在の会話でグローバルモデル設定を使用するかどうか",
        Confirm:
          "現在の会話のカスタム設定が自動的に上書きされます。グローバル設定を有効にしてもよろしいですか？",
      },
      HideContext: {
        Title: "プリセット会話を非表示",
        SubTitle:
          "非表示にすると、プリセット会話はチャット画面に表示されません",
      },
      Artifacts: {
        Title: "アーティファクトを有効化",
        SubTitle: "有効にすると、HTMLページを直接レンダリングできます",
      },
      CodeFold: {
        Title: "コード折りたたみを有効化",
        SubTitle:
          "有効にすると、長いコードブロックを自動的に折りたたむ/展開できます",
      },
      Share: {
        Title: "このアシスタントを共有",
        SubTitle: "このアシスタントの直接リンクを生成",
        Action: "リンクをコピー",
      },
    },
  },
  NewChat: {
    Return: "戻る",
    Skip: "直接開始",
    Title: "アシスタントを選択",
    SubTitle: "今すぐ始めて、アシスタントの背後にある思考との出会いを体験",
    More: "すべて表示",
    Less: "コードを折りたたむ",
    ShowCode: "コードを表示",
    Preview: "プレビュー",
    NotShow: "今後表示しない",
    ConfirmNoShow:
      "無効にしてもよろしいですか？無効にした後、設定でいつでも再度有効にできます。",
    Searching: "検索中...",
    Search: "検索",
    NoSearch: "検索結果がありません",
    SearchFormat: (SearchTime?: number) =>
      SearchTime !== undefined
        ? `（検索に${Math.round(SearchTime / 1000)}秒かかりました）`
        : "",
    Thinking: "思考中...",
    Think: "思考内容",
    NoThink: "思考内容がありません",
    ThinkFormat: (thinkingTime?: number) =>
      thinkingTime !== undefined
        ? `（思考に${Math.round(thinkingTime / 1000)}秒かかりました）`
        : "",
  },

  URLCommand: {
    Code: "リンクにアクセスコードが含まれています。自動入力しますか？",
    Settings: "リンクにプリセット設定が含まれています。自動入力しますか？",
  },

  UI: {
    Confirm: "確認",
    Cancel: "キャンセル",
    Close: "閉じる",
    Create: "新規作成",
    Edit: "編集",
    Export: "エクスポート",
    Import: "インポート",
    Sync: "同期",
    Config: "設定",
  },
  Exporter: {
    Description: {
      Title: "コンテキストをクリアした後のメッセージのみが表示されます",
    },
    Model: "モデル",
    Messages: "メッセージ",
    Topic: "トピック",
    Time: "時間",
  },
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type LocaleType = typeof jp;
export type PartialLocaleType = DeepPartial<typeof jp>;

export default jp;
