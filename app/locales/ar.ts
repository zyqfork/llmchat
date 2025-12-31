import { getClientConfig } from "../config/client";
import { SubmitKey } from "../store/config";
import { SAAS_CHAT_UTM_URL } from "@/app/constant";

const isApp = !!getClientConfig()?.isApp;

const ar = {
  WIP: "قريبًا...",
  Error: {
    Unauthorized: isApp
      ? `😆 واجهت المحادثة بعض المشكلات، لا داعي للقلق:
    \\ 1️⃣ إذا كنت ترغب في تجربة دون إعداد، [انقر هنا لبدء المحادثة فورًا 🚀](${SAAS_CHAT_UTM_URL})
    \\ 2️⃣ إذا كنت تريد استخدام موارد OpenAI الخاصة بك، انقر [هنا](/#/settings) لتعديل الإعدادات ⚙️`
      : `😆 واجهت المحادثة بعض المشكلات، لا داعي للقلق:
    \ 1️⃣ إذا كنت ترغب في تجربة دون إعداد، [انقر هنا لبدء المحادثة فورًا 🚀](${SAAS_CHAT_UTM_URL})
    \ 2️⃣ إذا كنت تستخدم إصدار النشر الخاص، انقر [هنا](/#/auth) لإدخال مفتاح الوصول 🔑
    \ 3️⃣ إذا كنت تريد استخدام موارد OpenAI الخاصة بك، انقر [هنا](/#/settings) لتعديل الإعدادات ⚙️
 `,
  },
  Auth: {
    Title: "تحتاج إلى كلمة مرور",
    Tips: "قام المشرف بتفعيل التحقق بكلمة المرور، يرجى إدخال رمز الوصول أدناه",
    SubTips: "أو إدخال مفتاح API الخاص بـ OpenAI أو Google",
    Input: "أدخل رمز الوصول هنا",
    Confirm: "تأكيد",
    Later: "في وقت لاحق",
    Return: "عودة",
    SaasTips: "",
    TopTips: "",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} محادثة`,
  },
  Chat: {
    MultiModel: {
      Title: "إعدادات الدردشة متعددة النماذج",
      Enabled: "متعدد النماذج (مفعّل)",
      Disabled: "متعدد النماذج (معطّل)",
      Count: (count: number) => `${count} نماذج`,
      Description:
        "🎯 تم تفعيل وضع الساحة متعددة النماذج! انقر على محدد النماذج لاختيار نماذج متعددة للمحادثة.",
      OpenSelector: "فتح محدد النماذج",
      AlreadySelected: (count: number) => `(${count} محدد)`,
      Tips: "💡 نصيحة: في وضع متعدد النماذج، يمكنك تحديد نماذج متعددة في وقت واحد، وكل نموذج سيرد على رسائلك بشكل مستقل، مما يسمح لك بمقارنة ردود مختلف النماذج.",
      EnableToast:
        "🎯 تم تفعيل وضع متعدد النماذج! انقر على محدد النماذج لاختيار نماذج متعددة لساحة المحادثة",
      DisableToast: "تم تعطيل وضع متعدد النماذج",
      MinimumModelsError:
        "يرجى تحديد نموذجين على الأقل لتفعيل المحادثات متعددة النماذج",
      ModelsSelectedToast: (count: number) => `${count} نماذج محددة للمحادثة`,
    },
    UI: {
      SidebarToggle: "طي/توسيع الشريط الجانبي",
      SearchModels: "بحث عن نماذج...",
      SelectModel: "اختر نموذجًا",
      ContextTooltip: {
        Current: (current: number, max: number) =>
          `السياق الحالي: ${current} / ${max}`,
        CurrentTokens: (current: number, max: number) =>
          `الرموز الحالية: ${current.toLocaleString()} / ${max.toLocaleString()}`,
        CurrentTokensUnknown: (current: number) =>
          `الرموز الحالية: ${current.toLocaleString()} / غير معروف`,
        EstimatedTokens: (estimated: number) =>
          `الرموز المقدرة: ${estimated.toLocaleString()}`,
        ContextTokens: (tokens: string) => `السياق: ${tokens} رمز`,
      },
    },
    SubTitle: (count: number) => `إجمالي ${count} محادثة`,
    EditMessage: {
      Title: "تحرير سجل الرسائل",
      Topic: {
        Title: "موضوع الدردشة",
        SubTitle: "تغيير موضوع الدردشة الحالي",
      },
    },
    Actions: {
      ChatList: "عرض قائمة الرسائل",
      CompressedHistory: "عرض التاريخ المضغوط",
      Export: "تصدير سجل الدردشة",
      Copy: "نسخ",
      Stop: "إيقاف",
      Retry: "إعادة المحاولة",
      Pin: "تثبيت",
      PinToastContent: "تم تثبيت 1 محادثة في الإشعارات المسبقة",
      PinToastAction: "عرض",
      Delete: "حذف",
      Edit: "تحرير",
      FullScreen: "ملء الشاشة",
      RefreshTitle: "تحديث العنوان",
      RefreshToast: "تم إرسال طلب تحديث العنوان",
      Speech: "تشغيل",
      StopSpeech: "إيقاف",
      PreviousVersion: "الإصدار السابق",
      NextVersion: "الإصدار التالي",
      Debug: "تصحيح الأخطاء",
      CopyAsCurl: "نسخ كـ cURL",
    },
    Commands: {
      new: "دردشة جديدة",
      newm: "إنشاء دردشة من القناع",
      next: "الدردشة التالية",
      prev: "الدردشة السابقة",
      clear: "مسح السياق",
      fork: "نسخ المحادثة",
      del: "حذف الدردشة",
    },
    InputActions: {
      Stop: "إيقاف الرد",
      ToBottom: "الانتقال إلى الأحدث",
      Theme: {
        auto: "موضوع تلقائي",
        light: "الوضع الفاتح",
        dark: "الوضع الداكن",
      },
      Prompt: "الأوامر السريعة",
      Masks: "جميع الأقنعة",
      Clear: "مسح الدردشة",
      Optimize: "تحسين الطلب",
      OptimizeToast: "✨ جارٍ تحسين طلبك...",
      OptimizeSuccess: "✅ تم تحسين الطلب",
      OptimizeError: "❌ فشل التحسين، يرجى المحاولة مرة أخرى",
      Reset: "إعادة تعيين المحادثة",
      ResetConfirm:
        "هل أنت متأكد من أنك تريد إعادة تعيين كامل محتوى نافذة الدردشة الحالية؟",
      Settings: "إعدادات الدردشة",
      UploadImage: "تحميل صورة",
      Search: "بحث",
      SearchOn: "البحث مفعّل",
      SearchOff: "البحث معطّل",
      SearchEnabledToast: "🔍 تم تفعيل ميزة البحث! يمكنك الآن البحث على الويب",
      SearchDisabledToast: "❌ تم تعطيل ميزة البحث",
    },
    MCP: {
      Title: "إدارة أدوات MCP",
      Enable: "تفعيل ميزات MCP",
      EnableDesc:
        "عند التفعيل، تكون أدوات MCP متاحة. عند التعطيل، لن يتم إرسال المطالبات المتعلقة بـ MCP",
      NoTools: "لا توجد أدوات MCP متاحة",
      Loading: "جارٍ التحميل...",
      ClientFailed: "فشل تحميل عميل MCP، معالجة صامتة",
      ToolsCount: (count: number) => `${count} أدوات`,
    },
    Rename: "إعادة تسمية الدردشة",
    Typing: "يكتب…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} إرسال`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "، Shift + Enter لإدراج سطر جديد";
      }
      return inputHints + "، / لتفعيل الإكمال التلقائي، : لتفعيل الأوامر";
    },
    Send: "إرسال",
    TokenUsage: "الاستخدام",
    TokenTooltip: {
      Context: "السياق الحالي",
      CurrentToken: "الرموز الحالية",
      EstimatedToken: "الرموز المقدرة",
      Unknown: "غير معروف",
    },
    StartSpeak: "ابدأ التحدث",
    StopSpeak: "أوقف التحدث",
    Config: {
      Reset: "مسح الذاكرة",
      SaveAs: "حفظ كقناع",
    },
    IsContext: "الإشعارات المسبقة",
    ShortcutKey: {
      Title: "مفاتيح الاختصار",
      newChat: "فتح دردشة جديدة",
      focusInput: "التركيز على حقل الإدخال",
      copyLastMessage: "نسخ آخر رد",
      copyLastCode: "نسخ آخر كود",
      showShortcutKey: "إظهار مفاتيح الاختصار",
      clearContext: "مسح السياق",
    },
    Thinking: {
      Title: "عمق التفكير",
      Dynamic: "تفكير ديناميكي",
      DynamicDesc: "النموذج يحدد تلقائيًا عمق التفكير",
      Off: "التفكير معطل",
      OffDesc: "لا توجد عملية تفكير",
      Light: "تفكير خفيف",
      LightDesc: "1024 رمز",
      Medium: "تفكير متوسط",
      MediumDesc: "4096 رمز",
      Deep: "تفكير عميق",
      DeepDesc: "8192 رمز",
      VeryDeep: "تفكير عميق جدًا",
      VeryDeepDesc: "16384 رمز",
      Notice: "النماذج التي تدعم thinkingBudget فقط يمكنها ضبط عمق التفكير",
      ClaudeNotice: "نماذج سلسلة Claude فقط يمكنها ضبط عمق التفكير",
      GeminiNotice: "نماذج سلسلة Gemini فقط يمكنها ضبط عمق التفكير",
      ClaudeLight: "تفكير",
      ClaudeLightDesc: "5000 رمز",
      ClaudeMedium: "تفكير جدي",
      ClaudeMediumDesc: "10000 رمز",
      ClaudeDeep: "تفكير أكثر جدية",
      ClaudeDeepDesc: "20000 رمز",
      ClaudeVeryDeep: "تفكير فائق",
      ClaudeVeryDeepDesc: "32000 رمز",
      ClaudeDynamicDesc: "ضبط عمق التفكير تلقائيًا (افتراضيًا 10000 رمز)",
    },
  },
  Export: {
    Title: "مشاركة سجل الدردشة",
    Copy: "نسخ الكل",
    Download: "تحميل الملف",
    Share: "مشاركة على ShareGPT",
    MessageFromYou: "المستخدم",
    MessageFromChatGPT: "ChatGPT",
    Format: {
      Title: "تنسيق التصدير",
      SubTitle: "يمكنك تصدير النص كـ Markdown أو صورة PNG",
    },
    IncludeContext: {
      Title: "تضمين سياق القناع",
      SubTitle: "هل تريد عرض سياق القناع في الرسائل",
    },
    Steps: {
      Select: "اختيار",
      Preview: "معاينة",
    },
    Image: {
      Toast: "جارٍ إنشاء لقطة شاشة",
      Modal: "اضغط مطولًا أو انقر بزر الماوس الأيمن لحفظ الصورة",
    },
    Artifacts: {
      Title: "طباعة الصفحة",
      Error: "خطأ في الطباعة",
    },
  },
  Select: {
    Search: "بحث في الرسائل",
    All: "تحديد الكل",
    Latest: "أحدث الرسائل",
    Clear: "مسح التحديد",
  },
  Memory: {
    Title: "ملخص التاريخ",
    EmptyContent: "محتوى المحادثة قصير جداً، لا حاجة للتلخيص",
    Send: "ضغط تلقائي لسجل الدردشة كـ سياق",
    Copy: "نسخ الملخص",
    Reset: "[غير مستخدم]",
    ResetConfirm: "تأكيد مسح ملخص التاريخ؟",
  },
  Home: {
    NewChat: "دردشة جديدة",
    DeleteChat: "تأكيد حذف المحادثة المحددة؟",
    DeleteToast: "تم حذف المحادثة",
    Revert: "تراجع",
  },
  Settings: {
    Title: "الإعدادات",
    SubTitle: "جميع خيارات الإعدادات",
    ShowPassword: "إظهار كلمة المرور",

    Tab: {
      General: "الإعدادات العامة",
      Sync: "مزامنة السحابة",
      Mask: "القناع",
      Prompt: "الإشعار",
      ModelService: "خدمة النموذج",
      ModelConfig: "تكوين النموذج",
      Voice: "الصوت",
    },

    Danger: {
      Reset: {
        Title: "إعادة تعيين جميع الإعدادات",
        SubTitle: "إعادة تعيين جميع عناصر الإعدادات إلى القيم الافتراضية",
        Action: "إعادة التعيين الآن",
        Confirm: "تأكيد إعادة تعيين جميع الإعدادات؟",
      },
      Clear: {
        Title: "مسح جميع البيانات",
        SubTitle: "مسح جميع الدردشات وبيانات الإعدادات",
        Action: "مسح الآن",
        Confirm: "تأكيد مسح جميع الدردشات وبيانات الإعدادات؟",
      },
    },
    Lang: {
      Name: "Language", // انتبه: إذا كنت ترغب في إضافة ترجمة جديدة، يرجى عدم ترجمة هذه القيمة، اتركها كما هي "Language"
      All: "جميع اللغات",
    },
    Avatar: "الصورة الشخصية",
    FontSize: {
      Title: "حجم الخط",
      SubTitle: "حجم الخط في محتوى الدردشة",
    },
    FontFamily: {
      Title: "خط الدردشة",
      SubTitle: "خط محتوى الدردشة، اتركه فارغًا لتطبيق الخط الافتراضي العالمي",
      Placeholder: "اسم الخط",
    },
    InjectSystemPrompts: {
      Title: "حقن الرسائل النصية النظامية",
      SubTitle:
        "فرض إضافة رسالة نظامية تحاكي ChatGPT في بداية قائمة الرسائل لكل طلب",
    },
    InputTemplate: {
      Title: "معالجة الإدخال من قبل المستخدم",
      SubTitle: "سيتم ملء آخر رسالة من المستخدم في هذا القالب",
    },

    Update: {
      Version: (x: string) => `الإصدار الحالي: ${x}`,
      IsLatest: "أنت على أحدث إصدار",
      CheckUpdate: "التحقق من التحديثات",
      IsChecking: "جارٍ التحقق من التحديثات...",
      FoundUpdate: (x: string) => `تم العثور على إصدار جديد: ${x}`,
      GoToUpdate: "انتقل للتحديث",
      Success: "تم التحديث بنجاح!",
      Failed: "فشل التحديث",
    },
    SendKey: "زر الإرسال",
    Theme: "السمة",
    ColorScheme: {
      Title: "نظام الألوان",
      Options: {
        default: "الأزرق الافتراضي",
        ocean: "أزرق المحيط",
        forest: "أخضر الغابة",
        sunset: "برتقالي الغروب",
        purple: "حلم أرجواني",
        rose: "وردي",
      },
    },
    TightBorder: "وضع بدون حدود",
    SendPreviewBubble: {
      Title: "فقاعة المعاينة",
      SubTitle: "معاينة محتوى Markdown في فقاعة المعاينة",
    },
    AutoGenerateTitle: {
      Title: "توليد العنوان تلقائيًا",
      SubTitle: "توليد عنوان مناسب بناءً على محتوى الدردشة",
    },
    Sync: {
      CloudState: "بيانات السحابة",
      NotSyncYet: "لم يتم التزامن بعد",
      Success: "تم التزامن بنجاح",
      Fail: "فشل التزامن",

      Config: {
        Modal: {
          Title: "تكوين التزامن السحابي",
          Check: "التحقق من التوفر",
        },
        SyncType: {
          Title: "نوع التزامن",
          SubTitle: "اختر خادم التزامن المفضل",
        },
        Proxy: {
          Title: "تفعيل الوكيل",
          SubTitle: "يجب تفعيل الوكيل عند التزامن عبر المتصفح لتجنب قيود CORS",
        },
        ProxyUrl: {
          Title: "عنوان الوكيل",
          SubTitle: "ينطبق فقط على الوكيل المتاح في هذا المشروع",
        },

        WebDav: {
          Endpoint: "عنوان WebDAV",
          UserName: "اسم المستخدم",
          Password: "كلمة المرور",
        },

        UpStash: {
          Endpoint: "رابط UpStash Redis REST",
          UserName: "اسم النسخ الاحتياطي",
          Password: "رمز UpStash Redis REST",
        },
      },

      LocalState: "بيانات محلية",
      Overview: (overview: any) => {
        return `${overview.chat} دردشة، ${overview.message} رسالة، ${overview.prompt} إشعار، ${overview.mask} قناع`;
      },
      ImportFailed: "فشل الاستيراد",
    },
    Mask: {
      ModelIcon: {
        Title: "استخدام أيقونة النموذج كصورة رمزية للذكاء الاصطناعي",
        SubTitle:
          "عند التمكين، ستستخدم الصورة الرمزية للذكاء الاصطناعي في المحادثات أيقونة النموذج الحالي بدلاً من الرموز التعبيرية",
      },
    },
    AccessCode: {
      Title: "رمز الوصول",
      SubTitle: "تم تفعيل التحكم في الوصول، يرجى إدخال رمز الوصول",
      Placeholder: "أدخل رمز الوصول",
      Status: {
        Enabled: "تم تفعيل التحكم في الوصول",
        Valid: "رمز الوصول صالح",
        Invalid: "رمز الوصول غير صالح",
      },
    },
    Prompt: {
      Disable: {
        Title: "تعطيل الإكمال التلقائي للإشعارات",
        SubTitle: "استخدم / في بداية مربع النص لتفعيل الإكمال التلقائي",
      },
      List: "قائمة الإشعارات المخصصة",
      ListCount: (builtin: number, custom: number) =>
        `مدمج ${builtin} إشعار، مخصص ${custom} إشعار`,
      Edit: "تحرير",
      Modal: {
        Title: "قائمة الإشعارات",
        Add: "جديد",
        Search: "بحث عن إشعارات",
      },
      EditModal: {
        Title: "تحرير الإشعارات",
      },
    },
    HistoryCount: {
      Title: "عدد الرسائل التاريخية المرفقة",
      SubTitle: "عدد الرسائل التاريخية المرفقة مع كل طلب",
    },
    CompressThreshold: {
      Title: "عتبة ضغط طول الرسائل التاريخية",
      SubTitle:
        "عندما يتجاوز طول الرسائل التاريخية غير المضغوطة هذه القيمة، سيتم الضغط",
    },

    Access: {
      SaasStart: {
        Title: "",
        Label: "",
        SubTitle: "",
        ChatNow: "",
      },
      AccessCode: {
        Title: "كلمة المرور للوصول",
        SubTitle: "قام المشرف بتمكين الوصول المشفر",
        Placeholder: "أدخل كلمة المرور للوصول",
      },
      CustomEndpoint: {
        Title: "واجهة مخصصة",
        SubTitle: "هل تستخدم خدمة Azure أو OpenAI مخصصة",
      },
      Provider: {
        Title: "مزود الخدمة النموذجية",
        SubTitle: "التبديل بين مقدمي الخدمة المختلفين",
        Name: {
          ByteDance: "ByteDance",
          Alibaba: "Alibaba Cloud",
          Moonshot: "Moonshot",
        },
        Status: {
          Enabled: "مفعّل",
        },
        Models: {
          Title: "النماذج المفعّلة",
          SubTitle: "قائمة النماذج المفعّلة لدى المزود الحالي",
          NoModels: "لا توجد نماذج مفعّلة",
          Manage: "إدارة",
        },
        Description: {
          OpenAI: "نماذج سلسلة OpenAI GPT",
          Azure: "خدمة Microsoft Azure OpenAI",
          Google: "نماذج سلسلة Google Gemini",
          Anthropic: "نماذج سلسلة Anthropic Claude",
          ByteDance: "نماذج سلسلة ByteDance Doubao",
          Alibaba: "نماذج سلسلة Alibaba Cloud Qwen",
          Moonshot: "نماذج سلسلة Moonshot Kimi",
          DeepSeek: "نماذج سلسلة DeepSeek",
          XAI: "نماذج سلسلة xAI Grok",
          SiliconFlow: "SiliconFlow",
          Custom: "مخصص",
        },
        Terms: {
          Provider: "مزود",
        },
      },
      OpenAI: {
        ApiKey: {
          Title: "مفتاح API OpenAI",
          SubTitle: "استخدم مفتاح OpenAI مخصص",
          Placeholder: "sk-xxx",
        },

        Endpoint: {
          Title: "نقطة النهاية OpenAI",
          SubTitle: "يجب أن يبدأ بـ http(s):// أو استخدام /api/openAI كافتراضي",
        },
      },
      Azure: {
        ApiKey: {
          Title: "مفتاح API Azure",
          SubTitle: "تحقق من مفتاح API الخاص بك من وحدة تحكم Azure",
          Placeholder: "مفتاح API Azure",
        },

        Endpoint: {
          Title: "نقطة النهاية Azure",
          SubTitle: "مثال: ",
        },

        ApiVerion: {
          Title: "إصدار API Azure",
          SubTitle: "تحقق من إصدار API الخاص بك من وحدة تحكم Azure",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "مفتاح API Anthropic",
          SubTitle: "استخدم مفتاح Anthropic مخصص لتجاوز قيود الوصول",
          Placeholder: "مفتاح API Anthropic",
        },

        Endpoint: {
          Title: "عنوان نقطة النهاية",
          SubTitle: "مثال: ",
        },

        ApiVerion: {
          Title: "إصدار API (إصدار API Claude)",
          SubTitle: "اختر وأدخل إصدار API محددًا",
        },
      },
      Google: {
        ApiKey: {
          Title: "مفتاح API",
          SubTitle: "احصل على مفتاح API الخاص بك من Google AI",
          Placeholder: "أدخل مفتاح Google AI Studio API الخاص بك",
        },

        Endpoint: {
          Title: "عنوان نقطة النهاية",
          SubTitle: "مثال: ",
        },

        ApiVersion: {
          Title: "إصدار API (مخصص فقط لـ gemini-pro)",
          SubTitle: "اختر إصدار API محددًا",
        },
        GoogleSafetySettings: {
          Title: "مستوى تصفية الأمان من Google",
          SubTitle: "تعيين مستوى تصفية المحتوى",
        },
      },
      Baidu: {
        ApiKey: {
          Title: "مفتاح API",
          SubTitle: "استخدم مفتاح Baidu API مخصص",
          Placeholder: "مفتاح Baidu API",
        },
        SecretKey: {
          Title: "المفتاح السري",
          SubTitle: "استخدم مفتاح Baidu Secret مخصص",
          Placeholder: "مفتاح Baidu Secret",
        },
        Endpoint: {
          Title: "عنوان نقطة النهاية",
          SubTitle: "لا يدعم التخصيص، انتقل إلى .env للتكوين",
        },
      },
      Tencent: {
        ApiKey: {
          Title: "مفتاح API",
          SubTitle: "استخدم مفتاح Tencent API مخصص",
          Placeholder: "مفتاح Tencent API",
        },
        SecretKey: {
          Title: "المفتاح السري",
          SubTitle: "استخدم مفتاح Tencent Secret مخصص",
          Placeholder: "مفتاح Tencent Secret",
        },
        Endpoint: {
          Title: "عنوان نقطة النهاية",
          SubTitle: "لا يدعم التخصيص، انتقل إلى .env للتكوين",
        },
      },
      ByteDance: {
        ApiKey: {
          Title: "مفتاح الواجهة",
          SubTitle: "استخدم مفتاح ByteDance API مخصص",
          Placeholder: "مفتاح ByteDance API",
        },
        Endpoint: {
          Title: "عنوان نقطة النهاية",
          SubTitle: "مثال: ",
        },
      },
      Alibaba: {
        ApiKey: {
          Title: "مفتاح الواجهة",
          SubTitle: "استخدم مفتاح Alibaba Cloud API مخصص",
          Placeholder: "مفتاح Alibaba Cloud API",
        },
        Endpoint: {
          Title: "عنوان نقطة النهاية",
          SubTitle: "مثال: ",
        },
      },
      Moonshot: {
        ApiKey: {
          Title: "مفتاح الواجهة",
          SubTitle: "استخدم مفتاح Moonshot API مخصص",
          Placeholder: "مفتاح Moonshot API",
        },
        Endpoint: {
          Title: "عنوان نقطة النهاية",
          SubTitle: "مثال: ",
        },
      },
      DeepSeek: {
        ApiKey: {
          Title: "مفتاح الواجهة",
          SubTitle: "استخدم مفتاح DeepSeek API مخصص",
          Placeholder: "مفتاح DeepSeek API",
        },
        Endpoint: {
          Title: "عنوان نقطة النهاية",
          SubTitle: "مثال: ",
        },
      },
      XAI: {
        ApiKey: {
          Title: "مفتاح الواجهة",
          SubTitle: "استخدم مفتاح XAI API مخصص",
          Placeholder: "مفتاح XAI API",
        },
        Endpoint: {
          Title: "عنوان نقطة النهاية",
          SubTitle: "مثال: ",
        },
      },
      SiliconFlow: {
        ApiKey: {
          Title: "مفتاح الواجهة",
          SubTitle: "استخدم مفتاح SiliconFlow API مخصص",
          Placeholder: "مفتاح SiliconFlow API",
        },
        Endpoint: {
          Title: "عنوان نقطة النهاية",
          SubTitle: "مثال: ",
        },
      },
      ChatGLM: {
        ApiKey: {
          Title: "مفتاح API",
          SubTitle: "استخدم مفتاح ChatGLM API مخصص",
          Placeholder: "مفتاح ChatGLM API",
        },
        Endpoint: {
          Title: "عنوان نقطة النهاية",
          SubTitle: "مثال: ",
        },
      },
      Iflytek: {
        ApiKey: {
          Title: "ApiKey",
          SubTitle: "احصل على ApiKey من وحدة تحكم iFlytek Spark",
          Placeholder: "ApiKey",
        },
        ApiSecret: {
          Title: "ApiSecret",
          SubTitle: "احصل على ApiSecret من وحدة تحكم iFlytek Spark",
          Placeholder: "ApiSecret",
        },
        Endpoint: {
          Title: "عنوان نقطة النهاية",
          SubTitle: "مثال: ",
        },
      },
      AI302: {
        ApiKey: {
          Title: "مفتاح الواجهة",
          SubTitle: "استخدم مفتاح 302.AI API مخصص",
          Placeholder: "مفتاح 302.AI API",
        },
        Endpoint: {
          Title: "عنوان نقطة النهاية",
          SubTitle: "مثال: ",
        },
      },
      CustomProvider: {
        Add: {
          Title: "إضافة مزود مخصص",
          Button: "إضافة مزود مخصص",
          Description: "إضافة قناة مخصصة بناءً على أنواع المزودين الموجودة",
        },
        Modal: {
          Title: "إضافة مزود مخصص",
          Name: {
            Title: "اسم المزود",
            Placeholder: "أدخل اسم المزود المخصص",
            Required: "يرجى إدخال اسم المزود",
            Unique: "اسم المزود موجود بالفعل، يرجى استخدام اسم آخر",
          },
          Type: {
            Title: "نوع المزود",
            OpenAI: "OpenAI - خدمات متوافقة مع API OpenAI",
            Google: "Google - API Google Gemini",
            Anthropic: "Anthropic - API Anthropic Claude",
          },
          ApiKey: {
            Title: "مفتاح API",
            Placeholder: "أدخل مفتاح API",
            Required: "يرجى إدخال مفتاح API",
          },
          Endpoint: {
            Title: "نقطة النهاية المخصصة",
            Placeholder: "اتركه فارغًا لاستخدام نقطة النهاية الافتراضية",
            Optional: "(اختياري)",
          },
          Cancel: "إلغاء",
          Confirm: "إضافة",
        },
        Config: {
          Type: "نوع المزود",
          BasedOn: "بناءً على",
          ApiKeyDescription: "مفتاح API للمزود المخصص",
          EndpointDescription: "عنوان نقطة نهاية API المخصصة",
          EndpointPlaceholder: "عنوان نقطة نهاية API",
          Delete: {
            Title: "حذف المزود",
            SubTitle: "حذف هذا المزود المخصص وجميع إعداداته",
            Button: "حذف",
            Confirm: "هل أنت متأكد من أنك تريد حذف المزود المخصص",
            ConfirmSuffix: "؟",
          },
        },
      },
    },

    Model: "النموذج",
    CompressModel: {
      Title: "نموذج الضغط",
      SubTitle: "النموذج المستخدم لضغط السجل التاريخي",
    },
    Temperature: {
      Title: "العشوائية (temperature)",
      SubTitle: "كلما زادت القيمة، زادت العشوائية في الردود",
    },
    TopP: {
      Title: "عينات النواة (top_p)",
      SubTitle: "مشابه للعشوائية ولكن لا تغيره مع العشوائية",
    },
    MaxTokens: {
      Title: "الحد الأقصى للرموز لكل رد (max_tokens)",
      SubTitle: "أقصى عدد للرموز في تفاعل واحد",
    },
    PresencePenalty: {
      Title: "تجدد الموضوع (presence_penalty)",
      SubTitle: "كلما زادت القيمة، زادت احتمالية التوسع في مواضيع جديدة",
    },
    FrequencyPenalty: {
      Title: "عقوبة التكرار (frequency_penalty)",
      SubTitle: "كلما زادت القيمة، زادت احتمالية تقليل تكرار الكلمات",
    },
    TTS: {
      Enable: {
        Title: "تمكين TTS",
        SubTitle: "تمكين خدمة تحويل النص إلى كلام",
      },
      Autoplay: {
        Title: "تمكين التشغيل التلقائي",
        SubTitle:
          "إنشاء وتشغيل الكلام تلقائيًا، تحتاج أولاً إلى تمكين مفتاح تحويل النص إلى كلام",
      },
      Model: "النموذج",
      Engine: "محرك التحويل",
      EngineConfig: {
        Title: "ملاحظة التكوين",
        SubTitle:
          "سيقوم OpenAI-TTS باستخدام تكوين مزود OpenAI في خدمات النموذج. يرجى إضافة مفتاح API المقابل في مزود OpenAI قبل الاستخدام",
      },
      Voice: {
        Title: "الصوت",
        SubTitle: "الصوت الذي سيتم استخدامه عند إنشاء الصوت",
      },
      Speed: {
        Title: "السرعة",
        SubTitle: "سرعة الصوت الذي تم إنشاؤه",
      },
    },
    Realtime: {
      Enable: {
        Title: "الدردشة في الوقت الفعلي",
        SubTitle: "تمكين ميزة الدردشة في الوقت الفعلي",
      },
      Provider: {
        Title: "مزود النموذج",
        SubTitle: "التبديل بين مزودين مختلفين",
      },
      Model: {
        Title: "النموذج",
        SubTitle: "اختر نموذجًا",
      },
      ApiKey: {
        Title: "مفتاح API",
        SubTitle: "مفتاح API",
        Placeholder: "مفتاح API",
      },
      Azure: {
        Endpoint: {
          Title: "نقطة النهاية",
          SubTitle: "نقطة النهاية",
        },
        Deployment: {
          Title: "اسم النشر",
          SubTitle: "اسم النشر",
        },
      },
      Temperature: {
        Title: "العشوائية (temperature)",
        SubTitle: "القيم الأعلى تنتج ردودًا أكثر عشوائية",
      },
    },
  },
  Store: {
    DefaultTopic: "دردشة جديدة",
    BotHello: "كيف يمكنني مساعدتك؟",
    Error: "حدث خطأ، يرجى المحاولة مرة أخرى لاحقًا",
    Prompt: {
      History: (content: string) =>
        "هذا ملخص للدردشة السابقة كنقطة انطلاق: " + content,
      Topic:
        "استخدم أربع إلى خمس كلمات لإرجاع ملخص مختصر لهذه الجملة، بدون شرح، بدون علامات ترقيم، بدون كلمات تعبيرية، بدون نص إضافي، بدون تنسيق عريض، إذا لم يكن هناك موضوع، يرجى العودة إلى 'دردشة عامة'",
      Summarize:
        "قم بتلخيص محتوى الدردشة باختصار، لاستخدامه كإشارة سياقية لاحقة، اجعلها في حدود 200 كلمة",
    },
  },
  Copy: {
    Success: "تم الكتابة إلى الحافظة",
    Failed: "فشل النسخ، يرجى منح أذونات الحافظة",
  },
  Download: {
    Success: "تم تنزيل المحتوى إلى مجلدك.",
    Failed: "فشل التنزيل.",
  },
  Context: {
    Toast: (x: any) => `يحتوي على ${x} إشعارات مخصصة`,
    Edit: "إعدادات الدردشة الحالية",
    Add: "إضافة دردشة جديدة",
    Clear: "تم مسح السياق",
    Revert: "استعادة السياق",
  },

  ChatSettings: {
    Name: "إعدادات الدردشة",
  },
  Mcp: {
    Name: "MCP",
  },
  FineTuned: {
    Sysmessage: "أنت مساعد",
  },
  SearchChat: {
    Name: "بحث",
    Page: {
      Title: "البحث في سجلات الدردشة",
      Search: "أدخل كلمات البحث",
      NoResult: "لم يتم العثور على نتائج",
      NoData: "لا توجد بيانات",
      Loading: "جارٍ التحميل",

      SubTitle: (count: number) => `تم العثور على ${count} نتائج`,
    },
    Item: {
      View: "عرض",
    },
  },
  Mask: {
    Name: "القناع",
    DefaultName: "القناع الافتراضي",
    Management: "إدارة الأقنعة",
    NewMask: "قناع جديد",
    DefaultModel: "النموذج الافتراضي",
    DefaultModelDesc: "النموذج الافتراضي للمحادثات الجديدة",
    UseGlobalModel: "استخدام النموذج العالمي الافتراضي",
    ConversationCount: (count: number) =>
      `${count} محادثة${count !== 1 ? "ات" : ""}`,
    Page: {
      Title: "أقنعة الأدوار المحددة مسبقًا",
      SubTitle: (count: number) => `${count} تعريفات أدوار محددة مسبقًا`,
      Search: "بحث عن أقنعة الأدوار",
      Create: "إنشاء",
    },
    Item: {
      Info: (count: number) => `يحتوي على ${count} محادثات محددة مسبقًا`,
      Chat: "دردشة",
      View: "عرض",
      Edit: "تحرير",
      Delete: "حذف",
      DeleteConfirm: "تأكيد الحذف؟",
    },
    EditModal: {
      Title: "تحرير القناع المحدد مسبقًا",
      Download: "تحميل المحدد مسبقًا",
      Clone: "استنساخ المحدد مسبقًا",
    },
    Config: {
      Avatar: "صورة الدور",
      Name: "اسم الدور",
      Sync: {
        Title: "استخدام الإعدادات العامة",
        SubTitle: "استخدام الإعدادات العامة في هذه الدردشة",
        Confirm: "هل تؤكد استبدال الإعدادات المخصصة بالإعدادات العامة؟",
      },
      HideContext: {
        Title: "إخفاء مطالبات السياق",
        SubTitle: "لا تُظهر مطالبات السياق في الدردشة",
      },
      Artifacts: {
        Title: "تمكين القطع الأثرية",
        SubTitle: "عند التمكين، يسمح بعرض صفحات HTML مباشرة",
      },
      CodeFold: {
        Title: "تمكين طي الكود",
        SubTitle: "عند التمكين، يمكن طي/فك كتل الكود الطويلة تلقائيًا",
      },
      Share: {
        Title: "مشاركة هذا القناع",
        SubTitle: "إنشاء رابط لهذا القناع",
        Action: "نسخ الرابط",
      },
    },
  },
  NewChat: {
    Return: "العودة",
    Skip: "ابدأ الآن",
    Title: "اختر قناعًا",
    SubTitle: "تحدث مع الروح خلف القناع",
    More: "العثور على المزيد",
    Less: "طي الكود",
    ShowCode: "إظهار الكود",
    Preview: "معاينة",
    NotShow: "لا تُظهر مرة أخرى",
    ConfirmNoShow: "هل تؤكد التعطيل؟ يمكنك إعادة التمكين لاحقًا في الإعدادات.",
    Searching: "جارٍ البحث...",
    Search: "بحث",
    NoSearch: "لا توجد نتائج بحث",
    SearchFormat: (SearchTime?: number) =>
      SearchTime !== undefined
        ? `(استغرق البحث ${Math.round(SearchTime / 1000)} ثانية)`
        : "",
    Thinking: "جارٍ التفكير...",
    Think: "محتوى التفكير",
    NoThink: "لا يوجد محتوى تفكير",
    ThinkFormat: (thinkingTime?: number) =>
      thinkingTime !== undefined
        ? `(استغرق التفكير ${Math.round(thinkingTime / 1000)} ثانية)`
        : "",
  },

  URLCommand: {
    Code: "تم الكشف عن رمز وصول في الرابط، هل تريد التعبئة التلقائية؟",
    Settings: "تم الكشف عن إعدادات مسبقة في الرابط، هل تريد التعبئة التلقائية؟",
  },

  UI: {
    Confirm: "تأكيد",
    Cancel: "إلغاء",
    Close: "إغلاق",
    Create: "إنشاء",
    Edit: "تحرير",
    Export: "تصدير",
    Import: "استيراد",
    Sync: "مزامنة",
    Config: "تكوين",
  },
  Exporter: {
    Description: {
      Title: "فقط الرسائل بعد مسح السياق سيتم عرضها",
    },
    Model: "النموذج",
    Messages: "الرسائل",
    Topic: "الموضوع",
    Time: "الوقت",
  },
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type LocaleType = typeof ar;
export type PartialLocaleType = DeepPartial<typeof ar>;

export default ar;
