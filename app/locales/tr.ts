import { getClientConfig } from "../config/client";
import { SubmitKey } from "../store/config";
import { SAAS_CHAT_UTM_URL } from "@/app/constant";

const isApp = !!getClientConfig()?.isApp;

const tr = {
  WIP: "Çalışma devam ediyor...",
  Error: {
    Unauthorized: isApp
      ? `😆 Sohbet bazı sorunlarla karşılaştı, endişelenmeyin:
    \\ 1️⃣ Eğer sıfır yapılandırma ile başlamak istiyorsanız, [buraya tıklayarak hemen sohbete başlayın 🚀](${SAAS_CHAT_UTM_URL})
    \\ 2️⃣ Kendi OpenAI kaynaklarınızı kullanmak istiyorsanız, [buraya tıklayarak](/#/settings) ayarları değiştirin ⚙️`
      : `😆 Sohbet bazı sorunlarla karşılaştı, endişelenmeyin:
    \ 1️⃣ Eğer sıfır yapılandırma ile başlamak istiyorsanız, [buraya tıklayarak hemen sohbete başlayın 🚀](${SAAS_CHAT_UTM_URL})
    \ 2️⃣ Eğer özel dağıtım sürümü kullanıyorsanız, [buraya tıklayarak](/#/auth) erişim anahtarını girin 🔑
    \ 3️⃣ Kendi OpenAI kaynaklarınızı kullanmak istiyorsanız, [buraya tıklayarak](/#/settings) ayarları değiştirin ⚙️
 `,
  },
  Auth: {
    Title: "Şifre Gerekli",
    Tips: "Yönetici şifre doğrulamasını etkinleştirdi, lütfen aşağıya erişim kodunu girin",
    SubTips: "Veya OpenAI veya Google API anahtarınızı girin",
    Input: "Erişim kodunu buraya girin",
    Confirm: "Onayla",
    Later: "Sonra",
    Return: "Geri",
    SaasTips: "",
    TopTips: "",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} konuşma`,
  },
  Chat: {
    MultiModel: {
      Title: "Çoklu Model Sohbet Ayarları",
      Enabled: "Çoklu Model (Etkin)",
      Disabled: "Çoklu Model (Devre Dışı)",
      Count: (count: number) => `${count} model`,
      Description:
        "🎯 Çoklu Model Arenası modu etkinleştirildi! Model seçiciye tıklayarak sohbet için birden fazla model seçin.",
      OpenSelector: "Model Seçiciyi Aç",
      AlreadySelected: (count: number) => `(${count} seçildi)`,
      Tips: "💡 İpucu: Çoklu model modunda, aynı anda birden fazla model seçebilirsiniz ve her model mesajlarınıza bağımsız olarak yanıt verir, bu da farklı modellerin yanıtlarını karşılaştırmanıza olanak tanır.",
      EnableToast:
        "🎯 Çoklu Model Arenası modu etkinleştirildi! Sohbet arenası için birden fazla model seçmek üzere model seçiciye tıklayın",
      DisableToast: "Çoklu model modu devre dışı bırakıldı",
      MinimumModelsError:
        "Çoklu model sohbetlerini etkinleştirmek için lütfen en az iki model seçin",
      ModelsSelectedToast: (count: number) =>
        `${count} model sohbet için seçildi`,
    },
    UI: {
      SidebarToggle: "Kenar çubuğunu daralt/genişlet",
      SearchModels: "Modellerde ara...",
      SelectModel: "Model seç",
      ContextTooltip: {
        Current: (current: number, max: number) =>
          `Mevcut bağlam: ${current} / ${max}`,
        CurrentTokens: (current: number, max: number) =>
          `Mevcut tokenlar: ${current.toLocaleString()} / ${max.toLocaleString()}`,
        CurrentTokensUnknown: (current: number) =>
          `Mevcut tokenlar: ${current.toLocaleString()} / bilinmiyor`,
        EstimatedTokens: (estimated: number) =>
          `Tahmini tokenlar: ${estimated.toLocaleString()}`,
        ContextTokens: (tokens: string) => `Bağlam: ${tokens} token`,
      },
    },
    SubTitle: (count: number) => `Toplam ${count} konuşma`,
    EditMessage: {
      Title: "Mesaj Kayıtlarını Düzenle",
      Topic: {
        Title: "Sohbet Konusu",
        SubTitle: "Geçerli sohbet konusunu değiştir",
      },
    },
    Actions: {
      ChatList: "Mesaj listesine bak",
      CompressedHistory: "Sıkıştırılmış geçmişi gör",
      Export: "Sohbet kayıtlarını dışa aktar",
      Copy: "Kopyala",
      Stop: "Durdur",
      Retry: "Yeniden dene",
      Pin: "Sabitlenmiş",
      PinToastContent: "1 konuşma varsayılan ifadeye sabitlendi",
      PinToastAction: "Görünüm",
      Delete: "Sil",
      Edit: "Düzenle",
      FullScreen: "Tam ekran",
      RefreshTitle: "Başlığı Yenile",
      RefreshToast: "Başlık yenileme isteği gönderildi",
      Speech: "Oynat",
      StopSpeech: "Durdur",
      PreviousVersion: "Önceki sürüm",
      NextVersion: "Sonraki sürüm",
      Debug: "Hata ayıkla",
      CopyAsCurl: "cURL olarak kopyala",
    },
    Commands: {
      new: "Yeni sohbet",
      newm: "Maske ile yeni sohbet oluştur",
      next: "Sonraki sohbet",
      prev: "Önceki sohbet",
      clear: "Bağlamı temizle",
      fork: "Sohbeti çatalla",
      del: "Sohbeti sil",
    },
    InputActions: {
      Stop: "Yanıtı durdur",
      ToBottom: "En alta git",
      Theme: {
        auto: "Otomatik tema",
        light: "Açık mod",
        dark: "Koyu mod",
      },
      Prompt: "Kısayol komutu",
      Masks: "Tüm maskeler",
      Clear: "Sohbeti temizle",
      Reset: "Sohbeti sıfırla",
      ResetConfirm:
        "Mevcut sohbet penceresinin tüm içeriğini sıfırlamak istediğinizden emin misiniz?",
      Settings: "Sohbet ayarları",
      UploadImage: "Resim yükle",
      Search: "Ara",
      SearchOn: "Arama etkin",
      SearchOff: "Arama devre dışı",
      SearchEnabledToast:
        "🔍 Arama özelliği etkinleştirildi! Artık web'de arama yapabilirsiniz",
      SearchDisabledToast: "❌ Arama özelliği devre dışı bırakıldı",
    },
    MCP: {
      Title: "MCP Araç Yönetimi",
      Enable: "MCP özelliklerini etkinleştir",
      EnableDesc:
        "Etkinleştirildiğinde, MCP araçları kullanılabilir olur. Devre dışı bırakıldığında, MCP ile ilgili istekler gönderilmez",
      NoTools: "Kullanılabilir MCP aracı yok",
      Loading: "Yükleniyor...",
      ClientFailed: "MCP istemcisi yüklenemedi, sessiz işlem",
      ToolsCount: (count: number) => `${count} araç`,
    },
    Rename: "Sohbeti yeniden adlandır",
    Typing: "Yazıyor…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} gönder`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "，Shift + Enter satır sonu için";
      }
      return inputHints + "，/ tamamlama için, : komutlar için";
    },
    Send: "Gönder",
    TokenUsage: "Kullanım",
    TokenTooltip: {
      Context: "Mevcut bağlam",
      CurrentToken: "Mevcut tokenlar",
      EstimatedToken: "Tahmini tokenlar",
      Unknown: "Bilinmiyor",
    },
    StartSpeak: "Konuşmaya başla",
    StopSpeak: "Konuşmayı durdur",
    Config: {
      Reset: "Hafızayı temizle",
      SaveAs: "Maske olarak kaydet",
    },
    IsContext: "Varsayılan ifade",
    ShortcutKey: {
      Title: "Kısayol tuşları",
      newChat: "Yeni sohbet aç",
      focusInput: "Giriş alanına odaklan",
      copyLastMessage: "Son mesajı kopyala",
      copyLastCode: "Son kodu kopyala",
      showShortcutKey: "Kısayol tuşlarını göster",
      clearContext: "Bağlamı temizle",
    },
    Thinking: {
      Title: "Düşünme Derinliği",
      Dynamic: "Dinamik düşünme",
      DynamicDesc: "Model düşünme derinliğini otomatik olarak ayarlar",
      Off: "Düşünme devre dışı",
      OffDesc: "Düşünme süreci yok",
      Light: "Hafif düşünme",
      LightDesc: "1024 token",
      Medium: "Orta düşünme",
      MediumDesc: "4096 token",
      Deep: "Derin düşünme",
      DeepDesc: "8192 token",
      VeryDeep: "Çok derin düşünme",
      VeryDeepDesc: "16384 token",
      Notice:
        "Sadece thinkingBudget destekleyen modeller düşünme derinliğini ayarlayabilir",
      ClaudeNotice:
        "Sadece Claude serisi modeller düşünme derinliğini ayarlayabilir",
      GeminiNotice:
        "Sadece Gemini serisi modeller düşünme derinliğini ayarlayabilir",
      ClaudeLight: "Düşünme",
      ClaudeLightDesc: "5000 token",
      ClaudeMedium: "Ciddi düşünme",
      ClaudeMediumDesc: "10000 token",
      ClaudeDeep: "Daha ciddi düşünme",
      ClaudeDeepDesc: "20000 token",
      ClaudeVeryDeep: "Aşırı düşünme",
      ClaudeVeryDeepDesc: "32000 token",
      ClaudeDynamicDesc:
        "Düşünme derinliğini otomatik olarak ayarla (varsayılan 10000 token)",
    },
  },
  Export: {
    Title: "Sohbet kayıtlarını paylaş",
    Copy: "Hepsini kopyala",
    Download: "Dosyayı indir",
    Share: "ShareGPT'ye paylaş",
    MessageFromYou: "Kullanıcı",
    MessageFromChatGPT: "ChatGPT",
    Format: {
      Title: "Dışa aktarma formatı",
      SubTitle: "Metni Markdown veya PNG resmi olarak dışa aktarabilirsiniz",
    },
    IncludeContext: {
      Title: "Maske bağlamını dahil et",
      SubTitle: "Mesajlarda maske bağlamını göstermek ister misiniz",
    },
    Steps: {
      Select: "Seç",
      Preview: "Önizleme",
    },
    Image: {
      Toast: "Ekran görüntüsü oluşturuluyor",
      Modal: "Uzun basın veya sağ tıklayın ve resmi kaydedin",
    },
    Artifacts: {
      Title: "Sayfa yazdır",
      Error: "Yazdırma hatası",
    },
  },
  Select: {
    Search: "Mesajlarda ara",
    All: "Hepsini seç",
    Latest: "Son birkaç mesaj",
    Clear: "Seçimi temizle",
  },
  Memory: {
    Title: "Geçmiş Özeti",
    EmptyContent: "Sohbet içeriği çok kısa, özetleme gerek yok",
    Send: "Sohbet kayıtlarını otomatik olarak sıkıştır ve bağlam olarak gönder",
    Copy: "Özeti kopyala",
    Reset: "[kullanılmadı]",
    ResetConfirm: "Geçmiş özetini temizlemek istediğinize emin misiniz?",
  },
  Home: {
    NewChat: "Yeni sohbet",
    DeleteChat: "Seçilen sohbeti silmek istediğinize emin misiniz?",
    DeleteToast: "Sohbet silindi",
    Revert: "Geri al",
  },
  Settings: {
    Title: "Ayarlar",
    SubTitle: "Tüm ayar seçenekleri",
    ShowPassword: "Şifreyi göster",

    Tab: {
      General: "Genel Ayarlar",
      Sync: "Bulut Senkronizasyonu",
      Mask: "Maske",
      Prompt: "İpucu",
      ModelService: "Model Hizmeti",
      ModelConfig: "Model Yapılandırması",
      Voice: "Ses",
    },

    Danger: {
      Reset: {
        Title: "Tüm ayarları sıfırla",
        SubTitle: "Tüm ayarları varsayılan değerlere sıfırla",
        Action: "Hemen sıfırla",
        Confirm: "Tüm ayarları sıfırlamak istediğinizden emin misiniz?",
      },
      Clear: {
        Title: "Tüm verileri temizle",
        SubTitle: "Tüm sohbet ve ayar verilerini temizle",
        Action: "Hemen temizle",
        Confirm:
          "Tüm sohbet ve ayar verilerini temizlemek istediğinizden emin misiniz?",
      },
    },
    Lang: {
      Name: "Language", // Dikkat: yeni bir çeviri eklemek isterseniz, bu değeri çevirmeyin, `Language` olarak bırakın
      All: "Tüm diller",
    },
    Avatar: "Profil Resmi",
    FontSize: {
      Title: "Yazı Boyutu",
      SubTitle: "Sohbet içeriğinin yazı boyutu",
    },
    FontFamily: {
      Title: "Sohbet Yazı Tipi",
      SubTitle:
        "Sohbet içeriğinin yazı tipi, boş bırakıldığında küresel varsayılan yazı tipi uygulanır",
      Placeholder: "Yazı Tipi Adı",
    },
    InjectSystemPrompts: {
      Title: "Sistem Seviyesi İpucu Enjeksiyonu",
      SubTitle: "Her isteğin başına ChatGPT benzeri bir sistem ipucu ekle",
    },
    InputTemplate: {
      Title: "Kullanıcı Girdisi Ön İşleme",
      SubTitle: "Kullanıcının en son mesajı bu şablona doldurulur",
    },

    Update: {
      Version: (x: string) => `Mevcut sürüm: ${x}`,
      IsLatest: "En son sürüm",
      CheckUpdate: "Güncellemeleri kontrol et",
      IsChecking: "Güncellemeler kontrol ediliyor...",
      FoundUpdate: (x: string) => `Yeni sürüm bulundu: ${x}`,
      GoToUpdate: "Güncellemeye git",
      Success: "Güncelleme başarılı!",
      Failed: "Güncelleme başarısız",
    },
    SendKey: "Gönderme Tuşu",
    Theme: "Tema",
    TightBorder: "Sınır Yok Modu",
    SendPreviewBubble: {
      Title: "Önizleme Balonu",
      SubTitle: "Markdown içeriğini önizleme balonunda görüntüle",
    },
    AutoGenerateTitle: {
      Title: "Başlığı Otomatik Oluştur",
      SubTitle: "Sohbet içeriğine göre uygun başlık oluştur",
    },
    Sync: {
      CloudState: "Bulut Verisi",
      NotSyncYet: "Henüz senkronize edilmedi",
      Success: "Senkronizasyon başarılı",
      Fail: "Senkronizasyon başarısız",

      Config: {
        Modal: {
          Title: "Bulut Senkronizasyonu Yapılandır",
          Check: "Kullanılabilirliği kontrol et",
        },
        SyncType: {
          Title: "Senkronizasyon Türü",
          SubTitle: "Tercih ettiğiniz senkronizasyon sunucusunu seçin",
        },
        Proxy: {
          Title: "Proxy'yi Etkinleştir",
          SubTitle:
            "Tarayıcıda senkronize ederken proxy'yi etkinleştirin, aksi takdirde çapraz kaynak kısıtlamalarıyla karşılaşabilirsiniz",
        },
        ProxyUrl: {
          Title: "Proxy Adresi",
          SubTitle: "Sadece bu projeye ait çapraz kaynak proxy için",
        },

        WebDav: {
          Endpoint: "WebDAV Adresi",
          UserName: "Kullanıcı Adı",
          Password: "Şifre",
        },

        UpStash: {
          Endpoint: "UpStash Redis REST Url",
          UserName: "Yedekleme Adı",
          Password: "UpStash Redis REST Token",
        },
      },

      LocalState: "Yerel Veri",
      Overview: (overview: any) => {
        return `${overview.chat} konuşma, ${overview.message} mesaj, ${overview.prompt} ipucu, ${overview.mask} maske`;
      },
      ImportFailed: "İçeri aktarma başarısız",
    },
    Mask: {
      ModelIcon: {
        Title: "Model ikonunu yapay zeka avatarı olarak kullan",
        SubTitle:
          "Etkinleştirildiğinde, sohbetlerde yapay zeka avatarı olarak geçerli modelin ikonu kullanılır, emoji yerine",
      },
    },
    AccessCode: {
      Title: "Erişim Kodu",
      SubTitle: "Erişim kontrolü etkinleştirildi, lütfen erişim kodunu girin",
      Placeholder: "Erişim kodunu girin",
      Status: {
        Enabled: "Erişim kontrolü etkinleştirildi",
        Valid: "Erişim kodu geçerli",
        Invalid: "Erişim kodu geçersiz",
      },
    },
    Prompt: {
      Disable: {
        Title: "İpucu Tamamlamayı Devre Dışı Bırak",
        SubTitle:
          "Giriş kutusunun başına / yazarak otomatik tamamlamayı tetikle",
      },
      List: "Özelleştirilmiş İpucu Listesi",
      ListCount: (builtin: number, custom: number) =>
        `Yerleşik ${builtin} tane, kullanıcı tanımlı ${custom} tane`,
      Edit: "Düzenle",
      Modal: {
        Title: "İpucu Listesi",
        Add: "Yeni Ekle",
        Search: "İpucu Ara",
      },
      EditModal: {
        Title: "İpucu Düzenle",
      },
    },
    HistoryCount: {
      Title: "Ekli Geçmiş Mesaj Sayısı",
      SubTitle: "Her istekte taşınan geçmiş mesaj sayısı",
    },
    CompressThreshold: {
      Title: "Geçmiş Mesaj Uzunluğu Sıkıştırma Eşiği",
      SubTitle:
        "Sıkıştırılmamış geçmiş mesaj bu değeri aştığında sıkıştırma yapılır",
    },

    Access: {
      SaasStart: {
        Title: "",
        Label: "",
        SubTitle: "",
        ChatNow: "",
      },
      AccessCode: {
        Title: "Erişim Şifresi",
        SubTitle: "Yönetici şifreli erişimi etkinleştirdi",
        Placeholder: "Erişim şifrenizi girin",
      },
      CustomEndpoint: {
        Title: "Özelleştirilmiş API",
        SubTitle:
          "Özelleştirilmiş Azure veya OpenAI hizmeti kullanmak ister misiniz?",
      },
      Provider: {
        Title: "Model Sağlayıcısı",
        SubTitle: "Farklı sağlayıcılara geçiş yapın",
        Name: {
          ByteDance: "ByteDance",
          Alibaba: "Alibaba Cloud",
          Moonshot: "Moonshot",
        },
        Status: {
          Enabled: "Etkin",
        },
        Models: {
          Title: "Etkin Modeller",
          SubTitle: "Geçerli sağlayıcı için etkin model listesi",
          NoModels: "Etkin model yok",
          Manage: "Yönet",
        },
        Description: {
          OpenAI: "OpenAI GPT serisi modelleri",
          Azure: "Microsoft Azure OpenAI hizmeti",
          Google: "Google Gemini serisi modelleri",
          Anthropic: "Anthropic Claude serisi modelleri",
          ByteDance: "ByteDance Doubao serisi modelleri",
          Alibaba: "Alibaba Cloud Qwen serisi modelleri",
          Moonshot: "Moonshot Kimi serisi modelleri",
          DeepSeek: "DeepSeek serisi modelleri",
          XAI: "xAI Grok serisi modelleri",
          SiliconFlow: "SiliconFlow",
          Custom: "Özel",
        },
        Terms: {
          Provider: "Sağlayıcı",
        },
      },
      OpenAI: {
        ApiKey: {
          Title: "API Anahtarı",
          SubTitle:
            "Özelleştirilmiş OpenAI Anahtarı kullanarak şifreli erişim kısıtlamalarını atlayın",
          Placeholder: "OpenAI API Anahtarı",
        },

        Endpoint: {
          Title: "API Adresi",
          SubTitle: "Varsayılan adres dışında, http(s):// içermelidir",
        },
      },
      Azure: {
        ApiKey: {
          Title: "API Anahtarı",
          SubTitle:
            "Özelleştirilmiş Azure Anahtarı kullanarak şifreli erişim kısıtlamalarını atlayın",
          Placeholder: "Azure API Anahtarı",
        },

        Endpoint: {
          Title: "API Adresi",
          SubTitle: "Örnek:",
        },

        ApiVerion: {
          Title: "API Versiyonu (azure api version)",
          SubTitle: "Belirli bir versiyonu seçin",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "API Anahtarı",
          SubTitle:
            "Özelleştirilmiş Anthropic Anahtarı kullanarak şifreli erişim kısıtlamalarını atlayın",
          Placeholder: "Anthropic API Anahtarı",
        },

        Endpoint: {
          Title: "API Adresi",
          SubTitle: "Örnek:",
        },

        ApiVerion: {
          Title: "API Versiyonu (claude api version)",
          SubTitle: "Belirli bir API versiyonunu seçin",
        },
      },
      Google: {
        ApiKey: {
          Title: "API Anahtarı",
          SubTitle: "Google AI'den API Anahtarınızı alın",
          Placeholder: "Google AI Studio API Anahtarınızı girin",
        },

        Endpoint: {
          Title: "Uç Nokta Adresi",
          SubTitle: "Örnek:",
        },

        ApiVersion: {
          Title: "API Versiyonu (sadece gemini-pro)",
          SubTitle: "Belirli bir API versiyonunu seçin",
        },
        GoogleSafetySettings: {
          Title: "Google Güvenlik Filtreleme Seviyesi",
          SubTitle: "İçerik filtreleme seviyesini ayarlayın",
        },
      },
      Baidu: {
        ApiKey: {
          Title: "API Anahtarı",
          SubTitle: "Özelleştirilmiş Baidu API Anahtarı kullanın",
          Placeholder: "Baidu API Anahtarı",
        },
        SecretKey: {
          Title: "Secret Anahtarı",
          SubTitle: "Özelleştirilmiş Baidu Secret Anahtarı kullanın",
          Placeholder: "Baidu Secret Anahtarı",
        },
        Endpoint: {
          Title: "API Adresi",
          SubTitle: "Özelleştirilmiş yapılandırma için .env'ye gidin",
        },
      },
      ByteDance: {
        ApiKey: {
          Title: "API Anahtarı",
          SubTitle: "Özelleştirilmiş ByteDance API Anahtarı kullanın",
          Placeholder: "ByteDance API Anahtarı",
        },
        Endpoint: {
          Title: "API Adresi",
          SubTitle: "Örnek:",
        },
      },
      Alibaba: {
        ApiKey: {
          Title: "API Anahtarı",
          SubTitle: "Özelleştirilmiş Alibaba Cloud API Anahtarı kullanın",
          Placeholder: "Alibaba Cloud API Anahtarı",
        },
        Endpoint: {
          Title: "API Adresi",
          SubTitle: "Örnek:",
        },
      },
      Moonshot: {
        ApiKey: {
          Title: "API Anahtarı",
          SubTitle: "Özelleştirilmiş Moonshot API Anahtarı kullanın",
          Placeholder: "Moonshot API Anahtarı",
        },
        Endpoint: {
          Title: "API Adresi",
          SubTitle: "Örnek:",
        },
      },
      DeepSeek: {
        ApiKey: {
          Title: "API Anahtarı",
          SubTitle: "Özelleştirilmiş DeepSeek API Anahtarı kullanın",
          Placeholder: "DeepSeek API Anahtarı",
        },
        Endpoint: {
          Title: "API Adresi",
          SubTitle: "Örnek:",
        },
      },
      XAI: {
        ApiKey: {
          Title: "API Anahtarı",
          SubTitle: "Özelleştirilmiş XAI API Anahtarı kullanın",
          Placeholder: "XAI API Anahtarı",
        },
        Endpoint: {
          Title: "API Adresi",
          SubTitle: "Örnek:",
        },
      },
      SiliconFlow: {
        ApiKey: {
          Title: "API Anahtarı",
          SubTitle: "Özelleştirilmiş SiliconFlow API Anahtarı kullanın",
          Placeholder: "SiliconFlow API Anahtarı",
        },
        Endpoint: {
          Title: "API Adresi",
          SubTitle: "Örnek:",
        },
      },
      ChatGLM: {
        ApiKey: {
          Title: "API Anahtarı",
          SubTitle: "Özelleştirilmiş ChatGLM API Anahtarı kullanın",
          Placeholder: "ChatGLM API Anahtarı",
        },
        Endpoint: {
          Title: "API Adresi",
          SubTitle: "Örnek:",
        },
      },
      Iflytek: {
        ApiKey: {
          Title: "ApiKey",
          SubTitle: "iFlytek Spark konsolundan ApiKey alın",
          Placeholder: "ApiKey",
        },
        ApiSecret: {
          Title: "ApiSecret",
          SubTitle: "iFlytek Spark konsolundan ApiSecret alın",
          Placeholder: "ApiSecret",
        },
        Endpoint: {
          Title: "API Adresi",
          SubTitle: "Örnek:",
        },
      },
      AI302: {
        ApiKey: {
          Title: "API Anahtarı",
          SubTitle: "Özelleştirilmiş 302.AI API Anahtarı kullanın",
          Placeholder: "302.AI API Anahtarı",
        },
        Endpoint: {
          Title: "API Adresi",
          SubTitle: "Örnek:",
        },
      },
      CustomProvider: {
        Add: {
          Title: "Özel Sağlayıcı Ekle",
          Button: "Özel Sağlayıcı Ekle",
          Description: "Mevcut sağlayıcı türlerine göre özel kanal ekle",
        },
        Modal: {
          Title: "Özel Sağlayıcı Ekle",
          Name: {
            Title: "Sağlayıcı Adı",
            Placeholder: "Özel sağlayıcı adı girin",
            Required: "Lütfen sağlayıcı adı girin",
            Unique: "Sağlayıcı adı zaten var, lütfen başka bir ad kullanın",
          },
          Type: {
            Title: "Sağlayıcı Türü",
            OpenAI: "OpenAI - OpenAI API ile uyumlu hizmetler",
            Google: "Google - Google Gemini API",
            Anthropic: "Anthropic - Anthropic Claude API",
          },
          ApiKey: {
            Title: "API Anahtarı",
            Placeholder: "API anahtarını girin",
            Required: "Lütfen API anahtarını girin",
          },
          Endpoint: {
            Title: "Özel Uç Nokta",
            Placeholder: "Varsayılan uç noktayı kullanmak için boş bırakın",
            Optional: "(İsteğe bağlı)",
          },
          Cancel: "İptal",
          Confirm: "Ekle",
        },
        Config: {
          Type: "Sağlayıcı Türü",
          BasedOn: "Şuna göre",
          ApiKeyDescription: "Özel sağlayıcı için API anahtarı",
          EndpointDescription: "Özel API uç nokta adresi",
          EndpointPlaceholder: "API uç nokta adresi",
          Delete: {
            Title: "Sağlayıcıyı Sil",
            SubTitle: "Bu özel sağlayıcıyı ve tüm ayarlarını sil",
            Button: "Sil",
            Confirm: "Bu özel sağlayıcıyı silmek istediğinizden emin misiniz",
            ConfirmSuffix: "?",
          },
        },
      },
    },

    Model: "Model (model)",
    CompressModel: {
      Title: "Sıkıştırma Modeli",
      SubTitle: "Geçmişi sıkıştırmak için kullanılan model",
    },
    Temperature: {
      Title: "Rastgelelik (temperature)",
      SubTitle: "Değer arttıkça yanıt daha rastgele olur",
    },
    TopP: {
      Title: "Nükleer Örnekleme (top_p)",
      SubTitle:
        "Rastgeleliğe benzer, ancak rastgelelik ile birlikte değiştirmeyin",
    },
    MaxTokens: {
      Title: "Tek Yanıt Limiti (max_tokens)",
      SubTitle: "Tek etkileşimde kullanılan maksimum Token sayısı",
    },
    PresencePenalty: {
      Title: "Konu Tazeliği (presence_penalty)",
      SubTitle: "Değer arttıkça, yeni konulara geçiş olasılığı artar",
    },
    FrequencyPenalty: {
      Title: "Frekans Cezası (frequency_penalty)",
      SubTitle:
        "Değer arttıkça, tekrar eden kelimelerin azalması olasılığı artar",
    },
    TTS: {
      Enable: {
        Title: "TTS'yi Etkinleştir",
        SubTitle: "Metinden konuşmaya dönüştürme hizmetini etkinleştir",
      },
      Autoplay: {
        Title: "Otomatik Oynatmayı Etkinleştir",
        SubTitle:
          "Konuşmayı otomatik olarak oluştur ve oynat, önce metinden konuşmaya dönüştürme anahtarını etkinleştirmeniz gerekir",
      },
      Model: "Model",
      Engine: "Dönüştürme Motoru",
      EngineConfig: {
        Title: "Yapılandırma Notu",
        SubTitle:
          "OpenAI-TTS, model hizmetlerindeki OpenAI sağlayıcı yapılandırmasını kullanacaktır. Lütfen kullanmadan önce karşılık gelen API anahtarını OpenAI sağlayıcısına ekleyin",
      },
      Voice: {
        Title: "Ses",
        SubTitle: "Ses oluşturulurken kullanılacak ses",
      },
      Speed: {
        Title: "Hız",
        SubTitle: "Oluşturulan sesin hızı",
      },
    },
    Realtime: {
      Enable: {
        Title: "Gerçek Zamanlı Sohbet",
        SubTitle: "Gerçek zamanlı sohbet özelliğini etkinleştir",
      },
      Provider: {
        Title: "Model Sağlayıcısı",
        SubTitle: "Farklı sağlayıcılar arasında geçiş yap",
      },
      Model: {
        Title: "Model",
        SubTitle: "Bir model seçin",
      },
      ApiKey: {
        Title: "API Anahtarı",
        SubTitle: "API Anahtarı",
        Placeholder: "API Anahtarı",
      },
      Azure: {
        Endpoint: {
          Title: "Uç Nokta",
          SubTitle: "Uç Nokta",
        },
        Deployment: {
          Title: "Dağıtım Adı",
          SubTitle: "Dağıtım Adı",
        },
      },
      Temperature: {
        Title: "Rastgelelik (temperature)",
        SubTitle: "Daha yüksek değerler daha rastgele yanıtlar üretir",
      },
    },
  },
  Store: {
    DefaultTopic: "Yeni Sohbet",
    BotHello: "Size nasıl yardımcı olabilirim?",
    Error: "Bir hata oluştu, lütfen daha sonra tekrar deneyin",
    Prompt: {
      History: (content: string) => "Bu, geçmiş sohbetin özeti: " + content,
      Topic:
        "Bu cümlenin dört ila beş kelimelik kısa başlığını doğrudan verin, açıklama yapmayın, noktalama işareti, duygu kelimesi veya fazla metin eklemeyin, kalın yapmayın. Başlık yoksa, doğrudan 'Sohbet' yanıtını verin.",
      Summarize:
        "Sohbet içeriğini kısaca özetleyin, bu özet sonraki bağlam ipucu olarak kullanılacaktır, 200 kelime içinde tutun",
    },
  },
  Copy: {
    Success: "Panoya yazıldı",
    Failed: "Kopyalama başarısız, lütfen panoya erişim izni verin",
  },
  Download: {
    Success: "İçerik dizininize indirildi.",
    Failed: "İndirme başarısız.",
  },
  Context: {
    Toast: (x: any) => `${x} tane önceden tanımlı ipucu içeriyor`,
    Edit: "Mevcut sohbet ayarları",
    Add: "Yeni bir sohbet ekle",
    Clear: "Bağlam temizlendi",
    Revert: "Bağlamı geri getir",
  },

  ChatSettings: {
    Name: "Sohbet Ayarları",
  },
  Mcp: {
    Name: "MCP",
  },
  FineTuned: {
    Sysmessage: "Sen bir asistansın",
  },
  SearchChat: {
    Name: "Ara",
    Page: {
      Title: "Sohbet geçmişini ara",
      Search: "Arama anahtar kelimelerini girin",
      NoResult: "Sonuç bulunamadı",
      NoData: "Veri yok",
      Loading: "Yükleniyor",

      SubTitle: (count: number) => `${count} sonuç bulundu`,
    },
    Item: {
      View: "Görüntüle",
    },
  },
  Mask: {
    Name: "Maske",
    DefaultName: "Varsayılan Maske",
    Management: "Maske Yönetimi",
    NewMask: "Yeni Maske",
    DefaultModel: "Varsayılan Model",
    DefaultModelDesc: "Yeni sohbetler için varsayılan model",
    UseGlobalModel: "Global varsayılan modeli kullan",
    ConversationCount: (count: number) =>
      `${count} konuşma${count !== 1 ? "" : ""}`,
    Page: {
      Title: "Önceden Tanımlı Karakter Maskeleri",
      SubTitle: (count: number) =>
        `${count} tane önceden tanımlı karakter tanımı`,
      Search: "Karakter maskesi ara",
      Create: "Oluştur",
    },
    Item: {
      Info: (count: number) => `${count} tane önceden tanımlı sohbet içeriyor`,
      Chat: "Sohbet",
      View: "Görüntüle",
      Edit: "Düzenle",
      Delete: "Sil",
      DeleteConfirm: "Silmek istediğinize emin misiniz?",
    },
    EditModal: {
      Title: "Yardımcıyı Düzenle",
      Download: "Önceden Tanımlı Maskeyi İndir",
      Clone: "Önceden Tanımlı Maskeyi Kopyala",
    },
    Config: {
      Avatar: "Karakter Profil Resmi",
      Name: "Karakter Adı",
      Sync: {
        Title: "Küresel Ayarları Kullan",
        SubTitle: "Mevcut sohbet küresel model ayarlarını mı kullanacak?",
        Confirm:
          "Mevcut sohbetin özelleştirilmiş ayarları otomatik olarak üzerine yazılacaktır, küresel ayarları etkinleştirmek istediğinizden emin misiniz?",
      },
      HideContext: {
        Title: "Önceden Tanımlı Sohbetleri Gizle",
        SubTitle:
          "Gizlendiğinde, önceden tanımlı sohbetler sohbet ekranında görünmeyecek",
      },
      Artifacts: {
        Title: "Yapıtları Etkinleştir",
        SubTitle:
          "Etkinleştirildiğinde, doğrudan HTML sayfalarının görüntülenmesine izin verilir",
      },
      CodeFold: {
        Title: "Kod Katlamayı Etkinleştir",
        SubTitle:
          "Etkinleştirildiğinde, uzun kod blokları otomatik olarak katlanabilir/açılabilir",
      },
      Share: {
        Title: "Bu Maskeyi Paylaş",
        SubTitle: "Bu maskenin doğrudan bağlantısını oluştur",
        Action: "Bağlantıyı Kopyala",
      },
    },
  },
  NewChat: {
    Return: "Geri dön",
    Skip: "Doğrudan başla",
    Title: "Bir Maske Seçin",
    SubTitle:
      "Şimdi başlayın ve maskenin arkasındaki zihinle etkileşimde bulunun",
    More: "Tümünü Gör",
    Less: "Kodu Katla",
    ShowCode: "Kodu Göster",
    Preview: "Önizleme",
    NotShow: "Bir daha gösterme",
    ConfirmNoShow:
      "Devre dışı bırakmak istediğinizden emin misiniz? Devre dışı bıraktıktan sonra ayarlardan tekrar etkinleştirebilirsiniz.",
    Searching: "Aranıyor...",
    Search: "Ara",
    NoSearch: "Arama sonucu yok",
    SearchFormat: (SearchTime?: number) =>
      SearchTime !== undefined
        ? `(Arama ${Math.round(SearchTime / 1000)} saniye sürdü)`
        : "",
    Thinking: "Düşünülüyor...",
    Think: "Düşünme İçeriği",
    NoThink: "Düşünme içeriği yok",
    ThinkFormat: (thinkingTime?: number) =>
      thinkingTime !== undefined
        ? `(Düşünme ${Math.round(thinkingTime / 1000)} saniye sürdü)`
        : "",
  },

  URLCommand: {
    Code: "Bağlantıda erişim kodu bulundu, otomatik olarak doldurulsun mu?",
    Settings:
      "Bağlantıda önceden tanımlı ayarlar bulundu, otomatik olarak doldurulsun mu?",
  },

  UI: {
    Confirm: "Onayla",
    Cancel: "İptal et",
    Close: "Kapat",
    Create: "Yeni oluştur",
    Edit: "Düzenle",
    Export: "Dışa Aktar",
    Import: "İçe Aktar",
    Sync: "Senkronize et",
    Config: "Yapılandır",
  },
  Exporter: {
    Description: {
      Title: "Sadece bağlam temizlendikten sonraki mesajlar gösterilecektir",
    },
    Model: "Model",
    Messages: "Mesajlar",
    Topic: "Konu",
    Time: "Zaman",
  },
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type LocaleType = typeof tr;
export type PartialLocaleType = DeepPartial<typeof tr>;

export default tr;
