import { getClientConfig } from "../config/client";
import { SubmitKey } from "../store/config";
import { SAAS_CHAT_UTM_URL } from "@/app/constant";

const isApp = !!getClientConfig()?.isApp;

const bn = {
  WIP: "শীঘ্রই আসছে...",
  Error: {
    Unauthorized: isApp
      ? `😆 কথোপকথনে কিছু সমস্যা হয়েছে, চিন্তার কিছু নেই:
    \\ 1️⃣ যদি আপনি শূন্য কনফিগারেশনে শুরু করতে চান, তাহলে [এখানে ক্লিক করে অবিলম্বে কথোপকথন শুরু করুন 🚀](${SAAS_CHAT_UTM_URL})
    \\ 2️⃣ যদি আপনি আপনার নিজস্ব OpenAI সম্পদ ব্যবহার করতে চান, তাহলে [এখানে ক্লিক করুন](/#/settings) সেটিংস পরিবর্তন করতে ⚙️`
      : `😆 কথোপকথনে কিছু সমস্যা হয়েছে, চিন্তার কিছু নেই:
    \ 1️⃣ যদি আপনি শূন্য কনফিগারেশনে শুরু করতে চান, তাহলে [এখানে ক্লিক করে অবিলম্বে কথোপকথন শুরু করুন 🚀](${SAAS_CHAT_UTM_URL})
    \ 2️⃣ যদি আপনি একটি প্রাইভেট ডেপ্লয়মেন্ট সংস্করণ ব্যবহার করেন, তাহলে [এখানে ক্লিক করুন](/#/auth) প্রবেশাধিকার কীগুলি প্রবেশ করতে 🔑
    \ 3️⃣ যদি আপনি আপনার নিজস্ব OpenAI সম্পদ ব্যবহার করতে চান, তাহলে [এখানে ক্লিক করুন](/#/settings) সেটিংস পরিবর্তন করতে ⚙️
 `,
  },
  Auth: {
    Title: "পাসওয়ার্ড প্রয়োজন",
    Tips: "অ্যাডমিন পাসওয়ার্ড প্রমাণীকরণ চালু করেছেন, নিচে অ্যাক্সেস কোড প্রবেশ করুন",
    SubTips: "অথবা আপনার OpenAI অথবা Google API কী প্রবেশ করান",
    Input: "এখানে অ্যাক্সেস কোড লিখুন",
    Confirm: "নিশ্চিত করুন",
    Later: "পরে বলুন",
    Return: "ফিরে আসা",
    SaasTips: "কনফিগারেশন খুব কঠিন, আমি অবিলম্বে ব্যবহার করতে চাই",
    TopTips:
      "🥳 NextChat AI প্রথম প্রকাশের অফার, এখনই OpenAI o1, GPT-4o, Claude-3.5 এবং সর্বশেষ বড় মডেলগুলি আনলক করুন",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} টি চ্যাট`,
  },
  Chat: {
    MultiModel: {
      Title: "মাল্টি-মডেল চ্যাট সেটিংস",
      Enabled: "মাল্টি-মডেল (চালু)",
      Disabled: "মাল্টি-মডেল (বন্ধ)",
      Count: (count: number) => `${count} মডেল`,
      Description:
        "🎯 মাল্টি-মডেল এরিনা মোড চালু হয়েছে! মডেল নির্বাচকে ক্লিক করে চ্যাটের জন্য একাধিক মডেল নির্বাচন করুন।",
      OpenSelector: "মডেল নির্বাচক খুলুন",
      AlreadySelected: (count: number) => `(${count} নির্বাচিত)`,
      Tips: "💡 টিপ: মাল্টি-মডেল মোডে, আপনি একসাথে একাধিক মডেল নির্বাচন করতে পারেন এবং প্রতিটি মডেল আপনার বার্তার স্বতন্ত্রভাবে উত্তর দেবে, যা আপনাকে বিভিন্ন মডেলের প্রতিক্রিয়া তুলনা করতে দেয়।",
      EnableToast:
        "🎯 মাল্টি-মডেল এরিনা মোড চালু হয়েছে! মডেল নির্বাচকে ক্লিক করে চ্যাট এরিনার জন্য একাধিক মডেল নির্বাচন করুন",
      DisableToast: "মাল্টি-মডেল মোড বন্ধ করা হয়েছে",
      MinimumModelsError:
        "মাল্টি-মডেল চ্যাট চালু করতে অনুগ্রহ করে কমপক্ষে দুটি মডেল নির্বাচন করুন",
      ModelsSelectedToast: (count: number) =>
        `${count} মডেল চ্যাটের জন্য নির্বাচিত হয়েছে`,
    },
    UI: {
      SidebarToggle: "সাইডবার সংকুচিত/প্রসারিত করুন",
      SearchModels: "মডেল খুঁজুন...",
      SelectModel: "মডেল নির্বাচন করুন",
      ContextTooltip: {
        Current: (current: number, max: number) =>
          `বর্তমান প্রসঙ্গ: ${current} / ${max}`,
        CurrentTokens: (current: number, max: number) =>
          `বর্তমান টোকেন: ${current.toLocaleString()} / ${max.toLocaleString()}`,
        CurrentTokensUnknown: (current: number) =>
          `বর্তমান টোকেন: ${current.toLocaleString()} / অজানা`,
        EstimatedTokens: (estimated: number) =>
          `আনুমানিক টোকেন: ${estimated.toLocaleString()}`,
        ContextTokens: (tokens: string) => `প্রসঙ্গ: ${tokens} টোকেন`,
      },
    },
    SubTitle: (count: number) => `মোট ${count} টি চ্যাট`,
    EditMessage: {
      Title: "বার্তাগুলি সম্পাদনা করুন",
      Topic: {
        Title: "চ্যাটের বিষয়",
        SubTitle: "বর্তমান চ্যাটের বিষয় পরিবর্তন করুন",
      },
    },
    Actions: {
      ChatList: "বার্তা তালিকা দেখুন",
      CompressedHistory: "সংকুচিত ইতিহাস দেখুন",
      Export: "চ্যাট ইতিহাস রপ্তানী করুন",
      Copy: "অনুলিপি করুন",
      Stop: "থামান",
      Retry: "পুনরায় চেষ্টা করুন",
      Pin: "পিন করুন",
      PinToastContent: "1 টি চ্যাট পূর্বনির্ধারিত প্রম্পটে পিন করা হয়েছে",
      PinToastAction: "দেখুন",
      Delete: "মুছে ফেলুন",
      Edit: "সম্পাদনা করুন",
      FullScreen: "পূর্ণ পর্দা",
      RefreshTitle: "শিরোনাম রিফ্রেশ করুন",
      RefreshToast: "শিরোনাম রিফ্রেশ অনুরোধ পাঠানো হয়েছে",
      Speech: "বক্তৃতা",
      StopSpeech: "থামান",
      PreviousVersion: "পূর্ববর্তী সংস্করণ",
      NextVersion: "পরবর্তী সংস্করণ",
      Debug: "ডিবাগ",
      CopyAsCurl: "cURL হিসেবে অনুলিপি করুন",
    },
    Commands: {
      new: "নতুন চ্যাট",
      newm: "মাস্ক থেকে নতুন চ্যাট",
      next: "পরবর্তী চ্যাট",
      prev: "পূর্ববর্তী চ্যাট",
      clear: "প্রসঙ্গ পরিষ্কার করুন",
      fork: "চ্যাট ফর্ক করুন",
      del: "চ্যাট মুছে ফেলুন",
    },
    InputActions: {
      Stop: "প্রতিক্রিয়া থামান",
      ToBottom: "সর্বশেষে স্ক্রোল করুন",
      Theme: {
        auto: "স্বয়ংক্রিয় থিম",
        light: "আলোর মোড",
        dark: "অন্ধকার মোড",
      },
      Prompt: "সংক্ষিপ্ত নির্দেশনা",
      Masks: "সমস্ত মাস্ক",
      Clear: "চ্যাট পরিষ্কার করুন",
      Reset: "চ্যাট রিসেট করুন",
      ResetConfirm:
        "আপনি কি নিশ্চিত যে আপনি বর্তমান চ্যাট উইন্ডোর সম্পূর্ণ বিষয়বস্তু রিসেট করতে চান?",
      Settings: "চ্যাট সেটিংস",
      UploadImage: "চিত্র আপলোড করুন",
      Search: "অনুসন্ধান",
      SearchOn: "অনুসন্ধান চালু",
      SearchOff: "অনুসন্ধান বন্ধ",
      SearchEnabledToast:
        "🔍 অনুসন্ধান বৈশিষ্ট্য চালু হয়েছে! এখন আপনি ওয়েবে অনুসন্ধান করতে পারেন",
      SearchDisabledToast: "❌ অনুসন্ধান বৈশিষ্ট্য বন্ধ করা হয়েছে",
    },
    MCP: {
      Title: "MCP টুল ম্যানেজমেন্ট",
      Enable: "MCP বৈশিষ্ট্য চালু করুন",
      EnableDesc:
        "চালু হলে, MCP টুলস উপলব্ধ থাকবে। বন্ধ হলে, MCP-সম্পর্কিত অনুরোধ পাঠানো হবে না",
      NoTools: "কোন MCP টুল উপলব্ধ নেই",
      Loading: "লোড হচ্ছে...",
      ClientFailed: "MCP ক্লায়েন্ট লোড করা যায়নি, নীরবে প্রসেসিং",
      ToolsCount: (count: number) => `${count} টি টুল`,
    },
    Rename: "চ্যাট নাম পরিবর্তন করুন",
    Typing: "লিখছে…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} পাঠান`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "，Shift + Enter নতুন লাইন";
      }
      return inputHints + "，/ পূর্ণতা সক্রিয় করুন，: কমান্ড সক্রিয় করুন";
    },
    Send: "পাঠান",
    TokenUsage: "ব্যবহার",
    TokenTooltip: {
      Context: "বর্তমান প্রসঙ্গ",
      CurrentToken: "বর্তমান টোকেন",
      EstimatedToken: "আনুমানিক টোকেন",
      Unknown: "অজানা",
    },
    StartSpeak: "বক্তৃতা শুরু করুন",
    StopSpeak: "বক্তৃতা থামান",
    Config: {
      Reset: "মেমরি মুছে ফেলুন",
      SaveAs: "মাস্ক হিসেবে সংরক্ষণ করুন",
    },
    IsContext: "পূর্বনির্ধারিত প্রম্পট",
    ShortcutKey: {
      Title: "শর্টকাট কী",
      newChat: "নতুন চ্যাট খুলুন",
      focusInput: "ইনপুট ফিল্ডে ফোকাস করুন",
      copyLastMessage: "সর্বশেষ বার্তা অনুলিপি করুন",
      copyLastCode: "সর্বশেষ কোড অনুলিপি করুন",
      showShortcutKey: "শর্টকাট কী দেখান",
      clearContext: "প্রসঙ্গ পরিষ্কার করুন",
    },
    Thinking: {
      Title: "চিন্তার গভীরতা",
      Dynamic: "গতিশীল চিন্তা",
      DynamicDesc: "মডেল স্বয়ংক্রিয়ভাবে চিন্তার গভীরতা সমন্বয় করে",
      Off: "চিন্তা বন্ধ",
      OffDesc: "কোন চিন্তার প্রক্রিয়া নেই",
      Light: "হালকা চিন্তা",
      LightDesc: "1024 টোকেন",
      Medium: "মাঝারি চিন্তা",
      MediumDesc: "4096 টোকেন",
      Deep: "গভীর চিন্তা",
      DeepDesc: "8192 টোকেন",
      VeryDeep: "অত্যন্ত গভীর চিন্তা",
      VeryDeepDesc: "16384 টোকেন",
      Notice:
        "শুধুমাত্র চিন্তার বাজেট সমর্থনকারী মডেলগুলি চিন্তার গভীরতা সমন্বয় করতে পারে",
      ClaudeNotice:
        "শুধুমাত্র Claude সিরিজের মডেলগুলি চিন্তার গভীরতা সমন্বয় করতে পারে",
      GeminiNotice:
        "শুধুমাত্র Gemini সিরিজের মডেলগুলি চিন্তার গভীরতা সমন্বয় করতে পারে",
      ClaudeLight: "চিন্তা",
      ClaudeLightDesc: "5000 টোকেন",
      ClaudeMedium: "গুরুত্ব সহকারে চিন্তা",
      ClaudeMediumDesc: "10000 টোকেন",
      ClaudeDeep: "আরও গুরুত্ব সহকারে চিন্তা",
      ClaudeDeepDesc: "20000 টোকেন",
      ClaudeVeryDeep: "চরমভাবে চিন্তা",
      ClaudeVeryDeepDesc: "32000 টোকেন",
      ClaudeDynamicDesc:
        "স্বয়ংক্রিয়ভাবে চিন্তার গভীরতা সমন্বয় করে (ডিফল্ট 10000 টোকেন)",
    },
  },
  Export: {
    Title: "চ্যাট ইতিহাস শেয়ার করুন",
    Copy: "সবকিছু কপি করুন",
    Download: "ফাইল ডাউনলোড করুন",
    Share: "ShareGPT তে শেয়ার করুন",
    MessageFromYou: "ব্যবহারকারী",
    MessageFromChatGPT: "ChatGPT",
    Format: {
      Title: "রপ্তানির ফর্ম্যাট",
      SubTitle: "Markdown টেক্সট বা PNG চিত্র রপ্তানি করা যাবে",
    },
    IncludeContext: {
      Title: "মাস্ক প্রসঙ্গ অন্তর্ভুক্ত করুন",
      SubTitle: "বার্তায় মাস্ক প্রসঙ্গ প্রদর্শন করা হবে কি না",
    },
    Steps: {
      Select: "নির্বাচন করুন",
      Preview: "পূর্বরূপ দেখুন",
    },
    Image: {
      Toast: "স্ক্রীনশট তৈরি করা হচ্ছে",
      Modal: "ছবি সংরক্ষণ করতে দীর্ঘ প্রেস করুন অথবা রাইট ক্লিক করুন",
    },
    Artifacts: {
      Title: "পৃষ্ঠা মুদ্রণ",
      Error: "মুদ্রণ ত্রুটি",
    },
  },
  Select: {
    Search: "বার্তা অনুসন্ধান করুন",
    All: "সবকিছু নির্বাচন করুন",
    Latest: "সর্বশেষ কিছু",
    Clear: "নির্বাচন পরিষ্কার করুন",
  },
  Memory: {
    Title: "ইতিহাস সারাংশ",
    EmptyContent: "চ্যাটের বিষয়বস্তু খুব সংক্ষিপ্ত, সারাংশ প্রয়োজন নেই",
    Send: "অটোমেটিক চ্যাট ইতিহাস সংকুচিত করুন এবং প্রসঙ্গ হিসেবে পাঠান",
    Copy: "সারাংশ কপি করুন",
    Reset: "[অব্যবহৃত]",
    ResetConfirm: "ইতিহাস সারাংশ মুছে ফেলার নিশ্চিত করুন?",
  },
  Home: {
    NewChat: "নতুন চ্যাট",
    DeleteChat: "নির্বাচিত চ্যাট মুছে ফেলার নিশ্চিত করুন?",
    DeleteToast: "চ্যাট মুছে ফেলা হয়েছে",
    Revert: "পূর্বাবস্থায় ফেরান",
  },
  Settings: {
    Title: "সেটিংস",
    SubTitle: "সমস্ত সেটিংস অপশন",
    ShowPassword: "পাসওয়ার্ড দেখান",

    Tab: {
      General: "সাধারণ সেটিংস",
      Sync: "ক্লাউড সিঙ্ক",
      Mask: "মাস্ক",
      Prompt: "প্রম্পট",
      ModelService: "মডেল পরিষেবা",
      ModelConfig: "মডেল কনফিগারেশন",
      Voice: "কণ্ঠ",
    },

    Danger: {
      Reset: {
        Title: "সমস্ত সেটিংস পুনরায় সেট করুন",
        SubTitle: "সমস্ত সেটিংস বিকল্পগুলিকে ডিফল্ট মানে পুনরায় সেট করুন",
        Action: "এখনই পুনরায় সেট করুন",
        Confirm: "সমস্ত সেটিংস পুনরায় সেট করার নিশ্চিত করুন?",
      },
      Clear: {
        Title: "সমস্ত তথ্য মুছে ফেলুন",
        SubTitle: "সমস্ত চ্যাট এবং সেটিংস ডেটা মুছে ফেলুন",
        Action: "এখনই মুছে ফেলুন",
        Confirm: "সমস্ত চ্যাট এবং সেটিংস ডেটা মুছে ফেলানোর নিশ্চিত করুন?",
      },
    },
    Lang: {
      Name: "Language", // মনোযোগ দিন: আপনি যদি একটি নতুন অনুবাদ যোগ করতে চান, দয়া করে এই মানটি অনুবাদ করবেন না, এটি `Language` রাখুন
      All: "সমস্ত ভাষা",
    },
    Avatar: "অভিনেতা",
    FontSize: {
      Title: "ফন্ট সাইজ",
      SubTitle: "চ্যাট কনটেন্টের ফন্ট সাইজ",
    },
    FontFamily: {
      Title: "চ্যাট ফন্ট",
      SubTitle:
        "চ্যাট সামগ্রীর ফন্ট, বিশ্বব্যাপী ডিফল্ট ফন্ট প্রয়োগ করতে খালি রাখুন",
      Placeholder: "ফন্টের নাম",
    },
    InjectSystemPrompts: {
      Title: "সিস্টেম-লেভেল প্রম্পট যোগ করুন",
      SubTitle:
        "প্রত্যেক বার্তায় একটি সিস্টেম প্রম্পট যোগ করুন যা ChatGPT এর অনুকরণ করবে",
    },
    InputTemplate: {
      Title: "ব্যবহারকারীর ইনপুট প্রিপ্রসেসিং",
      SubTitle: "ব্যবহারকারীর সর্বশেষ বার্তা এই টেমপ্লেটে পূরণ করা হবে",
    },

    Update: {
      Version: (x: string) => `বর্তমান সংস্করণ: ${x}`,
      IsLatest: "এটি সর্বশেষ সংস্করণ",
      CheckUpdate: "আপডেট পরীক্ষা করুন",
      IsChecking: "আপডেট পরীক্ষা করা হচ্ছে...",
      FoundUpdate: (x: string) => `নতুন সংস্করণ পাওয়া গিয়েছে: ${x}`,
      GoToUpdate: "আপডেট করতে যান",
      Success: "আপডেট সফল!",
      Failed: "আপডেট ব্যর্থ",
    },
    SendKey: "পাঠানোর কী",
    Theme: "থিম",
    ColorScheme: {
      Title: "রঙের স্কিম",
      Options: {
        default: "ডিফল্ট নীল",
        ocean: "সমুদ্র নীল",
        forest: "বন সবুজ",
        sunset: "সূর্যাস্ত কমলা",
        purple: "বেগুনি স্বপ্ন",
        rose: "গোলাপী",
      },
    },
    TightBorder: "বর্ডার-বিহীন মোড",
    SendPreviewBubble: {
      Title: "প্রিভিউ বুদবুদ",
      SubTitle: "প্রিভিউ বুদবুদে Markdown কনটেন্ট প্রিভিউ করুন",
    },
    AutoGenerateTitle: {
      Title: "স্বয়ংক্রিয় শিরোনাম জেনারেশন",
      SubTitle: "চ্যাট কনটেন্টের ভিত্তিতে উপযুক্ত শিরোনাম তৈরি করুন",
    },
    Sync: {
      CloudState: "ক্লাউড ডেটা",
      NotSyncYet: "এখনো সিঙ্ক করা হয়নি",
      Success: "সিঙ্ক সফল",
      Fail: "সিঙ্ক ব্যর্থ",

      Config: {
        Modal: {
          Title: "ক্লাউড সিঙ্ক কনফিগার করুন",
          Check: "পরীক্ষা করুন",
        },
        SyncType: {
          Title: "সিঙ্ক টাইপ",
          SubTitle: "পছন্দসই সিঙ্ক সার্ভার নির্বাচন করুন",
        },
        Proxy: {
          Title: "প্রক্সি সক্রিয় করুন",
          SubTitle:
            "ব্রাউজারে সিঙ্ক করার সময়, ক্রস-অরিজিন সীমাবদ্ধতা এড়াতে প্রক্সি সক্রিয় করতে হবে",
        },
        ProxyUrl: {
          Title: "প্রক্সি ঠিকানা",
          SubTitle:
            "এটি শুধুমাত্র প্রকল্পের সাথে সরবরাহিত ক্রস-অরিজিন প্রক্সির জন্য প্রযোজ্য",
        },

        WebDav: {
          Endpoint: "WebDAV ঠিকানা",
          UserName: "ব্যবহারকারীর নাম",
          Password: "পাসওয়ার্ড",
        },

        UpStash: {
          Endpoint: "UpStash Redis REST URL",
          UserName: "ব্যাকআপ নাম",
          Password: "UpStash Redis REST টোকেন",
        },
      },

      LocalState: "স্থানীয় ডেটা",
      Overview: (overview: any) => {
        return `${overview.chat} বার চ্যাট, ${overview.message} বার্তা, ${overview.prompt} প্রম্পট, ${overview.mask} মাস্ক`;
      },
      ImportFailed: "আমদানি ব্যর্থ",
    },
    Mask: {
      ModelIcon: {
        Title: "এআই অবতার হিসেবে মডেল আইকন ব্যবহার করুন",
        SubTitle:
          "চালু হলে, চ্যাটে এআই অবতার বর্তমান মডেলের আইকন ব্যবহার করবে পরিবর্তে ইমোজি",
      },
    },
    AccessCode: {
      Title: "অ্যাক্সেস কোড",
      SubTitle:
        "অ্যাক্সেস নিয়ন্ত্রণ চালু আছে, অনুগ্রহ করে অ্যাক্সেস কোড প্রবেশ করান",
      Placeholder: "অ্যাক্সেস কোড প্রবেশ করান",
      Status: {
        Enabled: "অ্যাক্সেস নিয়ন্ত্রণ চালু আছে",
        Valid: "অ্যাক্সেস কোড বৈধ",
        Invalid: "অ্যাক্সেস কোড অবৈধ",
      },
    },
    Prompt: {
      Disable: {
        Title: "প্রম্পট অটো-কমপ্লিশন নিষ্ক্রিয় করুন",
        SubTitle: "ইনপুট বক্সের শুরুতে / টাইপ করলে অটো-কমপ্লিশন সক্রিয় হবে",
      },
      List: "স্বনির্ধারিত প্রম্পট তালিকা",
      ListCount: (builtin: number, custom: number) =>
        `ইনবিল্ট ${builtin} টি, ব্যবহারকারী সংজ্ঞায়িত ${custom} টি`,
      Edit: "সম্পাদনা করুন",
      Modal: {
        Title: "প্রম্পট তালিকা",
        Add: "নতুন করুন",
        Search: "প্রম্পট অনুসন্ধান করুন",
      },
      EditModal: {
        Title: "প্রম্পট সম্পাদনা করুন",
      },
    },
    HistoryCount: {
      Title: "সংযুক্ত ইতিহাস বার্তার সংখ্যা",
      SubTitle: "প্রতিটি অনুরোধে সংযুক্ত ইতিহাস বার্তার সংখ্যা",
    },
    CompressThreshold: {
      Title: "ইতিহাস বার্তা দৈর্ঘ্য সংকুচিত থ্রেশহোল্ড",
      SubTitle:
        "যখন সংকুচিত ইতিহাস বার্তা এই মান ছাড়িয়ে যায়, তখন সংকুচিত করা হবে",
    },

    Access: {
      SaasStart: {
        Title: "NextChat AI ব্যবহার করুন",
        Label: "(সেরা মূল্যসাশ্রয়ী সমাধান)",
        SubTitle:
          "NextChat কর্তৃক অফিসিয়াল রক্ষণাবেক্ষণ, শূন্য কনফিগারেশন ব্যবহার শুরু করুন, OpenAI o1, GPT-4o, Claude-3.5 সহ সর্বশেষ বড় মডেলগুলি সমর্থন করে",
        ChatNow: "এখনই চ্যাট করুন",
      },
      AccessCode: {
        Title: "অ্যাক্সেস পাসওয়ার্ড",
        SubTitle: "অ্যাডমিন এনক্রিপ্টেড অ্যাক্সেস সক্রিয় করেছেন",
        Placeholder: "অ্যাক্সেস পাসওয়ার্ড প্রবেশ করুন",
      },
      CustomEndpoint: {
        Title: "স্বনির্ধারিত ইন্টারফেস",
        SubTitle: "স্বনির্ধারিত Azure বা OpenAI সার্ভিস ব্যবহার করবেন কি?",
      },
      Provider: {
        Title: "মডেল পরিষেবা প্রদানকারী",
        SubTitle: "বিভিন্ন পরিষেবা প্রদানকারীতে স্যুইচ করুন",
        Name: {
          ByteDance: "ByteDance",
          Alibaba: "Alibaba Cloud",
          Moonshot: "Moonshot",
        },
        Status: {
          Enabled: "চালু আছে",
        },
        Models: {
          Title: "চালু মডেলগুলি",
          SubTitle: "বর্তমান প্রদানকারীর জন্য চালু মডেলগুলির তালিকা",
          NoModels: "কোন মডেল চালু নেই",
          Manage: "ব্যবস্থাপনা",
        },
        Description: {
          OpenAI: "OpenAI GPT সিরিজের মডেলগুলি",
          Azure: "Microsoft Azure OpenAI পরিষেবা",
          Google: "Google Gemini সিরিজের মডেলগুলি",
          Anthropic: "Anthropic Claude সিরিজের মডেলগুলি",
          ByteDance: "ByteDance Doubao সিরিজের মডেলগুলি",
          Alibaba: "Alibaba Cloud Qwen সিরিজের মডেলগুলি",
          Moonshot: "Moonshot Kimi সিরিজের মডেলগুলি",
          DeepSeek: "DeepSeek সিরিজের মডেলগুলি",
          XAI: "xAI Grok সিরিজের মডেলগুলি",
          SiliconFlow: "SiliconFlow",
          Custom: "কাস্টম",
        },
        Terms: {
          Provider: "প্রদানকারী",
        },
      },
      OpenAI: {
        ApiKey: {
          Title: "API কী",
          SubTitle:
            "পাসওয়ার্ড অ্যাক্সেস সীমাবদ্ধতা এড়াতে স্বনির্ধারিত OpenAI কী ব্যবহার করুন",
          Placeholder: "OpenAI API কী",
        },

        Endpoint: {
          Title: "ইন্টারফেস ঠিকানা",
          SubTitle: "ডিফল্ট ঠিকানা বাদে, http(s):// অন্তর্ভুক্ত করতে হবে",
        },
      },
      Azure: {
        ApiKey: {
          Title: "ইন্টারফেস কী",
          SubTitle:
            "পাসওয়ার্ড অ্যাক্সেস সীমাবদ্ধতা এড়াতে স্বনির্ধারিত Azure কী ব্যবহার করুন",
          Placeholder: "Azure API কী",
        },

        Endpoint: {
          Title: "ইন্টারফেস ঠিকানা",
          SubTitle: "উদাহরণ:",
        },

        ApiVerion: {
          Title: "ইন্টারফেস সংস্করণ (azure api version)",
          SubTitle: "নির্দিষ্ট সংস্করণ নির্বাচন করুন",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "ইন্টারফেস কী",
          SubTitle:
            "পাসওয়ার্ড অ্যাক্সেস সীমাবদ্ধতা এড়াতে স্বনির্ধারিত Anthropic কী ব্যবহার করুন",
          Placeholder: "Anthropic API কী",
        },

        Endpoint: {
          Title: "ইন্টারফেস ঠিকানা",
          SubTitle: "উদাহরণ:",
        },

        ApiVerion: {
          Title: "ইন্টারফেস সংস্করণ (claude api version)",
          SubTitle: "নির্দিষ্ট API সংস্করণ প্রবেশ করুন",
        },
      },
      Google: {
        ApiKey: {
          Title: "API কী",
          SubTitle: "Google AI থেকে আপনার API কী পান",
          Placeholder: "আপনার Google AI Studio API কী প্রবেশ করুন",
        },

        Endpoint: {
          Title: "টার্মিনাল ঠিকানা",
          SubTitle: "উদাহরণ:",
        },

        ApiVersion: {
          Title: "API সংস্করণ (শুধুমাত্র gemini-pro)",
          SubTitle: "একটি নির্দিষ্ট API সংস্করণ নির্বাচন করুন",
        },
        GoogleSafetySettings: {
          Title: "Google সেফটি ফিল্টার স্তর",
          SubTitle: "বিষয়বস্তু ফিল্টার স্তর সেট করুন",
        },
      },
      Baidu: {
        ApiKey: {
          Title: "API কী",
          SubTitle: "স্বনির্ধারিত Baidu API কী ব্যবহার করুন",
          Placeholder: "Baidu API কী",
        },
        SecretKey: {
          Title: "সিক্রেট কী",
          SubTitle: "স্বনির্ধারিত Baidu সিক্রেট কী ব্যবহার করুন",
          Placeholder: "Baidu সিক্রেট কী",
        },
        Endpoint: {
          Title: "ইন্টারফেস ঠিকানা",
          SubTitle: "স্বনির্ধারিত সমর্থিত নয়, .env কনফিগারেশনে চলে যান",
        },
      },
      ByteDance: {
        ApiKey: {
          Title: "ইন্টারফেস কী",
          SubTitle: "স্বনির্ধারিত ByteDance API কী ব্যবহার করুন",
          Placeholder: "ByteDance API কী",
        },
        Endpoint: {
          Title: "ইন্টারফেস ঠিকানা",
          SubTitle: "উদাহরণ:",
        },
      },
      Alibaba: {
        ApiKey: {
          Title: "ইন্টারফেস কী",
          SubTitle: "স্বনির্ধারিত আলিবাবা ক্লাউড API কী ব্যবহার করুন",
          Placeholder: "Alibaba Cloud API কী",
        },
        Endpoint: {
          Title: "ইন্টারফেস ঠিকানা",
          SubTitle: "উদাহরণ:",
        },
      },
      Moonshot: {
        ApiKey: {
          Title: "ইন্টারফেস কী",
          SubTitle: "স্বনির্ধারিত Moonshot API কী ব্যবহার করুন",
          Placeholder: "Moonshot API কী",
        },
        Endpoint: {
          Title: "ইন্টারফেস ঠিকানা",
          SubTitle: "উদাহরণ:",
        },
      },
      DeepSeek: {
        ApiKey: {
          Title: "ইন্টারফেস কী",
          SubTitle: "স্বনির্ধারিত DeepSeek API কী ব্যবহার করুন",
          Placeholder: "DeepSeek API কী",
        },
        Endpoint: {
          Title: "ইন্টারফেস ঠিকানা",
          SubTitle: "উদাহরণ:",
        },
      },
      XAI: {
        ApiKey: {
          Title: "ইন্টারফেস কী",
          SubTitle: "স্বনির্ধারিত XAI API কী ব্যবহার করুন",
          Placeholder: "XAI API কী",
        },
        Endpoint: {
          Title: "ইন্টারফেস ঠিকানা",
          SubTitle: "উদাহরণ:",
        },
      },
      SiliconFlow: {
        ApiKey: {
          Title: "ইন্টারফেস কী",
          SubTitle: "স্বনির্ধারিত SiliconFlow API কী ব্যবহার করুন",
          Placeholder: "SiliconFlow API কী",
        },
        Endpoint: {
          Title: "ইন্টারফেস ঠিকানা",
          SubTitle: "উদাহরণ:",
        },
      },
      ChatGLM: {
        ApiKey: {
          Title: "API কী",
          SubTitle: "স্বনির্ধারিত ChatGLM API কী ব্যবহার করুন",
          Placeholder: "ChatGLM API কী",
        },
        Endpoint: {
          Title: "ইন্টারফেস ঠিকানা",
          SubTitle: "উদাহরণ:",
        },
      },
      Iflytek: {
        ApiKey: {
          Title: "ApiKey",
          SubTitle: "iFlytek Spark কনসোল থেকে ApiKey পান",
          Placeholder: "ApiKey",
        },
        ApiSecret: {
          Title: "ApiSecret",
          SubTitle: "iFlytek Spark কনসোল থেকে ApiSecret পান",
          Placeholder: "ApiSecret",
        },
        Endpoint: {
          Title: "ইন্টারফেস ঠিকানা",
          SubTitle: "উদাহরণ:",
        },
      },
      AI302: {
        ApiKey: {
          Title: "ইন্টারফেস কী",
          SubTitle: "স্বনির্ধারিত 302.AI API কী ব্যবহার করুন",
          Placeholder: "302.AI API কী",
        },
        Endpoint: {
          Title: "ইন্টারফেস ঠিকানা",
          SubTitle: "উদাহরণ:",
        },
      },
      CustomProvider: {
        Add: {
          Title: "কাস্টম প্রভাইডার যোগ করুন",
          Button: "কাস্টম প্রভাইডার যোগ করুন",
          Description:
            "বিদ্যমান প্রভাইডার প্রকারের উপর ভিত্তি করে কাস্টম চ্যানেল যোগ করুন",
        },
        Modal: {
          Title: "কাস্টম প্রভাইডার যোগ করুন",
          Name: {
            Title: "প্রভাইডারের নাম",
            Placeholder: "কাস্টম প্রভাইডারের নাম প্রবেশ করান",
            Required: "অনুগ্রহ করে প্রভাইডারের নাম প্রবেশ করান",
            Unique:
              "প্রভাইডারের নাম ইতিমধ্যে বিদ্যমান, অনুগ্রহ করে অন্য নাম ব্যবহার করুন",
          },
          Type: {
            Title: "প্রভাইডারের প্রকার",
            OpenAI: "OpenAI - OpenAI API সামঞ্জস্যপূর্ণ পরিষেবা",
            Google: "Google - Google Gemini API",
            Anthropic: "Anthropic - Anthropic Claude API",
          },
          ApiKey: {
            Title: "API কী",
            Placeholder: "API কী প্রবেশ করান",
            Required: "অনুগ্রহ করে API কী প্রবেশ করান",
          },
          Endpoint: {
            Title: "কাস্টম এন্ডপয়েন্ট",
            Placeholder: "ডিফল্ট এন্ডপয়েন্ট ব্যবহার করতে খালি রাখুন",
            Optional: "(ঐচ্ছিক)",
          },
          Cancel: "বাতিল",
          Confirm: "যোগ করুন",
        },
        Config: {
          Type: "প্রভাইডারের প্রকার",
          BasedOn: "ভিত্তি করে",
          ApiKeyDescription: "কাস্টম প্রভাইডারের জন্য API কী",
          EndpointDescription: "কাস্টম API এন্ডপয়েন্ট ঠিকানা",
          EndpointPlaceholder: "API এন্ডপয়েন্ট ঠিকানা",
          Delete: {
            Title: "প্রভাইডার মুছে ফেলুন",
            SubTitle: "এই কাস্টম প্রভাইডার এবং এর সমস্ত সেটিংস মুছে ফেলুন",
            Button: "মুছে ফেলুন",
            Confirm: "আপনি কি নিশ্চিত যে আপনি কাস্টম প্রভাইডার মুছে ফেলতে চান",
            ConfirmSuffix: "?",
          },
        },
      },
    },

    Model: "মডেল (model)",
    CompressModel: {
      Title: "সংকোচন মডেল",
      SubTitle: "ইতিহাস সংকুচিত করার জন্য ব্যবহৃত মডেল",
    },
    Temperature: {
      Title: "যাদুকরিতা (temperature)",
      SubTitle: "মান বাড়ালে উত্তর বেশি এলোমেলো হবে",
    },
    TopP: {
      Title: "নিউক্লিয়ার স্যাম্পলিং (top_p)",
      SubTitle: "যাদুকরিতা মত, কিন্তু একসাথে পরিবর্তন করবেন না",
    },
    MaxTokens: {
      Title: "একটি উত্তর সীমা (max_tokens)",
      SubTitle: "প্রতি ইন্টারঅ্যাকশনে সর্বাধিক টোকেন সংখ্যা",
    },
    PresencePenalty: {
      Title: "বিষয়বস্তু তাজা (presence_penalty)",
      SubTitle: "মান বাড়ালে নতুন বিষয়ে প্রসারিত হওয়ার সম্ভাবনা বেশি",
    },
    FrequencyPenalty: {
      Title: "ফ্রিকোয়েন্সি পেনাল্টি (frequency_penalty)",
      SubTitle: "মান বাড়ালে পুনরাবৃত্তি শব্দ কমানোর সম্ভাবনা বেশি",
    },
    TTS: {
      Enable: {
        Title: "TTS চালু করুন",
        SubTitle: "টেক্সট-টু-স্পিচ পরিষেবা চালু করুন",
      },
      Autoplay: {
        Title: "অটোপ্লে চালু করুন",
        SubTitle:
          "স্বয়ংক্রিয়ভাবে কণ্ঠ তৈরি এবং প্লে করুন, টেক্সট-টু-স্পিচ সুইচ চালু করতে হবে",
      },
      Model: "মডেল",
      Engine: "রূপান্তর ইঞ্জিন",
      EngineConfig: {
        Title: "কনফিগারেশন নোট",
        SubTitle:
          "OpenAI-TTS মডেল পরিষেবার মধ্যে OpenAI প্রভাইডার কনফিগারেশন ব্যবহার করবে। ব্যবহার করার আগে অনুগ্রহ করে সংশ্লিষ্ট API কী OpenAI প্রভাইডারে যোগ করুন",
      },
      Voice: {
        Title: "কণ্ঠ",
        SubTitle: "কণ্ঠ তৈরির সময় ব্যবহৃত কণ্ঠ",
      },
      Speed: {
        Title: "গতি",
        SubTitle: "তৈরি কণ্ঠের গতি",
      },
    },
    Realtime: {
      Enable: {
        Title: "রিয়েলটাইম কথোপকথন",
        SubTitle: "রিয়েলটাইম কথোপকথন বৈশিষ্ট্য চালু করুন",
      },
      Provider: {
        Title: "মডেল প্রভাইডার",
        SubTitle: "বিভিন্ন প্রভাইডারের মধ্যে স্যুইচ করুন",
      },
      Model: {
        Title: "মডেল",
        SubTitle: "একটি মডেল নির্বাচন করুন",
      },
      ApiKey: {
        Title: "API কী",
        SubTitle: "API কী",
        Placeholder: "API কী",
      },
      Azure: {
        Endpoint: {
          Title: "এন্ডপয়েন্ট",
          SubTitle: "এন্ডপয়েন্ট",
        },
        Deployment: {
          Title: "ডিপ্লয়মেন্ট নাম",
          SubTitle: "ডিপ্লয়মেন্ট নাম",
        },
      },
      Temperature: {
        Title: "যাদুকরিতা (temperature)",
        SubTitle: "উচ্চ মান আরও এলোমেলো প্রতিক্রিয়া তৈরি করে",
      },
    },
  },
  Store: {
    DefaultTopic: "ডিফল্ট বিষয়",
    BotHello: "আপনার জন্য কিছু করতে পারি?",
    Error: "একটি ত্রুটি ঘটেছে, পরে আবার চেষ্টা করুন",
    Prompt: {
      History: (content: string) =>
        "এটি পূর্ববর্তী চ্যাটের সারাংশ হিসেবে ব্যবহৃত হবে: " + content,
      Topic:
        "এই বাক্যের জন্য চার থেকে পাঁচটি শব্দ দিয়ে একটি সংক্ষিপ্ত থিম তৈরি করুন, কোন ব্যাখ্যা, বিস্ময়সূচক চিহ্ন, ভাষা, অতিরিক্ত টেক্সট বা বোল্ড ব্যবহার করবেন না। যদি কোনো থিম না থাকে তবে সরাসরি 'আলাপচারিতা' বলুন",
      Summarize:
        "আলোচনার বিষয়বস্তু সংক্ষিপ্তভাবে সারাংশ করুন, পরবর্তী কনটেক্সট প্রম্পট হিসেবে ব্যবহারের জন্য, ২০০ শব্দের মধ্যে সীমাবদ্ধ রাখুন",
    },
  },
  Copy: {
    Success: "ক্লিপবোর্ডে লেখা হয়েছে",
    Failed: "কপি ব্যর্থ হয়েছে, দয়া করে ক্লিপবোর্ড অনুমতি প্রদান করুন",
  },
  Download: {
    Success: "বিষয়বস্তু আপনার ডিরেক্টরিতে ডাউনলোড করা হয়েছে।",
    Failed: "ডাউনলোড ব্যর্থ হয়েছে।",
  },
  Context: {
    Toast: (x: any) => `${x}টি পূর্বনির্ধারিত প্রম্পট অন্তর্ভুক্ত`,
    Edit: "বর্তমান চ্যাট সেটিংস",
    Add: "একটি নতুন চ্যাট যোগ করুন",
    Clear: "প্রসঙ্গ পরিষ্কার করা হয়েছে",
    Revert: "প্রসঙ্গ পুনরুদ্ধার করুন",
  },

  ChatSettings: {
    Name: "চ্যাট সেটিংস",
  },
  Mcp: {
    Name: "MCP",
  },
  FineTuned: {
    Sysmessage: "আপনি একজন সহকারী",
  },
  SearchChat: {
    Name: "অনুসন্ধান",
    Page: {
      Title: "চ্যাট রেকর্ড অনুসন্ধান করুন",
      Search: "অনুসন্ধান কীওয়ার্ড লিখুন",
      NoResult: "কোন ফলাফল পাওয়া যায়নি",
      NoData: "কোন তথ্য নেই",
      Loading: "লোড হচ্ছে",

      SubTitle: (count: number) => `${count} টি ফলাফল পাওয়া গেছে`,
    },
    Item: {
      View: "দেখুন",
    },
  },
  Mask: {
    Name: "মাস্ক",
    DefaultName: "ডিফল্ট মাস্ক",
    Management: "মাস্ক ব্যবস্থাপনা",
    NewMask: "নতুন মাস্ক",
    DefaultModel: "ডিফল্ট মডেল",
    DefaultModelDesc: "নতুন চ্যাটের জন্য ডিফল্ট মডেল",
    UseGlobalModel: "গ্লোবাল ডিফল্ট মডেল ব্যবহার করুন",
    ConversationCount: (count: number) =>
      `${count} চ্যাট${count !== 1 ? "" : ""}`,
    Page: {
      Title: "পূর্বনির্ধারিত চরিত্র মাস্ক",
      SubTitle: (count: number) => `${count}টি পূর্বনির্ধারিত চরিত্র সংজ্ঞা`,
      Search: "চরিত্র মাস্ক অনুসন্ধান করুন",
      Create: "নতুন তৈরি করুন",
    },
    Item: {
      Info: (count: number) => `ভিতরে ${count}টি পূর্বনির্ধারিত চ্যাট রয়েছে`,
      Chat: "চ্যাট",
      View: "দেখুন",
      Edit: "সম্পাদনা করুন",
      Delete: "মুছে ফেলুন",
      DeleteConfirm: "মুছে ফেলার জন্য নিশ্চিত করুন?",
    },
    EditModal: {
      Title: "সহকারী সম্পাদনা করুন",
      Download: "পূর্বনির্ধারিত ডাউনলোড করুন",
      Clone: "পূর্বনির্ধারিত ক্লোন করুন",
    },
    Config: {
      Avatar: "চরিত্রের চিত্র",
      Name: "চরিত্রের নাম",
      Sync: {
        Title: "গ্লোবাল সেটিংস ব্যবহার করুন",
        SubTitle: "বর্তমান চ্যাট গ্লোবাল মডেল সেটিংস ব্যবহার করছে কি না",
        Confirm:
          "বর্তমান চ্যাটের কাস্টম সেটিংস স্বয়ংক্রিয়ভাবে ওভাররাইট হবে, গ্লোবাল সেটিংস সক্রিয় করতে নিশ্চিত?",
      },
      HideContext: {
        Title: "প্রসঙ্গ প্রম্পট লুকান",
        SubTitle: "চ্যাটে প্রসঙ্গ প্রম্পট প্রদর্শন করা হবে না",
      },
      Artifacts: {
        Title: "আর্টিফ্যাক্টস চালু করুন",
        SubTitle: "চালু হলে, সরাসরি HTML পৃষ্ঠাগুলি প্রদর্শন করার অনুমতি দেয়",
      },
      CodeFold: {
        Title: "কোড ফোল্ড চালু করুন",
        SubTitle:
          "চালু হলে, দীর্ঘ কোড ব্লকগুলি স্বয়ংক্রিয়ভাবে ভাঁজ/অনুভাঁজ করা যেতে পারে",
      },
      Share: {
        Title: "এই মাস্ক শেয়ার করুন",
        SubTitle: "এই মাস্কের জন্য একটি সরাসরি লিঙ্ক তৈরি করুন",
        Action: "লিঙ্ক কপি করুন",
      },
    },
  },
  NewChat: {
    Return: "ফিরে যান",
    Skip: "সরাসরি শুরু করুন",
    Title: "একটি মাস্ক নির্বাচন করুন",
    SubTitle: "এখনই শুরু করুন, মাস্কের পিছনের চিন্তাভাবনার সাথে যোগাযোগ করুন",
    More: "সব দেখুন",
    Less: "কোড ভাঁজ করুন",
    ShowCode: "কোড দেখান",
    Preview: "প্রিভিউ",
    NotShow: "আর দেখাবেন না",
    ConfirmNoShow:
      "আপনি কি নিশ্চিত যে আপনি এটি বন্ধ করতে চান? বন্ধ করার পরে, আপনি যেকোনো সময় সেটিংসে এটি পুনরায় চালু করতে পারেন।",
    Searching: "অনুসন্ধান করা হচ্ছে...",
    Search: "অনুসন্ধান",
    NoSearch: "কোনো অনুসন্ধান ফলাফল নেই",
    SearchFormat: (SearchTime?: number) =>
      SearchTime !== undefined
        ? `(অনুসন্ধানে ${Math.round(SearchTime / 1000)} সেকেন্ড লাগে)`
        : "",
    Thinking: "চিন্তা করা হচ্ছে...",
    Think: "চিন্তার বিষয়বস্তু",
    NoThink: "কোনো চিন্তার বিষয়বস্তু নেই",
    ThinkFormat: (thinkingTime?: number) =>
      thinkingTime !== undefined
        ? `(চিন্তা করতে ${Math.round(thinkingTime / 1000)} সেকেন্ড লাগে)`
        : "",
  },

  URLCommand: {
    Code: "লিঙ্কে অ্যাক্সেস কোড সনাক্ত করা হয়েছে, অটো পূরণ করতে চান?",
    Settings:
      "লিঙ্কে প্রাক-নির্ধারিত সেটিংস সনাক্ত করা হয়েছে, অটো পূরণ করতে চান?",
  },

  UI: {
    Confirm: "নিশ্চিত করুন",
    Cancel: "বাতিল করুন",
    Close: "বন্ধ করুন",
    Create: "নতুন তৈরি করুন",
    Edit: "সম্পাদনা করুন",
    Export: "রপ্তানি করুন",
    Import: "আমদানি করুন",
    Sync: "সিঙ্ক",
    Config: "কনফিগারেশন",
  },
  Exporter: {
    Description: {
      Title: "শুধুমাত্র প্রসঙ্গ পরিষ্কার করার পরে বার্তাগুলি প্রদর্শিত হবে",
    },
    Model: "মডেল",
    Messages: "বার্তা",
    Topic: "থিম",
    Time: "সময়",
  },
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type LocaleType = typeof bn;
export type PartialLocaleType = DeepPartial<typeof bn>;

export default bn;
