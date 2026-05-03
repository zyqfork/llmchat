import { getClientConfig } from "../config/client";
import { SubmitKey } from "../store/config";
import { SAAS_CHAT_UTM_URL } from "@/app/constant";

const isApp = !!getClientConfig()?.isApp;

const cn = {
  WIP: "该功能仍在开发中……",
  Error: {
    Unauthorized: isApp
      ? `😆 对话遇到了一些问题，不用慌:
       \\ 1️⃣ 查看项目文档，[点击这里访问 GitHub 🚀](${SAAS_CHAT_UTM_URL})
       \\ 2️⃣ 如果你想消耗自己的 OpenAI 资源，点击[这里](/#/settings)修改设置 ⚙️`
      : `😆 对话遇到了一些问题，不用慌:
       \ 1️⃣ 查看项目文档，[点击这里访问 GitHub 🚀](${SAAS_CHAT_UTM_URL})
       \ 2️⃣ 如果你正在使用私有部署版本，点击[这里](/#/auth)输入访问秘钥 🔑
       \ 3️⃣ 如果你想消耗自己的 OpenAI 资源，点击[这里](/#/settings)修改设置 ⚙️
       `,
  },
  Auth: {
    Return: "返回",
    Title: "需要密码",
    Tips: "管理员开启了密码验证，请在下方填入访问码",
    SubTips: "或者输入你的 OpenAI 或 Google AI 密钥",
    Input: "在此处填写访问码",
    Confirm: "确认",
    Later: "稍后再说",
    SaasTips: "",
    TopTips: "",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} 条对话`,
  },
  Chat: {
    MultiModel: {
      Title: "多模型对话设置",
      Enabled: "多模型 (开启)",
      Disabled: "多模型 (关闭)",
      Count: (count: number) => `${count}个`,
      Models: "模型",
      Description:
        "🎯 多模型对话竞技场模式已启用！点击模型选择器可选择多个模型进行对话。",
      OpenSelector: "打开模型选择器",
      AlreadySelected: (count: number) => `(${count} 个已选择)`,
      Tips: "💡 提示：在多模型模式下，您可以同时选择多个模型，每个模型都会独立回复您的消息，方便对比不同模型的回答效果。",
      EnableToast:
        "🎯 多模型模式已开启！点击模型选择器可选择多个模型进行对话竞技场",
      DisableToast: "多模型模式已关闭",
      MinimumModelsError: "请至少选择2个模型才能启用多模型对话",
      ModelsSelectedToast: (count: number) => `已选择 ${count} 个模型进行对话`,
    },
    UI: {
      SidebarToggle: "折叠/展开侧边栏",
      SearchModels: "搜索模型...",
      SelectModel: "选择模型",
      ContextTooltip: {
        Current: (current: number, max: number) =>
          `当前上下文: ${current} / ${max}`,
        CurrentTokens: (current: number, max: number) =>
          `当前Token: ${current.toLocaleString()} / ${max.toLocaleString()}`,
        CurrentTokensUnknown: (current: number) =>
          `当前Token: ${current.toLocaleString()} / 未知`,
        EstimatedTokens: (estimated: number) =>
          `预估Token: ${estimated.toLocaleString()}`,
        ContextTokens: (tokens: string) => `上下文: ${tokens} tokens`,
      },
    },
    SubTitle: (count: number) => `共 ${count} 条对话`,
    EditMessage: {
      Title: "编辑消息记录",
      Topic: {
        Title: "聊天主题",
        SubTitle: "更改当前聊天主题",
      },
    },
    Actions: {
      ChatList: "查看消息列表",
      CompressedHistory: "查看压缩后的历史 Prompt",
      Export: "导出聊天记录",
      Copy: "复制",
      Stop: "停止",
      Retry: "重试",
      Pin: "固定",
      PinToastContent: "已将 1 条对话固定至预设提示词",
      PinToastAction: "查看",
      Delete: "删除",
      Edit: "编辑",
      FullScreen: "全屏",
      RefreshTitle: "刷新标题",
      CompressNow: "压缩上下文",
      CompressToast: "上下文已压缩",
      RefreshToast: "已发送刷新标题请求",
      Speech: "朗读",
      StopSpeech: "停止",
      PreviousVersion: "上一版本",
      NextVersion: "下一版本",
      Debug: "调试",
      CopyAsCurl: "复制为 cURL",
    },
    Commands: {
      new: "新建聊天",
      newm: "从助手新建聊天",
      next: "下一个聊天",
      prev: "上一个聊天",
      clear: "清除上下文",
      fork: "复制聊天",
      del: "删除聊天",
    },
    InputActions: {
      Stop: "停止响应",
      ToBottom: "滚到最新",
      Theme: {
        auto: "自动主题",
        light: "亮色模式",
        dark: "深色模式",
      },
      Prompt: "快捷指令",
      Masks: "所有助手",
      Clear: "清除聊天",
      Optimize: "优化提示词",
      OptimizeToast: "✨ 正在优化您的提示词...",
      OptimizeSuccess: "✅ 提示词已优化",
      OptimizeError: "❌ 优化失败，请重试",
      Reset: "重置聊天",
      ResetConfirm: "确认重置当前聊天窗口的所有内容？",
      Settings: "对话设置",
      UploadImage: "上传图片",
      Search: "搜索功能",
      SearchOn: "搜索已启用",
      SearchOff: "搜索已禁用",
      SearchEnabledToast: "🔍 搜索功能已启用！现在可以进行网络搜索了",
      SearchDisabledToast: "❌ 搜索功能已禁用",
    },
    MCP: {
      Title: "MCP 工具控制",
      Enable: "启用 MCP 功能",
      EnableDesc: "开启后可使用 MCP 工具，关闭后不会发送任何 MCP 相关提示词",
      NoTools: "暂无可用的 MCP 工具",
      Loading: "加载中...",
      ClientFailed: "MCP 客户端加载失败，静默处理",
      ToolsCount: (count: number) => `${count} 个工具`,
    },
    NoModelConfigured: "尚未配置任何可用模型，请先前往设置配置模型",
    GoToSettings: "前往配置",
    Rename: "重命名对话",
    Typing: "正在输入…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} 发送`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "，Shift + Enter 换行";
      }
      return inputHints + "，/ 触发补全，: 触发命令";
    },
    Send: "发送",
    TokenUsage: "使用率",
    TokenTooltip: {
      Context: "当前上下文",
      CurrentToken: "当前Token",
      EstimatedToken: "预估Token",
      Unknown: "未知",
    },
    StartSpeak: "说话",
    StopSpeak: "停止",
    Config: {
      Reset: "清除记忆",
      SaveAs: "存为助手",
    },
    IsContext: "预设提示词",
    ShortcutKey: {
      Title: "键盘快捷方式",
      newChat: "打开新聊天",
      focusInput: "聚焦输入框",
      copyLastMessage: "复制最后一个回复",
      copyLastCode: "复制最后一个代码块",
      showShortcutKey: "显示快捷方式",
      clearContext: "清除上下文",
    },
    Thinking: {
      Title: "思考深度",
      Dynamic: "动态思考",
      DynamicDesc: "模型自动决定思考深度",
      Off: "关闭思考",
      OffDesc: "不进行思考过程",
      Light: "轻度思考",
      LightDesc: "1024 tokens",
      Medium: "中度思考",
      MediumDesc: "4096 tokens",
      Deep: "深度思考",
      DeepDesc: "8192 tokens",
      VeryDeep: "极深思考",
      VeryDeepDesc: "16384 tokens",
      Notice: "仅支持 thinkingBudget 的模型可调节思维深度",
      ClaudeNotice: "仅支持 Claude 系列模型可调节思维深度",
      GeminiNotice: "仅支持 Gemini 系列模型可调节思维深度",
      ClaudeLight: "轻度思考",
      ClaudeLightDesc: "5000 tokens",
      ClaudeMedium: "中度思考",
      ClaudeMediumDesc: "10000 tokens",
      ClaudeDeep: "深度思考",
      ClaudeDeepDesc: "20000 tokens",
      ClaudeVeryDeep: "极深思考",
      ClaudeVeryDeepDesc: "32000 tokens",
      ClaudeDynamicDesc: "自动调节思考深度（默认10000 tokens）",
    },
    ProviderTooltip: {
      Provider: "厂商",
      Source: "配置来源",
      Frontend: "前端配置",
      Server: "服务器配置",
      BaseUrl: "API地址",
      ApiVersion: "API版本",
      ApiKey: "API密钥",
      NoConfig: "未配置",
      ClickToConfig: "点击跳转到配置页面",
    },
  },
  Export: {
    Title: "分享聊天记录",
    Copy: "全部复制",
    Download: "下载文件",
    DownloadPdf: "导出 PDF",
    Share: "打印聊天记录",
    MessageFromYou: "用户",
    MessageFromChatGPT: "ChatGPT",
    Format: {
      Title: "导出格式",
      SubTitle: "可导出 Markdown、PNG 图片；预览中可另存为 PDF",
    },
    IncludeContext: {
      Title: "包含助手上下文",
      SubTitle: "是否在消息中展示助手上下文",
    },
    Steps: {
      Select: "选取",
      Preview: "预览",
    },
    Image: {
      Toast: "正在生成截图",
      ToastPdf: "正在生成 PDF",
      Modal: "长按或右键保存图片",
    },
    Artifacts: {
      Title: "打印页面",
      Error: "打印失败",
    },
  },
  Select: {
    Search: "搜索消息",
    All: "选取全部",
    Latest: "最近几条",
    Clear: "清除选中",
  },
  Memory: {
    Title: "历史摘要",
    EmptyContent: "对话内容过短，无需总结",
    Send: "自动压缩聊天记录并作为上下文发送",
    Copy: "复制摘要",
    Reset: "[unused]",
    ResetConfirm: "确认清空历史摘要？",
  },
  Home: {
    NewChat: "新的聊天",
    DeleteChat: "确认删除选中的对话？",
    DeleteAllChats: "确认关闭所有会话？此操作不可撤销。",
    DeleteToast: "已删除会话",
    DeleteAllToast: "已关闭所有会话",
    DeletePinnedChat: "无法删除已钉选的对话，请先取消钉选",
    Revert: "撤销",
  },
  Settings: {
    Title: "设置",
    SubTitle: "所有设置选项",
    ShowPassword: "显示密码",

    Tab: {
      General: "通用配置",
      Sync: "云同步",
      Mask: "助手",
      Prompt: "提示词",
      ModelService: "模型服务",
      ModelConfig: "模型配置",
      Voice: "语音",
    },

    Danger: {
      Reset: {
        Title: "重置所有设置",
        SubTitle: "重置所有设置项回默认值",
        Action: "立即重置",
        Confirm: "确认重置所有设置？",
      },
      Clear: {
        Title: "清除所有数据",
        SubTitle: "清除所有聊天、设置数据",
        Action: "立即清除",
        Confirm: "确认清除所有聊天、设置数据？",
      },
    },
    Lang: {
      Name: "Language", // 注意：如果要添加新的翻译，请不要翻译此值，将它保留为 `Language`
      All: "所有语言",
    },
    Avatar: "头像设置",
    AvatarTip: {
      User: "用户头像",
      System: "System 头像",
      Assistant: "Assistant 头像",
    },
    FontSize: {
      Title: "字体大小",
      SubTitle: "聊天内容的字体大小",
    },
    FontFamily: {
      Title: "聊天字体",
      SubTitle: "聊天内容的字体，若置空则应用全局默认字体",
      Placeholder: "字体名称",
    },
    InjectSystemPrompts: {
      Title: "注入系统级提示信息",
      SubTitle: "强制给每次请求的消息列表开头添加一个模拟 ChatGPT 的系统提示",
    },
    InputTemplate: {
      Title: "用户输入预处理",
      SubTitle: "用户最新的一条消息会填充到此模板",
    },

    Update: {
      Version: (x: string) => `当前版本：${x}`,
      IsLatest: "已是最新版本",
      CheckUpdate: "检查更新",
      IsChecking: "正在检查更新...",
      FoundUpdate: (x: string) => `发现新版本：${x}`,
      GoToUpdate: "前往更新",
      Success: "更新成功！",
      Failed: "更新失败",
    },
    SendKey: "发送键",
    Theme: "主题",
    ColorScheme: {
      Title: "配色方案",
      Options: {
        default: "默认蓝调",
        ocean: "海洋蓝绿",
        forest: "森林绿",
        sunset: "日落橙红",
        purple: "紫色梦幻",
        rose: "玫瑰粉",
      },
    },
    TightBorder: "无边框模式",
    SendPreviewBubble: {
      Title: "预览气泡",
      SubTitle: "在预览气泡中预览 Markdown 内容",
    },
    AutoGenerateTitle: {
      Title: "自动生成标题",
      SubTitle: "根据对话内容生成合适的标题",
    },
    Sync: {
      CloudState: "云端配置",
      NotSyncYet: "还没有进行过同步",
      Success: "同步成功",
      Fail: "同步失败",

      Config: {
        Modal: {
          Title: "配置云同步",
          Check: "检测",
        },
        SyncType: {
          Title: "同步类型",
          SubTitle: "选择喜爱的同步服务器",
        },
        Proxy: {
          Title: "启用代理",
          SubTitle: "在浏览器中同步时，必须启用代理以避免跨域限制",
        },
        ProxyUrl: {
          Title: "代理地址",
          SubTitle: "仅适用于本项目自带的跨域代理",
        },

        SyncChat: {
          Title: "同步聊天",
          SubTitle: "同步所有聊天记录（加密存储）",
        },

        AutoSync: {
          Title: "自动同步",
          SubTitle: "发送消息后自动同步聊天数据到云端",
        },

        SyncConfig: {
          Title: "同步配置",
          SubTitle: "同步模型服务、助手、提示词等配置数据（加密存储）",
        },

        Encryption: {
          Title: "加密密码",
          SubTitle: "设置配置数据的加密密码，留空使用默认加密",
          Placeholder: "输入加密密码",
        },

        WebDav: {
          Endpoint: "WebDAV 地址",
          UserName: "用户名",
          Password: "密码",
          BackupName: "备份名称",
        },

        UpStash: {
          Endpoint: "UpStash Redis REST Url",
          UserName: "备份名称",
          Password: "UpStash Redis REST Token",
        },

        GitHub: {
          Token: "GitHub Personal Access Token",
          Repo: "仓库 (格式: owner/repo)",
          Branch: "分支",
          Path: "存储路径 (可选)",
          UserName: "备份名称",
        },

        S3: {
          Endpoint: "S3 端点地址",
          Bucket: "存储桶名称",
          AccessKey: "Access Key ID",
          SecretKey: "Secret Access Key",
          Region: "区域",
          UserName: "备份名称",
        },
      },

      LocalState: "本地数据",
      Overview: (overview: any) => {
        return `${overview.chat} 次对话，${overview.message} 条消息，${overview.prompt} 条提示词，${overview.mask} 个助手`;
      },
      ImportFailed: "导入失败",
      DecryptFailed: "解密失败，请检查加密密码是否正确",
      Upload: "上传",
      Download: "下载",
      UploadSuccess: "上传成功",
      UploadFailed: "上传失败",
      DownloadSuccess: "下载成功，即将刷新页面",
      DownloadFailed: "下载失败",
      EmptyRemote: "云端数据为空",
      ChatData: "聊天数据",
      ConfigData: "配置数据",
      ConfigDataDesc: "包含模型服务、模型配置、语音配置、助手、提示词等",
      AutoSync: "自动同步",
      CheckSuccess: "连接成功",
      CheckFailed: "连接失败",
    },
    Mask: {
      ModelIcon: {
        Title: "使用模型图标作为AI头像",
        SubTitle: "启用后，对话中的AI头像将使用当前模型的图标，而不是表情符号",
      },
    },
    AccessCode: {
      Title: "访问码",
      SubTitle: "当前系统启用了访问控制，请输入访问码",
      Placeholder: "请输入访问码",
      Status: {
        Enabled: "访问控制已启用",
        Valid: "访问码有效",
        Invalid: "访问码无效",
      },
    },
    Prompt: {
      Disable: {
        Title: "禁用提示词自动补全",
        SubTitle: "在输入框开头输入 / 即可触发自动补全",
      },
      List: "自定义提示词列表",
      ListCount: (builtin: number, custom: number) =>
        `内置 ${builtin} 条，用户定义 ${custom} 条`,
      Edit: "编辑",
      Modal: {
        Title: "提示词列表",
        Add: "新建",
        Search: "搜索提示词",
      },
      EditModal: {
        Title: "编辑提示词",
      },
      SystemPrompts: {
        Title: "系统提示词",
        SubTitle: "管理内置系统提示词",
        OptimizeModel: {
          Title: "内容优化提示词",
          SubTitle: "用于优化用户输入内容的提示词",
        },
        Topic: {
          Title: "标题生成提示词",
          SubTitle: "用于自动生成对话标题的提示词",
        },
        Summarize: {
          Title: "上下文压缩提示词",
          SubTitle: "用于配置上下文压缩提示词模板",
          Defaults: {
            SystemPrompt: `你是一个上下文总结助手。你的任务是阅读用户与 AI 助手之间的对话，并按指定格式输出结构化总结。

不要继续对话。不要回答对话里的问题。只输出结构化总结。`,
            InitialPrompt: `以上消息是一段需要总结的对话。请生成一份结构化上下文检查点总结，供另一个 LLM 继续工作。

请严格使用以下格式：

## Goal
[用户想要达成的目标；若会话包含多个任务，可列多个]

## Constraints & Preferences
- [用户提到的约束、偏好或要求]
- [若无则写 "(none)"]

## Progress
### Done
- [x] [已完成的任务/改动]

### In Progress
- [ ] [正在进行中的工作]

### Blocked
- [当前阻塞问题；若无可留空]

## Key Decisions
- **[决策]**: [简要原因]

## Next Steps
1. [按顺序列出下一步]

## Critical Context
- [继续工作所需的数据、示例、引用]
- [若无则写 "(none)"]

内容请保持精炼。务必保留精确的文件路径、函数名和错误信息。`,
            UpdatePrompt: `以上消息是需要并入 <previous-summary> 既有总结中的新增对话内容。

请基于新消息更新既有结构化总结，规则：
- 保留既有总结中的有效信息
- 增加新的进展、决策与关键上下文
- 更新 Progress：已完成项移到 "Done"，当前任务放在 "In Progress"
- 根据最新进展更新 "Next Steps"
- 保留精确的文件路径、函数名和错误信息
- 若信息已失效可移除

请严格使用以下格式：

## Goal
[保留既有目标，若任务扩展则补充]

## Constraints & Preferences
- [保留既有约束并补充新增约束]

## Progress
### Done
- [x] [包含既有已完成项和新完成项]

### In Progress
- [ ] [根据最新进展更新]

### Blocked
- [当前阻塞；若已解除可移除]

## Key Decisions
- **[决策]**: [简要原因]（保留既有并补充新增）

## Next Steps
1. [按当前状态更新]

## Critical Context
- [保留关键上下文并补充新增信息]

内容请保持精炼。务必保留精确的文件路径、函数名和错误信息。`,
          },
        },
      },
    },
    HistoryCount: {
      Title: "附带历史消息数",
      SubTitle: "每次请求携带的历史消息数",
    },
    AutoTitleMinUserTokens: {
      Title: "标题生成最小用户 Tokens",
      SubTitle: "触发自动标题生成的用户发言最小 Token 数",
    },
    AutoTitleMinUserMessages: {
      Title: "标题生成最小用户消息数",
      SubTitle: "触发自动标题生成的最少用户消息数",
    },
    AutoTitleRefreshInterval: {
      Title: "标题更新间隔（用户消息）",
      SubTitle: "每新增多少条用户消息后更新标题",
    },
    CompressThreshold: {
      Title: "固定压缩阈值",
      SubTitle: "当未压缩的历史消息超过该固定值时触发压缩（独立条件）",
    },
    CompressThresholdRatio: {
      Title: "动态压缩阈值比例",
      SubTitle: "基于模型上下文窗口计算动态阈值（独立条件，10%-90%）",
    },
    SummaryMinUserMessages: {
      Title: "压缩最小用户消息数",
      SubTitle: "满足该数量后才会触发语义状态压缩",
    },

    Access: {
      SaasStart: {
        Title: "",
        Label: "",
        SubTitle: "",
        ChatNow: "",
      },
      AccessCode: {
        Title: "访问密码",
        SubTitle: "管理员已开启加密访问",
        Placeholder: "请输入访问密码",
      },
      CustomEndpoint: {
        Title: "自定义接口",
        SubTitle: "是否使用自定义 Azure 或 OpenAI 服务",
      },
      Provider: {
        Title: "模型服务商",
        SubTitle: "切换不同的服务商",
        Name: {
          ByteDance: "字节跳动",
          Alibaba: "阿里云",
          Moonshot: "月之暗面",
        },
        Status: {
          Enabled: "已启用",
        },
        Models: {
          Title: "启用的模型",
          SubTitle: "当前服务商中已启用的模型列表",
          NoModels: "暂无启用的模型",
          Manage: "管理",
        },
        Description: {
          OpenAI: "OpenAI GPT 系列模型",
          Azure: "微软 Azure OpenAI 服务",
          Google: "Google Gemini 系列模型",
          Anthropic: "Anthropic Claude 系列模型",
          ByteDance: "字节跳动豆包系列模型",
          Alibaba: "阿里云通义千问系列模型",
          Moonshot: "Moonshot Kimi 系列模型",
          DeepSeek: "DeepSeek 系列模型",
          XAI: "xAI Grok 系列模型",
          SiliconFlow: "SiliconFlow 硅基流动",
          Ollama: "Ollama 本地模型服务",
          Custom: "自定义",
        },
        Terms: {
          Provider: "服务商",
        },
      },
      OpenAI: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "使用自定义 OpenAI Key 绕过密码访问限制",
          Placeholder: "OpenAI API Key",
        },

        Endpoint: {
          Title: "基础路径 (Base Path)",
          SubTitle: "包含协议、域名和端口，如 https://api.openai.com",
        },

        ApiType: {
          Title: "API 类型",
          SubTitle: "选择使用的 API 类型",
          Chat: "Chat Completions API",
          Response: "Response API",
        },

        UseResponseApi: {
          Title: "使用 Response API",
          SubTitle: "启用后使用 Response API 进行模型调用",
        },

        ApiPath: {
          Title: "API 路径",
          SubTitle: "API 端点路径，可自定义",
          ChatPlaceholder: "/chat/completions",
          ResponsePlaceholder: "/responses",
        },

        UseProxy: {
          Title: "启用代理",
          SubTitle: "在 standalone 模式下通过服务端代理发起请求",
        },

        ProxyUrl: {
          Title: "代理地址",
          SubTitle: "代理服务器地址，默认使用 localhost",
        },
      },
      Azure: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "使用自定义 Azure Key 绕过密码访问限制",
          Placeholder: "Azure API Key",
        },

        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },

        ApiVerion: {
          Title: "接口版本 (azure api version)",
          SubTitle: "选择指定的部分版本",
        },

        UseProxy: {
          Title: "启用代理",
          SubTitle: "在 standalone 模式下通过服务端代理发起请求",
        },

        ProxyUrl: {
          Title: "代理地址",
          SubTitle: "代理服务器地址，默认使用 localhost",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "使用自定义 Anthropic Key 绕过密码访问限制",
          Placeholder: "Anthropic API Key",
        },

        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },

        ApiVerion: {
          Title: "接口版本 (claude api version)",
          SubTitle: "选择一个特定的 API 版本输入",
        },

        UseProxy: {
          Title: "启用代理",
          SubTitle: "在 standalone 模式下通过服务端代理发起请求",
        },

        ProxyUrl: {
          Title: "代理地址",
          SubTitle: "代理服务器地址，默认使用 localhost",
        },
      },
      Google: {
        ApiKey: {
          Title: "API 密钥",
          SubTitle: "从 Google AI 获取您的 API 密钥",
          Placeholder: "Google AI API KEY",
        },

        Endpoint: {
          Title: "接口地址",
          SubTitle: "示例：",
        },

        ApiVersion: {
          Title: "API 版本（仅适用于 gemini-pro）",
          SubTitle: "选择一个特定的 API 版本",
        },
        GoogleSafetySettings: {
          Title: "Google 安全过滤级别",
          SubTitle: "设置内容过滤级别",
        },

        UseProxy: {
          Title: "启用代理",
          SubTitle: "在 standalone 模式下通过服务端代理发起请求",
        },

        ProxyUrl: {
          Title: "代理地址",
          SubTitle: "代理服务器地址，默认使用 localhost",
        },
      },
      Baidu: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "使用自定义 Baidu API Key",
          Placeholder: "Baidu API Key",
        },
        SecretKey: {
          Title: "Secret Key",
          SubTitle: "使用自定义 Baidu Secret Key",
          Placeholder: "Baidu Secret Key",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "不支持自定义前往.env配置",
        },
      },
      Tencent: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "使用自定义腾讯云API Key",
          Placeholder: "Tencent API Key",
        },
        SecretKey: {
          Title: "Secret Key",
          SubTitle: "使用自定义腾讯云Secret Key",
          Placeholder: "Tencent Secret Key",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "不支持自定义前往.env配置",
        },
      },
      ByteDance: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "使用自定义 ByteDance API Key",
          Placeholder: "ByteDance API Key",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },

        UseProxy: {
          Title: "启用代理",
          SubTitle: "在 standalone 模式下通过服务端代理发起请求",
        },

        ProxyUrl: {
          Title: "代理地址",
          SubTitle: "代理服务器地址，默认使用 localhost",
        },
      },
      Alibaba: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "使用自定义阿里云API Key",
          Placeholder: "Alibaba Cloud API Key",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },

        UseProxy: {
          Title: "启用代理",
          SubTitle: "在 standalone 模式下通过服务端代理发起请求",
        },

        ProxyUrl: {
          Title: "代理地址",
          SubTitle: "代理服务器地址，默认使用 localhost",
        },
      },
      Moonshot: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "使用自定义月之暗面API Key",
          Placeholder: "Moonshot API Key",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },

        UseProxy: {
          Title: "启用代理",
          SubTitle: "在 standalone 模式下通过服务端代理发起请求",
        },

        ProxyUrl: {
          Title: "代理地址",
          SubTitle: "代理服务器地址，默认使用 localhost",
        },
      },
      DeepSeek: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "使用自定义DeepSeek API Key",
          Placeholder: "DeepSeek API Key",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },

        UseProxy: {
          Title: "启用代理",
          SubTitle: "在 standalone 模式下通过服务端代理发起请求",
        },

        ProxyUrl: {
          Title: "代理地址",
          SubTitle: "代理服务器地址，默认使用 localhost",
        },
      },
      XAI: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "使用自定义XAI API Key",
          Placeholder: "XAI API Key",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },

        UseProxy: {
          Title: "启用代理",
          SubTitle: "在 standalone 模式下通过服务端代理发起请求",
        },

        ProxyUrl: {
          Title: "代理地址",
          SubTitle: "代理服务器地址，默认使用 localhost",
        },
      },
      ChatGLM: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "使用自定义 ChatGLM API Key",
          Placeholder: "ChatGLM API Key",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },
      },
      SiliconFlow: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "使用自定义硅基流动 API Key",
          Placeholder: "硅基流动 API Key",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },

        UseProxy: {
          Title: "启用代理",
          SubTitle: "在 standalone 模式下通过服务端代理发起请求",
        },

        ProxyUrl: {
          Title: "代理地址",
          SubTitle: "代理服务器地址，默认使用 localhost",
        },
      },

      Ollama: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "Ollama 通常不需要 API Key",
          Placeholder: "可选",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },

        UseProxy: {
          Title: "启用代理",
          SubTitle: "在 standalone 模式下通过服务端代理发起请求",
        },

        ProxyUrl: {
          Title: "代理地址",
          SubTitle: "代理服务器地址，默认使用 localhost",
        },
      },

      Iflytek: {
        ApiKey: {
          Title: "ApiKey",
          SubTitle: "从讯飞星火控制台获取的 APIKey",
          Placeholder: "APIKey",
        },
        ApiSecret: {
          Title: "ApiSecret",
          SubTitle: "从讯飞星火控制台获取的 APISecret",
          Placeholder: "APISecret",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },
      },
      CustomModel: {
        Title: "自定义模型名",
        SubTitle: "增加自定义模型可选项，使用英文逗号隔开",
      },
      AI302: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "使用自定义302.AI API Key",
          Placeholder: "302.AI API Key",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },
      },
      CustomProvider: {
        Add: {
          Title: "添加自定义服务商",
          Button: "添加自定义服务商",
          Description: "基于现有服务商类型添加自定义渠道",
        },
        Modal: {
          Title: "添加自定义服务商",
          Name: {
            Title: "服务商名称",
            Placeholder: "请输入自定义服务商名称",
            Required: "请输入服务商名称",
            Unique: "服务商名称已存在，请使用其他名称",
          },
          Type: {
            Title: "服务商类型",
            OpenAI: "OpenAI Compatible API",
            Google: "Google Gemini API",
            Anthropic: "Anthropic Claude API",
          },
          ApiKey: {
            Title: "API Key",
            Placeholder: "请输入 API Key",
            Required: "请输入 API Key",
          },
          Endpoint: {
            Title: "自定义端点",
            Placeholder: "留空使用默认端点",
            Optional: "(可选)",
          },
          Cancel: "取消",
          Confirm: "添加",
        },
        Config: {
          Type: "服务商类型",
          BasedOn: "基于",
          ApiKeyDescription: "自定义服务商的 API 密钥",
          EndpointDescription: "自定义的 API 端点地址",
          EndpointPlaceholder: "API 端点地址",
          Delete: {
            Title: "删除服务商",
            SubTitle: "删除此自定义服务商及其所有配置",
            Button: "删除",
            Confirm: "确定要删除自定义服务商",
            ConfirmSuffix: "吗？",
          },
        },
      },
    },

    Model: "模型 (model)",
    CompressModel: {
      Title: "对话摘要模型",
      SubTitle: "用于压缩历史记录、生成对话标题的模型",
    },
    OptimizeModel: {
      Title: "内容优化模型",
      SubTitle: "用于优化用户输入内容的模型，如未配置则使用当前聊天模型",
      Prompt: {
        Title: "内容优化提示词",
        SubTitle: "自定义内容优化模型的系统提示词，留空使用默认提示词",
        Placeholder:
          "优化用户输入内容，修正语法错误，使表达更清晰专业，保持原意不变。只返回优化后的文本，不要添加任何解释或注释。",
      },
    },
    Temperature: {
      Title: "随机性 (temperature)",
      SubTitle: "值越大，回复越随机",
    },
    TopP: {
      Title: "核采样 (top_p)",
      SubTitle: "与随机性类似，但不要和随机性一起更改",
    },
    MaxTokens: {
      Title: "单次回复限制 (max_tokens)",
      SubTitle: "单次交互所用的最大 Token 数",
    },
    PresencePenalty: {
      Title: "话题新鲜度 (presence_penalty)",
      SubTitle: "值越大，越有可能扩展到新话题",
    },
    FrequencyPenalty: {
      Title: "频率惩罚度 (frequency_penalty)",
      SubTitle: "值越大，越有可能降低重复字词",
    },
    TTS: {
      Enable: {
        Title: "启用文本转语音",
        SubTitle: "启用文本生成语音服务",
      },
      Autoplay: {
        Title: "启用自动朗读",
        SubTitle: "自动生成语音并播放，需先开启文本转语音开关",
      },
      Model: "模型",
      Engine: "转换引擎",
      EngineConfig: {
        Title: "配置说明",
        SubTitle:
          "OpenAI-TTS 将使用模型服务中 OpenAI 提供商的配置，使用前需要在 OpenAI 提供商中添加对应的 API Key",
      },
      Voice: {
        Title: "声音",
        SubTitle: "生成语音时使用的声音",
      },
      Speed: {
        Title: "速度",
        SubTitle: "生成语音的速度",
      },
    },
    Realtime: {
      Enable: {
        Title: "实时聊天",
        SubTitle: "开启实时聊天功能",
      },
      Provider: {
        Title: "模型服务商",
        SubTitle: "切换不同的服务商",
      },
      Model: {
        Title: "模型",
        SubTitle: "选择一个模型",
      },
      ApiKey: {
        Title: "API Key",
        SubTitle: "API Key",
        Placeholder: "API Key",
      },
      Azure: {
        Endpoint: {
          Title: "接口地址",
          SubTitle: "接口地址",
        },
        Deployment: {
          Title: "部署名称",
          SubTitle: "部署名称",
        },
      },
      Qwen: {
        Model: {
          Title: "通义千问模型",
          SubTitle: "选择通义千问实时语音模型",
        },
        Voice: {
          Title: "音色",
          SubTitle: "选择通义千问语音音色",
        },
        Region: {
          Title: "地域",
          SubTitle: "选择API服务地域",
          Beijing: "中国内地（北京）",
          Singapore: "国际（新加坡）",
        },
      },
      Temperature: {
        Title: "随机性 (temperature)",
        SubTitle: "值越大，回复越随机",
      },
    },
  },
  Store: {
    DefaultTopic: "新的聊天",
    BotHello: "有什么可以帮你的吗",
    Error: "出错了，稍后重试吧",
    Prompt: {
      History: (content: string) => "当前对话语义状态如下：\n" + content,
      Topic:
        "你是一个对话标题生成器。\n请根据以下对话内容生成简洁标题。\n要求：\n- 4到8个中文字符\n- 只输出标题本身\n- 不要标点\n- 不要解释\n- 不要语气词\n- 不要加引号\n用户对话内容：\n{{user_messages}}\n用户最近确认的助手回复（可为空）：\n{{assistant_message}}",
      Summarize:
        "这是上下文压缩的附加要求提示词，会追加到系统内置的结构化压缩模板末尾（Additional focus）。\n请重点保留：用户目标、约束与偏好、已完成进展、关键决策、下一步计划，以及继续任务所需的关键上下文（如文件路径、函数名、报错信息、关键参数）。\n忽略寒暄和重复内容，输出保持简洁、可续接。",
    },
  },
  Copy: {
    Success: "已写入剪贴板",
    Failed: "复制失败，请赋予剪贴板权限",
  },
  Download: {
    Success: "内容已下载到您的目录。",
    Failed: "下载失败。",
  },
  Context: {
    Toast: (x: any) => `包含 ${x} 条预设提示词`,
    Edit: "当前对话设置",
    Add: "新增一条对话",
    Clear: "上下文已清除",
    Compressing: "上下文压缩中...",
    Compressed: "上下文已压缩",
    CompressedTag: "已压缩",
    Expand: "展开查看",
    Collapse: "收起",
    Revert: "恢复上下文",
  },

  ChatSettings: {
    Name: "对话设置",
  },
  Mcp: {
    Name: "MCP",
  },
  FineTuned: {
    Sysmessage: "你是一个助手",
  },
  SearchChat: {
    Name: "搜索聊天记录",
    Page: {
      Title: "搜索聊天记录",
      Search: "输入搜索关键词",
      NoResult: "没有找到结果",
      NoData: "没有数据",
      Loading: "加载中",

      SubTitle: (count: number) => `搜索到 ${count} 条结果`,
    },
    Item: {
      View: "查看",
    },
  },

  Mask: {
    Name: "助手",
    DefaultName: "默认助手",
    Management: "助手管理",
    NewMask: "新建助手",
    DefaultModel: "默认模型",
    DefaultModelDesc: "新建对话时使用的默认模型",
    UseGlobalModel: "使用全局默认模型",
    ConversationCount: (count: number) => `${count} 个对话`,
    Page: {
      Title: "预设角色助手",
      SubTitle: (count: number) => `${count} 个预设角色定义`,
      Search: "搜索角色助手",
      Create: "新建",
    },
    GroupCustom: "自定义助手",
    GroupBuiltin: "内置助手",
    Item: {
      Info: (count: number) => `包含 ${count} 条预设对话`,
      Chat: "对话",
      View: "查看",
      Edit: "编辑",
      Delete: "删除",
      DeleteConfirm: "确认删除？",
      DeleteDefaultForbidden: "默认助手不能删除",
    },
    EditModal: {
      Title: "编辑助手",
      Download: "下载预设",
      Clone: "克隆预设",
    },
    Config: {
      Avatar: "角色头像",
      Name: "角色名称",
      Sync: {
        Title: "使用全局设置",
        SubTitle: "当前对话是否使用全局模型设置",
        Confirm: "当前对话的自定义设置将会被自动覆盖，确认启用全局设置？",
      },
      HideContext: {
        Title: "隐藏预设对话",
        SubTitle: "隐藏后预设对话不会出现在聊天界面",
      },
      Artifacts: {
        Title: "启用Artifacts",
        SubTitle: "启用之后可以直接渲染HTML页面",
      },
      CodeFold: {
        Title: "启用代码折叠",
        SubTitle: "启用之后可以自动折叠/展开过长的代码块",
      },
      Share: {
        Title: "分享此助手",
        SubTitle: "生成此助手的直达链接",
        Action: "复制链接",
      },
      ReadOnlySync: {
        Title: "只读 · 同步全局配置",
        SubTitle: "以下配置与「设置 - 模型配置」一致，请在设置中修改",
      },
    },
  },
  NewChat: {
    Return: "返回",
    Skip: "直接开始",
    Title: "挑选一个助手",
    SubTitle: "现在开始，与助手背后的灵魂思维碰撞",
    More: "查看全部",
    Less: "折叠代码",
    ShowCode: "显示代码",
    Preview: "预览",
    NotShow: "不再展示",
    ConfirmNoShow: "确认禁用？禁用后可以随时在设置中重新启用。",
    Searching: "搜索中...",
    Search: "搜索内容",
    NoSearch: "没有搜索内容",
    SearchFormat: (SearchTime?: number) =>
      SearchTime !== undefined
        ? `（用时 ${Math.round(SearchTime / 1000)} 秒）`
        : "",
    Thinking: "正在思考中...",
    Think: "思考过程",
    NoThink: "没有思考过程",
    ThinkFormat: (thinkingTime?: number) =>
      thinkingTime !== undefined
        ? `（用时 ${Math.round(thinkingTime / 1000)} 秒）`
        : "",
  },

  URLCommand: {
    Code: "检测到链接中已经包含访问码，是否自动填入？",
    Settings: "检测到链接中包含了预制设置，是否自动填入？",
  },

  UI: {
    Confirm: "确认",
    Cancel: "取消",
    Close: "关闭",
    Create: "新建",
    Edit: "编辑",
    Export: "导出",
    Import: "导入",
    Sync: "同步",
    Config: "配置",
  },
  Exporter: {
    Description: {
      Title: "只有清除上下文之后的消息会被展示",
    },
    Model: "模型",
    Messages: "消息",
    Topic: "主题",
    Time: "时间",
  },
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type LocaleType = typeof cn;
export type PartialLocaleType = DeepPartial<typeof cn>;

export default cn;
