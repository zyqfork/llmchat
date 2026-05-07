import { getClientConfig } from "../config/client";
import { SubmitKey } from "../store/config";
import { LocaleType } from "./index";
import { SAAS_CHAT_UTM_URL } from "@/app/constant";
// if you are adding a new translation, please use PartialLocaleType instead of LocaleType

const isApp = !!getClientConfig()?.isApp;
const en: LocaleType = {
  WIP: "Coming Soon...",
  Error: {
    Unauthorized: isApp
      ? `😆 Oops, there's an issue. No worries:
     \\ 1️⃣ Check project documentation, [Click here to visit GitHub 🚀](${SAAS_CHAT_UTM_URL})
     \\ 2️⃣ Want to use your own OpenAI resources? [Click here](/#/settings) to change settings ⚙️`
      : `😆 Oops, there's an issue. Let's fix it:
     \ 1️⃣ Check project documentation, [Click here to visit GitHub 🚀](${SAAS_CHAT_UTM_URL})
     \ 2️⃣ Using a private setup? [Click here](/#/auth) to enter your key 🔑
     \ 3️⃣ Want to use your own OpenAI resources? [Click here](/#/settings) to change settings ⚙️
     `,
  },
  Auth: {
    Return: "Return",
    Title: "Need Access Code",
    Tips: "Please enter access code below",
    SubTips: "Or enter your OpenAI or Google API Key",
    Input: "access code",
    Confirm: "Confirm",
    Later: "Later",
    SaasTips: "",
    TopTips: "",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} messages`,
  },
  Chat: {
    MultiModel: {
      Title: "Multi-Model Chat Settings",
      Enabled: "Multi-Model (Enabled)",
      Disabled: "Multi-Model (Disabled)",
      Count: (count: number) => `${count} models`,
      Models: "models",
      Description:
        "🎯 Multi-model arena mode enabled! Click model selector to select multiple models for conversation.",
      OpenSelector: "Open Model Selector",
      AlreadySelected: (count: number) => `(${count} selected)`,
      Tips: "💡 Tip: In multi-model mode, you can select multiple models simultaneously, and each model will respond independently to your messages, allowing you to compare different models' responses.",
      EnableToast:
        "🎯 Multi-model mode enabled! Click model selector to select multiple models for conversation arena",
      DisableToast: "Multi-model mode disabled",
      MinimumModelsError:
        "Please select at least 2 models to enable multi-model conversation",
      ModelsSelectedToast: (count: number) =>
        `Selected ${count} models for conversation`,
    },
    UI: {
      SidebarToggle: "Toggle Sidebar",
      SearchModels: "Search models...",
      SelectModel: "Select Model",
      ContextTooltip: {
        Current: (current: number, max: number) =>
          `Current context: ${current} / ${max}`,
        CurrentTokens: (current: number, max: number) =>
          `Current tokens: ${current.toLocaleString()} / ${max.toLocaleString()}`,
        CurrentTokensUnknown: (current: number) =>
          `Current tokens: ${current.toLocaleString()} / Unknown`,
        EstimatedTokens: (estimated: number) =>
          `Estimated tokens: ${estimated.toLocaleString()}`,
        ContextTokens: (tokens: string) => `Context: ${tokens} tokens`,
      },
    },
    SubTitle: (count: number) => `${count} messages`,
    EditMessage: {
      Title: "Edit All Messages",
      Topic: {
        Title: "Topic",
        SubTitle: "Change the current topic",
      },
    },
    Actions: {
      ChatList: "Go To Chat List",
      CompressedHistory: "Compressed History Memory Prompt",
      Export: "Export All Messages as Markdown",
      Copy: "Copy",
      Stop: "Stop",
      Retry: "Retry",
      Pin: "Pin",
      PinToastContent: "Pinned 1 messages to contextual prompts",
      PinToastAction: "View",
      Delete: "Delete",
      Edit: "Edit",
      FullScreen: "FullScreen",
      RefreshTitle: "Refresh Title",
      CompressNow: "Compress Context",
      CompressToast: "Context compressed",
      RefreshToast: "Title refresh request sent",
      Speech: "Play",
      StopSpeech: "Stop",
      PreviousVersion: "Previous Version",
      NextVersion: "Next Version",
      Debug: "Debug",
      CopyAsCurl: "Copy as cURL",
    },
    Commands: {
      new: "Start a new chat",
      newm: "Start a new chat with assistant",
      next: "Next Chat",
      prev: "Previous Chat",
      clear: "Clear Context",
      fork: "Copy Chat",
      del: "Delete Chat",
    },
    InputActions: {
      Stop: "Stop",
      ToBottom: "To Latest",
      Theme: {
        auto: "Auto",
        light: "Light Theme",
        dark: "Dark Theme",
      },
      Prompt: "Prompts",
      Masks: "Assistants",
      Clear: "Clear Context",
      Optimize: "Optimize Prompt",
      OptimizeToast: "✨ Optimizing your prompt...",
      OptimizeSuccess: "✅ Prompt optimized",
      OptimizeError: "❌ Optimization failed, please retry",
      Reset: "Reset Chat",
      ResetConfirm: "Are you sure to reset the current chat window content?",
      Settings: "Settings",
      UploadImage: "Upload Images",
      Search: "Search",
      SearchOn: "Search Enabled",
      SearchOff: "Search Disabled",
      SearchEnabledToast:
        "🔍 Search feature enabled! Web search is now available",
      SearchDisabledToast: "❌ Search feature disabled",
    },
    MCP: {
      Title: "MCP Tool Control",
      Enable: "Enable MCP Features",
      EnableDesc:
        "When enabled, MCP tools can be used. When disabled, no MCP-related prompts will be sent",
      NoTools: "No MCP tools available",
      Loading: "Loading...",
      ClientFailed: "MCP client loading failed, handle silently",
      ToolsCount: (count: number) => `${count} tools`,
    },
    NoModelConfigured:
      "No models configured. Please go to Settings to add a model.",
    GoToSettings: "Go to Settings",
    Rename: "Rename Chat",
    Typing: "Typing…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} to send`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += ", Shift + Enter to wrap";
      }
      return inputHints + ", / to search prompts, : to use commands";
    },
    Send: "Send",
    TokenUsage: "Usage",
    TokenTooltip: {
      Context: "Current Context",
      CurrentToken: "Current Token",
      EstimatedToken: "Estimated Token",
      Unknown: "Unknown",
    },
    StartSpeak: "Start Speak",
    StopSpeak: "Stop Speak",
    Config: {
      Reset: "Reset to Default",
      SaveAs: "Save as Assistant",
    },
    IsContext: "Contextual Prompt",
    ShortcutKey: {
      Title: "Keyboard Shortcuts",
      newChat: "Open New Chat",
      focusInput: "Focus Input Field",
      copyLastMessage: "Copy Last Reply",
      copyLastCode: "Copy Last Code Block",
      showShortcutKey: "Show Shortcuts",
      clearContext: "Clear Context",
    },
    Thinking: {
      Title: "Thinking Depth",
      Dynamic: "Dynamic Thinking",
      DynamicDesc: "Model decides thinking depth automatically",
      Off: "Thinking Off",
      OffDesc: "No thinking process",
      Light: "Light Thinking",
      LightDesc: "1024 tokens",
      Medium: "Medium Thinking",
      MediumDesc: "4096 tokens",
      Deep: "Deep Thinking",
      DeepDesc: "8192 tokens",
      VeryDeep: "Very Deep Thinking",
      VeryDeepDesc: "16384 tokens",
      Notice: "Only models supporting thinkingBudget can adjust thinking depth",
      ClaudeNotice: "Only Claude series models can adjust thinking depth",
      GeminiNotice: "Only Gemini series models can adjust thinking depth",
      ClaudeLight: "Think",
      ClaudeLightDesc: "5000 tokens",
      ClaudeMedium: "Think hard",
      ClaudeMediumDesc: "10000 tokens",
      ClaudeDeep: "Think Harder",
      ClaudeDeepDesc: "20000 tokens",
      ClaudeVeryDeep: "Ultrathink",
      ClaudeVeryDeepDesc: "32000 tokens",
      ClaudeDynamicDesc:
        "Automatically adjust thinking depth (default 10000 tokens)",
    },
    ProviderTooltip: {
      Provider: "Provider",
      Source: "Config Source",
      Frontend: "Frontend Config",
      Server: "Server Config",
      BaseUrl: "Base URL",
      ApiVersion: "API Version",
      ApiKey: "API Key",
      NoConfig: "Not Configured",
      ClickToConfig: "Click to configure",
    },
  },
  Export: {
    Title: "Export Messages",
    Copy: "Copy All",
    Download: "Download",
    DownloadPdf: "Export PDF",
    MessageFromYou: "Message From You",
    MessageFromChatGPT: "Message From ChatGPT",
    Share: "Print Chat History",
    Format: {
      Title: "Export Format",
      SubTitle: "Markdown or PNG Image",
    },
    IncludeContext: {
      Title: "Including Context",
      SubTitle: "Export context prompts in assistant or not",
    },
    Steps: {
      Select: "Select",
      Preview: "Preview",
    },
    Image: {
      Toast: "Capturing Image...",
      ToastPdf: "Generating PDF...",
      Modal: "Long press or right click to save image",
    },
    Artifacts: {
      Title: "Print Artifacts",
      Error: "Print Error",
    },
  },
  Select: {
    Search: "Search",
    All: "Select All",
    Latest: "Select Latest",
    Clear: "Clear",
  },
  Memory: {
    Title: "Memory Prompt",
    EmptyContent: "Nothing yet.",
    Send: "Send Memory",
    Copy: "Copy Memory",
    Reset: "Reset Session",
    ResetConfirm:
      "Resetting will clear the current conversation history and historical memory. Are you sure you want to reset?",
  },
  Home: {
    NewChat: "New Chat",
    DeleteChat: "Confirm to delete the selected conversation?",
    DeleteAllChats:
      "Confirm to close all sessions? This action cannot be undone.",
    DeleteToast: "Chat Deleted",
    DeleteAllToast: "All sessions closed",
    DeletePinnedChat: "Cannot delete pinned chat, please unpin it first",
    Revert: "Revert",
  },
  Settings: {
    Title: "Settings",
    SubTitle: "All Settings",
    ShowPassword: "ShowPassword",

    Tab: {
      General: "General",
      Sync: "Sync",
      Mask: "Assistant",
      Prompt: "Prompts",
      ModelService: "Model Service",
      ModelConfig: "Model Config",
      Voice: "Voice",
    },

    Danger: {
      Reset: {
        Title: "Reset All Settings",
        SubTitle: "Reset all setting items to default",
        Action: "Reset",
        Confirm: "Confirm to reset all settings to default?",
      },
      Clear: {
        Title: "Clear All Data",
        SubTitle: "Clear all messages and settings",
        Action: "Clear",
        Confirm: "Confirm to clear all messages and settings?",
      },
    },
    Lang: {
      Name: "Language", // ATTENTION: if you wanna add a new translation, please do not translate this value, leave it as `Language`
      All: "All Languages",
    },
    Avatar: "Avatar Settings",
    AvatarTip: {
      User: "User Avatar",
      System: "System Avatar",
      Assistant: "Assistant Avatar",
    },
    FontSize: {
      Title: "Font Size",
      SubTitle: "Adjust font size of chat content",
    },
    FontFamily: {
      Title: "Chat Font Family",
      SubTitle:
        "Font Family of the chat content, leave empty to apply global default font",
      Placeholder: "Font Family Name",
    },
    InjectSystemPrompts: {
      Title: "Inject System Prompts",
      SubTitle: "Inject a global system prompt for every request",
    },
    InputTemplate: {
      Title: "Input Template",
      SubTitle: "Newest message will be filled to this template",
    },

    Update: {
      Version: (x: string) => `Version: ${x}`,
      IsLatest: "Latest version",
      CheckUpdate: "Check Update",
      IsChecking: "Checking update...",
      FoundUpdate: (x: string) => `Found new version: ${x}`,
      GoToUpdate: "Update",
      Success: "Update Successful.",
      Failed: "Update Failed.",
    },
    SendKey: "Send Key",
    Theme: "Theme",
    ColorScheme: {
      Title: "Color Scheme",
      Options: {
        default: "Default Blue",
        ocean: "Ocean Blue",
        forest: "Forest Green",
        sunset: "Sunset Orange",
        purple: "Purple Dream",
        rose: "Rose Pink",
      },
    },
    TightBorder: "Tight Border",
    SendPreviewBubble: {
      Title: "Send Preview Bubble",
      SubTitle: "Preview markdown in bubble",
    },
    AutoGenerateTitle: {
      Title: "Auto Generate Title",
      SubTitle: "Generate a suitable title based on the conversation content",
    },
    Sync: {
      CloudState: "Last Update",
      NotSyncYet: "Not sync yet",
      Success: "Sync Success",
      Fail: "Sync Fail",

      Config: {
        Modal: {
          Title: "Config Sync",
          Check: "Check Connection",
        },
        SyncType: {
          Title: "Sync Type",
          SubTitle: "Choose your favorite sync service",
        },
        Proxy: {
          Title: "Enable CORS Proxy",
          SubTitle: "Enable a proxy to avoid cross-origin restrictions",
        },
        ProxyUrl: {
          Title: "Proxy Endpoint",
          SubTitle:
            "Only applicable to the built-in CORS proxy for this project",
        },

        SyncChat: {
          Title: "Sync Chat",
          SubTitle: "Sync all chat history (encrypted)",
        },

        AutoSync: {
          Title: "Auto Sync",
          SubTitle: "Automatically sync chat data after sending messages",
        },

        SyncConfig: {
          Title: "Sync Config",
          SubTitle: "Sync model services, assistants, prompts (encrypted)",
        },

        Encryption: {
          Title: "Encryption Password",
          SubTitle:
            "Set encryption password for config data, leave empty for default encryption",
          Placeholder: "Enter encryption password",
        },

        WebDav: {
          Endpoint: "WebDAV Endpoint",
          UserName: "User Name",
          Password: "Password",
          BackupName: "Backup Name",
        },

        UpStash: {
          Endpoint: "UpStash Redis REST Url",
          UserName: "Backup Name",
          Password: "UpStash Redis REST Token",
        },

        GitHub: {
          Token: "GitHub Personal Access Token",
          Repo: "Repository (format: owner/repo)",
          Branch: "Branch",
          Path: "Storage Path (optional)",
          UserName: "Backup Name",
        },

        S3: {
          Endpoint: "S3 Endpoint",
          Bucket: "Bucket Name",
          AccessKey: "Access Key ID",
          SecretKey: "Secret Access Key",
          Region: "Region",
          UserName: "Backup Name",
        },
      },

      LocalState: "Local Data",
      Overview: (overview: any) => {
        return `${overview.chat} chats，${overview.message} messages，${overview.prompt} prompts，${overview.mask} assistants`;
      },
      ImportFailed: "Failed to import from file",
      DecryptFailed: "Decryption failed, please check your encryption password",
      Upload: "Upload",
      Download: "Download",
      UploadSuccess: "Upload successful",
      UploadFailed: "Upload failed",
      DownloadSuccess: "Download successful, page will refresh",
      DownloadFailed: "Download failed",
      EmptyRemote: "Remote data is empty",
      ChatData: "Chat Data",
      ConfigData: "Config Data",
      ConfigDataDesc:
        "Includes model services, model config, voice config, assistants, prompts, etc.",
      AutoSync: "Auto Sync",
      CheckSuccess: "Connection successful",
      CheckFailed: "Connection failed",
    },
    Mask: {
      ModelIcon: {
        Title: "Use Model Icon as AI Avatar",
        SubTitle:
          "When enabled, AI avatar in conversations will use the current model's icon instead of emoji",
      },
    },
    AccessCode: {
      Title: "Access Code",
      SubTitle: "Access control is enabled, please enter access code",
      Placeholder: "Enter access code",
      Status: {
        Enabled: "Access control enabled",
        Valid: "Access code valid",
        Invalid: "Access code invalid",
      },
    },
    Prompt: {
      Disable: {
        Title: "Disable auto-completion",
        SubTitle: "Input / to trigger auto-completion",
      },
      List: "Prompt List",
      ListCount: (builtin: number, custom: number) =>
        `${builtin} built-in, ${custom} user-defined`,
      Edit: "Edit",
      Modal: {
        Title: "Prompt List",
        Add: "Add One",
        Search: "Search Prompts",
      },
      EditModal: {
        Title: "Edit Prompt",
      },
      SystemPrompts: {
        Title: "System Prompts",
        SubTitle: "Manage built-in system prompts",
        OptimizeModel: {
          Title: "Content Optimization Prompt",
          SubTitle: "Prompt used for optimizing user input content",
        },
        Topic: {
          Title: "Title Generation Prompt",
          SubTitle: "Prompt used for auto-generating conversation titles",
        },
        Summarize: {
          Title: "Conversation Summary Prompt",
          SubTitle:
            "Prompt used for summarizing conversation content and compressing model context",
          Defaults: {
            SystemPrompt: `You are a context summarization assistant. Your task is to read a conversation between a user and an AI assistant, then produce a structured summary following the exact format specified.

Do NOT continue the conversation. Do NOT respond to any questions in the conversation. ONLY output the structured summary.`,
            InitialPrompt: `The messages above are a conversation to summarize. Create a structured context checkpoint summary that another LLM will use to continue the work.

Use this EXACT format:

## Goal
[What is the user trying to accomplish? Can be multiple items if the session covers different tasks.]

## Constraints & Preferences
- [Any constraints, preferences, or requirements mentioned by user]
- [Or "(none)" if none were mentioned]

## Progress
### Done
- [x] [Completed tasks/changes]

### In Progress
- [ ] [Current work]

### Blocked
- [Issues preventing progress, if any]

## Key Decisions
- **[Decision]**: [Brief rationale]

## Next Steps
1. [Ordered list of what should happen next]

## Critical Context
- [Any data, examples, or references needed to continue]
- [Or "(none)" if not applicable]

Keep each section concise. Preserve exact file paths, function names, and error messages.`,
            UpdatePrompt: `The messages above are NEW conversation messages to incorporate into the existing summary provided in <previous-summary> tags.

Update the existing structured summary with new information. RULES:
- PRESERVE all existing information from the previous summary
- ADD new progress, decisions, and context from the new messages
- UPDATE the Progress section: move items from "In Progress" to "Done" when completed
- UPDATE "Next Steps" based on what was accomplished
- PRESERVE exact file paths, function names, and error messages
- If something is no longer relevant, you may remove it

Use this EXACT format:

## Goal
[Preserve existing goals, add new ones if the task expanded]

## Constraints & Preferences
- [Preserve existing, add new ones discovered]

## Progress
### Done
- [x] [Include previously done items AND newly completed items]

### In Progress
- [ ] [Current work - update based on progress]

### Blocked
- [Current blockers - remove if resolved]

## Key Decisions
- **[Decision]**: [Brief rationale] (preserve all previous, add new)

## Next Steps
1. [Update based on current state]

## Critical Context
- [Preserve important context, add new if needed]

Keep each section concise. Preserve exact file paths, function names, and error messages.`,
          },
        },
      },
    },
    HistoryCount: {
      Title: "Attached Messages Count",
      SubTitle: "Number of sent messages attached per request",
    },
    AutoTitleMinUserTokens: {
      Title: "Auto Title Min User Tokens",
      SubTitle: "Minimum user tokens required to generate a title",
    },
    AutoTitleMinUserMessages: {
      Title: "Auto Title Min User Messages",
      SubTitle: "Minimum number of user messages required to generate a title",
    },
    AutoTitleRefreshInterval: {
      Title: "Auto Title Refresh Interval (User Messages)",
      SubTitle: "Update title after this many new user messages",
    },
    CompressThreshold: {
      Title: "Fixed Compression Threshold",
      SubTitle:
        "Triggers compression when uncompressed messages exceed this fixed value (independent condition)",
    },
    CompressThresholdRatio: {
      Title: "Dynamic Compression Threshold Ratio",
      SubTitle:
        "Calculates dynamic threshold based on model context window (independent condition, 10%-90%)",
    },
    SummaryMinUserMessages: {
      Title: "Summary Min User Messages",
      SubTitle: "Minimum user messages required to trigger summarization",
    },

    Access: {
      SaasStart: {
        Title: "",
        Label: "",
        SubTitle: "",
        ChatNow: "",
      },
      AccessCode: {
        Title: "Access Code",
        SubTitle: "Access control Enabled",
        Placeholder: "Enter Code",
      },
      CustomEndpoint: {
        Title: "Custom Endpoint",
        SubTitle: "Use custom Azure or OpenAI service",
      },
      Provider: {
        Title: "Model Provider",
        SubTitle: "Select Azure or OpenAI",
        Name: {
          ByteDance: "ByteDance",
          Alibaba: "Alibaba Cloud",
          Moonshot: "Moonshot",
        },
        Status: {
          Enabled: "Enabled",
        },
        Models: {
          Title: "Enabled Models",
          SubTitle: "List of enabled models in current provider",
          NoModels: "No enabled models",
          Manage: "Manage",
        },
        Description: {
          OpenAI: "OpenAI GPT Series Models",
          Azure: "Microsoft Azure OpenAI Service",
          Google: "Google Gemini Series Models",
          Anthropic: "Anthropic Claude Series Models",
          ByteDance: "ByteDance Doubao Series Models",
          Alibaba: "Alibaba Cloud Qwen Series Models",
          Moonshot: "Moonshot Kimi Series Models",
          DeepSeek: "DeepSeek Series Models",
          XAI: "xAI Grok Series Models",
          SiliconFlow: "SiliconFlow",
          Ollama: "Ollama Local Model Service",
          Custom: "Custom",
        },
        Terms: {
          Provider: "Provider",
        },
      },
      OpenAI: {
        ApiKey: {
          Title: "OpenAI API Key",
          SubTitle: "User custom OpenAI Api Key",
          Placeholder: "sk-xxx",
        },

        Endpoint: {
          Title: "Base Path",
          SubTitle:
            "Include protocol, domain and port, e.g. https://api.openai.com",
        },

        ApiType: {
          Title: "API Type",
          SubTitle: "Select the API type to use",
          Chat: "Chat Completions API",
          Response: "Response API",
        },

        UseResponseApi: {
          Title: "Use Response API",
          SubTitle: "When enabled, use Response API for model calls",
        },

        ApiPath: {
          Title: "API Path",
          SubTitle: "API endpoint path, customizable",
          ChatPlaceholder: "/chat/completions",
          ResponsePlaceholder: "/responses",
        },

        UseProxy: {
          Title: "Enable Proxy",
          SubTitle: "Use server-side proxy in standalone mode",
        },

        ProxyUrl: {
          Title: "Proxy Address",
          SubTitle: "Proxy server address, defaults to localhost",
        },
      },
      Azure: {
        ApiKey: {
          Title: "Azure Api Key",
          SubTitle: "Check your api key from Azure console",
          Placeholder: "Azure Api Key",
        },

        Endpoint: {
          Title: "Azure Endpoint",
          SubTitle: "Example: ",
        },

        ApiVerion: {
          Title: "Azure Api Version",
          SubTitle: "Check your api version from azure console",
        },

        UseProxy: {
          Title: "Enable Proxy",
          SubTitle: "Use server-side proxy in standalone mode",
        },

        ProxyUrl: {
          Title: "Proxy Address",
          SubTitle: "Proxy server address, defaults to localhost",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "Anthropic API Key",
          SubTitle:
            "Use a custom Anthropic Key to bypass password access restrictions",
          Placeholder: "Anthropic API Key",
        },

        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },

        ApiVerion: {
          Title: "API Version (claude api version)",
          SubTitle: "Select and input a specific API version",
        },

        UseProxy: {
          Title: "Enable Proxy",
          SubTitle: "Use server-side proxy in standalone mode",
        },

        ProxyUrl: {
          Title: "Proxy Address",
          SubTitle: "Proxy server address, defaults to localhost",
        },
      },

      ByteDance: {
        ApiKey: {
          Title: "ByteDance API Key",
          SubTitle: "Use a custom ByteDance API Key",
          Placeholder: "ByteDance API Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },

        UseProxy: {
          Title: "Enable Proxy",
          SubTitle: "Use server-side proxy in standalone mode",
        },

        ProxyUrl: {
          Title: "Proxy Address",
          SubTitle: "Proxy server address, defaults to localhost",
        },
      },
      Alibaba: {
        ApiKey: {
          Title: "Alibaba API Key",
          SubTitle: "Use a custom Alibaba Cloud API Key",
          Placeholder: "Alibaba Cloud API Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },

        UseProxy: {
          Title: "Enable Proxy",
          SubTitle: "Use server-side proxy in standalone mode",
        },

        ProxyUrl: {
          Title: "Proxy Address",
          SubTitle: "Proxy server address, defaults to localhost",
        },
      },
      Moonshot: {
        ApiKey: {
          Title: "Moonshot API Key",
          SubTitle: "Use a custom Moonshot API Key",
          Placeholder: "Moonshot API Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },

        UseProxy: {
          Title: "Enable Proxy",
          SubTitle: "Use server-side proxy in standalone mode",
        },

        ProxyUrl: {
          Title: "Proxy Address",
          SubTitle: "Proxy server address, defaults to localhost",
        },
      },
      DeepSeek: {
        ApiKey: {
          Title: "DeepSeek API Key",
          SubTitle: "Use a custom DeepSeek API Key",
          Placeholder: "DeepSeek API Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },

        UseProxy: {
          Title: "Enable Proxy",
          SubTitle: "Use server-side proxy in standalone mode",
        },

        ProxyUrl: {
          Title: "Proxy Address",
          SubTitle: "Proxy server address, defaults to localhost",
        },
      },
      XAI: {
        ApiKey: {
          Title: "XAI API Key",
          SubTitle: "Use a custom XAI API Key",
          Placeholder: "XAI API Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },

        UseProxy: {
          Title: "Enable Proxy",
          SubTitle: "Use server-side proxy in standalone mode",
        },

        ProxyUrl: {
          Title: "Proxy Address",
          SubTitle: "Proxy server address, defaults to localhost",
        },
      },
      SiliconFlow: {
        ApiKey: {
          Title: "SiliconFlow API Key",
          SubTitle: "Use a custom SiliconFlow API Key",
          Placeholder: "SiliconFlow API Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },

        UseProxy: {
          Title: "Enable Proxy",
          SubTitle: "Use server-side proxy in standalone mode",
        },

        ProxyUrl: {
          Title: "Proxy Address",
          SubTitle: "Proxy server address, defaults to localhost",
        },
      },
      Ollama: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "Ollama usually doesn't require an API Key",
          Placeholder: "Optional",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },

        UseProxy: {
          Title: "Enable Proxy",
          SubTitle: "Use server-side proxy in standalone mode",
        },

        ProxyUrl: {
          Title: "Proxy Address",
          SubTitle: "Proxy server address, defaults to localhost",
        },
      },
      CustomModel: {
        Title: "Custom Models",
        SubTitle: "Custom model options, seperated by comma",
      },
      Google: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "Obtain your API Key from Google AI",
          Placeholder: "Google AI API Key",
        },

        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },

        ApiVersion: {
          Title: "API Version (specific to gemini-pro)",
          SubTitle: "Select a specific API version",
        },
        GoogleSafetySettings: {
          Title: "Google Safety Settings",
          SubTitle: "Select a safety filtering level",
        },

        UseProxy: {
          Title: "Enable Proxy",
          SubTitle: "Use server-side proxy in standalone mode",
        },

        ProxyUrl: {
          Title: "Proxy Address",
          SubTitle: "Proxy server address, defaults to localhost",
        },
      },
      Baidu: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "Use custom Baidu API Key",
          Placeholder: "Baidu API Key",
        },
        SecretKey: {
          Title: "Secret Key",
          SubTitle: "Use custom Baidu Secret Key",
          Placeholder: "Baidu Secret Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Not supported for custom configuration, go to .env",
        },
      },
      Tencent: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "Use custom Tencent API Key",
          Placeholder: "Tencent API Key",
        },
        SecretKey: {
          Title: "Secret Key",
          SubTitle: "Use custom Tencent Secret Key",
          Placeholder: "Tencent Secret Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Not supported for custom configuration, go to .env",
        },
      },
      ChatGLM: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "Use custom ChatGLM API Key",
          Placeholder: "ChatGLM API Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },
      },
      Iflytek: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "Get APIKey from iFlytek Spark console",
          Placeholder: "API Key",
        },
        ApiSecret: {
          Title: "API Secret",
          SubTitle: "Get APISecret from iFlytek Spark console",
          Placeholder: "API Secret",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },
      },
      AI302: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "Use custom 302.AI API Key",
          Placeholder: "302.AI API Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },
      },
      CustomProvider: {
        Add: {
          Title: "Add Custom Provider",
          Button: "Add Custom Provider",
          Description: "Add custom channel based on existing provider types",
        },
        Modal: {
          Title: "Add Custom Provider",
          Name: {
            Title: "Provider Name",
            Placeholder: "Enter custom provider name",
            Required: "Please enter provider name",
            Unique: "Provider name already exists, please use another name",
          },
          Type: {
            Title: "Provider Type",
            OpenAI: "OpenAI - Compatible with OpenAI API services",
            Google: "Google - Google Gemini API",
            Anthropic: "Anthropic - Anthropic Claude API",
          },
          ApiKey: {
            Title: "API Key",
            Placeholder: "Enter API Key",
            Required: "Please enter API Key",
          },
          Endpoint: {
            Title: "Custom Endpoint",
            Placeholder: "Leave empty to use default endpoint",
            Optional: "(Optional)",
          },
          Cancel: "Cancel",
          Confirm: "Add",
        },
        Config: {
          Type: "Provider Type",
          BasedOn: "Based on",
          ApiKeyDescription: "Custom provider's API key",
          EndpointDescription: "Custom API endpoint address",
          EndpointPlaceholder: "API endpoint address",
          Delete: {
            Title: "Delete Provider",
            SubTitle: "Delete this custom provider and all its configurations",
            Button: "Delete",
            Confirm: "Are you sure you want to delete the custom provider",
            ConfirmSuffix: "?",
          },
        },
      },
    },

    Model: "Model",
    CompressModel: {
      Title: "Summary Model",
      SubTitle: "Model used to compress history and generate title",
    },
    OptimizeModel: {
      Title: "Content Optimization Model",
      SubTitle:
        "Model used to optimize user input content. If not configured, uses current chat model",
      Prompt: {
        Title: "Content Optimization Prompt",
        SubTitle:
          "Custom system prompt for content optimization model. Leave empty to use default prompt",
        Placeholder:
          "You are a prompt optimization assistant. Your task is to improve the user's input by fixing grammar errors, correcting word choices, making it clearer and more professional, while preserving the original meaning and intent. Only return the optimized text without any explanations or additional comments.",
      },
    },
    Temperature: {
      Title: "Temperature",
      SubTitle: "A larger value makes the more random output",
    },
    TopP: {
      Title: "Top P",
      SubTitle: "Do not alter this value together with temperature",
    },
    MaxTokens: {
      Title: "Max Tokens",
      SubTitle: "Maximum length of input tokens and generated tokens",
    },
    PresencePenalty: {
      Title: "Presence Penalty",
      SubTitle:
        "A larger value increases the likelihood to talk about new topics",
    },
    FrequencyPenalty: {
      Title: "Frequency Penalty",
      SubTitle:
        "A larger value decreasing the likelihood to repeat the same line",
    },
    TTS: {
      Enable: {
        Title: "Enable TTS",
        SubTitle: "Enable text-to-speech service",
      },
      Autoplay: {
        Title: "Enable Autoplay",
        SubTitle:
          "Automatically generate speech and play, you need to enable the text-to-speech switch first",
      },
      Model: "Model",
      Engine: "TTS Engine",
      EngineConfig: {
        Title: "Configuration Note",
        SubTitle:
          "OpenAI-TTS will use the configuration from OpenAI provider in Model Services. Please add the corresponding API Key in OpenAI provider before use",
      },
      Voice: {
        Title: "Voice",
        SubTitle: "The voice to use when generating the audio",
      },
      Speed: {
        Title: "Speed",
        SubTitle: "The speed of the generated audio",
      },
    },
    Realtime: {
      Enable: {
        Title: "Realtime Chat",
        SubTitle: "Enable realtime chat feature",
      },
      Provider: {
        Title: "Model Provider",
        SubTitle: "Switch between different providers",
      },
      Model: {
        Title: "Model",
        SubTitle: "Select a model",
      },
      ApiKey: {
        Title: "API Key",
        SubTitle: "API Key",
        Placeholder: "API Key",
      },
      Azure: {
        Endpoint: {
          Title: "Endpoint",
          SubTitle: "Endpoint",
        },
        Deployment: {
          Title: "Deployment Name",
          SubTitle: "Deployment Name",
        },
      },
      Qwen: {
        ModelGroupAsr: "Realtime speech recognition (ASR)",
        ModelGroupTts: "Realtime speech synthesis (TTS)",
        Model: {
          Title: "Qwen Model",
          SubTitle: "Choose ASR or TTS realtime model",
        },
        AsrLanguage: {
          Title: "ASR language",
          SubTitle: "Primary language for realtime recognition",
        },
        Voice: {
          Title: "Voice",
          SubTitle: "Select Qwen TTS voice",
        },
        Region: {
          Title: "Region",
          SubTitle: "Select API service region",
          Beijing: "China (Beijing)",
          Singapore: "International (Singapore)",
        },
      },
      Temperature: {
        Title: "Randomness (temperature)",
        SubTitle: "Higher values result in more random responses",
      },
    },
  },
  Store: {
    DefaultTopic: "New Conversation",
    BotHello: "Hello! How can I assist you today?",
    Error: "Something went wrong, please try again later.",
    Prompt: {
      History: (content: string) => "Current semantic state:\n" + content,
      Topic:
        "You are a conversation title generator.\nPlease generate a concise title based on the conversation below.\nRequirements:\n- 4 to 8 words\n- Output only the title\n- No punctuation\n- No explanations\n- No filler words\n- No quotes\nUser messages:\n{{user_messages}}\nUser-confirmed assistant reply (optional):\n{{assistant_message}}",
      Summarize:
        "You are a conversation context compressor. Your task is to extract key information from the user's message history for use in subsequent conversations.\n\nRequirements:\n1. Extract the user's core needs, goals, and preferences\n2. Record confirmed facts, decisions, and conclusions\n3. Preserve important context (e.g., project names, tech stack, file paths)\n4. Ignore small talk, repetitive content, and irrelevant information\n5. Use concise natural language, list key points\n6. If there's a previous summary, merge with new content and remove redundancy\n7. Keep it under 200 words\n\nPrevious summary (optional):\n{{previous_summary}}\n\nNew user messages:\n{{user_messages}}\n\nUser-confirmed assistant conclusions (optional):\n{{assistant_messages}}\n\nPlease output the updated summary:",
    },
  },
  Copy: {
    Success: "Copied to clipboard",
    Failed: "Copy failed, please grant permission to access clipboard",
  },
  Download: {
    Success: "Content downloaded to your directory.",
    Failed: "Download failed.",
  },
  Context: {
    Toast: (x: any) => `With ${x} contextual prompts`,
    Edit: "Current Chat Settings",
    Add: "Add a Prompt",
    Clear: "Context Cleared",
    Compressing: "Compressing context...",
    Compressed: "Context compressed",
    CompressedTag: "Compressed",
    Expand: "Expand",
    Collapse: "Collapse",
    Revert: "Revert",
  },

  ChatSettings: {
    Name: "Chat Settings",
  },
  Mcp: {
    Name: "MCP",
  },
  FineTuned: {
    Sysmessage: "You are an assistant that",
  },
  SearchChat: {
    Name: "Search",
    Page: {
      Title: "Search Chat History",
      Search: "Enter search query to search chat history",
      NoResult: "No results found",
      NoData: "No data",
      Loading: "Loading...",

      SubTitle: (count: number) => `Found ${count} results`,
    },
    Item: {
      View: "View",
    },
  },

  Mask: {
    Name: "Assistant",
    DefaultName: "Default Assistant",
    Management: "Assistant Management",
    NewMask: "New Assistant",
    DefaultModel: "Default Model",
    DefaultModelDesc: "Default model for new conversations",
    UseGlobalModel: "Use Global Default Model",
    ConversationCount: (count: number) =>
      `${count} conversation${count > 1 ? "s" : ""}`,
    Page: {
      Title: "Prompt Template",
      SubTitle: (count: number) => `${count} prompt templates`,
      Search: "Search Templates",
      Create: "Create",
    },
    GroupCustom: "Custom Assistants",
    GroupBuiltin: "Built-in Assistants",
    Item: {
      Info: (count: number) => `${count} prompts`,
      Chat: "Chat",
      View: "View",
      Edit: "Edit",
      Delete: "Delete",
      DeleteConfirm: "Confirm to delete?",
      DeleteDefaultForbidden: "Default assistant cannot be deleted",
    },
    EditModal: {
      Title: "Edit Assistant",
      Download: "Download",
      Clone: "Clone",
    },
    Config: {
      Avatar: "Bot Avatar",
      Name: "Bot Name",
      Sync: {
        Title: "Use Global Config",
        SubTitle: "Use global config in this chat",
        Confirm: "Confirm to override custom config with global config?",
      },
      HideContext: {
        Title: "Hide Context Prompts",
        SubTitle: "Do not show in-context prompts in chat",
      },
      Artifacts: {
        Title: "Enable Artifacts",
        SubTitle: "Can render HTML page when enable artifacts.",
      },
      CodeFold: {
        Title: "Enable CodeFold",
        SubTitle:
          "Automatically collapse/expand overly long code blocks when CodeFold is enabled",
      },
      Share: {
        Title: "Share This Assistant",
        SubTitle: "Generate a link to this assistant",
        Action: "Copy Link",
      },
      ReadOnlySync: {
        Title: "Read-only · Synced with Global",
        SubTitle:
          "These settings follow Settings → Model Config. Change them in Settings.",
      },
    },
  },
  NewChat: {
    Return: "Return",
    Skip: "Just Start",
    Title: "Pick an Assistant",
    SubTitle: "Chat with the Soul behind the Assistant",
    More: "Find More",
    Less: "Fold Code",
    ShowCode: "Show Code",
    Preview: "Preview",
    NotShow: "Never Show Again",
    ConfirmNoShow: "Confirm to disable？You can enable it in settings later.",
    Searching: "Searching...",
    Search: "Search Results",
    NoSearch: "No Search Results",
    SearchFormat: (SearchTime?: number) =>
      SearchTime !== undefined
        ? `(Search for ${Math.round(SearchTime / 1000)} s)`
        : "",
    Thinking: "Thinking...",
    Think: "Content of Thought",
    NoThink: "No Thought",
    ThinkFormat: (thinkingTime?: number) =>
      thinkingTime !== undefined
        ? `(Thinking for ${Math.round(thinkingTime / 1000)} s)`
        : "",
  },

  UI: {
    Confirm: "Confirm",
    Cancel: "Cancel",
    Close: "Close",
    Create: "Create",
    Edit: "Edit",
    Export: "Export",
    Import: "Import",
    Sync: "Sync",
    Config: "Config",
  },
  Exporter: {
    Description: {
      Title: "Only messages after clearing the context will be displayed",
    },
    Model: "Model",
    Messages: "Messages",
    Topic: "Topic",
    Time: "Time",
  },
  URLCommand: {
    Code: "Detected access code from url, confirm to apply? ",
    Settings: "Detected settings from url, confirm to apply?",
  },
};

export default en;
