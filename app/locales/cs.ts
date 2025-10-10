import { getClientConfig } from "../config/client";
import { SubmitKey } from "../store/config";
import { SAAS_CHAT_UTM_URL } from "@/app/constant";

const isApp = !!getClientConfig()?.isApp;

const cs = {
  WIP: "V přípravě...",
  Error: {
    Unauthorized: isApp
      ? `😆 Rozhovor narazil na nějaké problémy, nebojte se:
    \\ 1️⃣ Pokud chcete začít bez konfigurace, [klikněte sem pro okamžitý začátek chatu 🚀](${SAAS_CHAT_UTM_URL})
    \\ 2️⃣ Pokud chcete využít své vlastní zdroje OpenAI, klikněte [sem](/#/settings) a upravte nastavení ⚙️`
      : `😆 Rozhovor narazil na nějaké problémy, nebojte se:
    \ 1️⃣ Pokud chcete začít bez konfigurace, [klikněte sem pro okamžitý začátek chatu 🚀](${SAAS_CHAT_UTM_URL})
    \ 2️⃣ Pokud používáte verzi soukromého nasazení, klikněte [sem](/#/auth) a zadejte přístupový klíč 🔑
    \ 3️⃣ Pokud chcete využít své vlastní zdroje OpenAI, klikněte [sem](/#/settings) a upravte nastavení ⚙️
 `,
  },
  Auth: {
    Title: "Potřebné heslo",
    Tips: "Administrátor povolil ověření heslem, prosím zadejte přístupový kód níže",
    SubTips: "nebo zadejte svůj OpenAI nebo Google API klíč",
    Input: "Zadejte přístupový kód zde",
    Confirm: "Potvrdit",
    Later: "Později",
    Return: "Návrat",
    SaasTips: "Konfigurace je příliš složitá, chci okamžitě začít používat",
    TopTips:
      "🥳 Uvítací nabídka NextChat AI, okamžitě odemkněte OpenAI o1, GPT-4o, Claude-3.5 a nejnovější velké modely",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} konverzací`,
  },
  Chat: {
    MultiModel: {
      Title: "Nastavení vícemodelového chatu",
      Enabled: "Vícemodelový (zapnuto)",
      Disabled: "Vícemodelový (vypnuto)",
      Count: (count: number) => `${count} modelů`,
      Description:
        "🎯 Vícemodelová aréna mód je zapnut! Klikněte na výběr modelů pro výběr více modelů pro chat.",
      OpenSelector: "Otevřít výběr modelů",
      AlreadySelected: (count: number) => `(${count} vybráno)`,
      Tips: "💡 Tip: V režimu vícemodelového chatu můžete vybrat více modelů najednou a každý model bude nezávisle odpovídat na vaši zprávu, což vám umožní porovnat reakce různých modelů.",
      EnableToast:
        "🎯 Vícemodelová aréna mód je zapnut! Klikněte na výběr modelů pro výběr více modelů pro chat arénu",
      DisableToast: "Vícemodelový mód je vypnut",
      MinimumModelsError:
        "Pro zapnutí vícemodelového chatu prosím vyberte alespoň dva modely",
      ModelsSelectedToast: (count: number) =>
        `${count} modelů bylo vybráno pro chat`,
    },
    UI: {
      SidebarToggle: "Sbalit/rozbalit postranní panel",
      SearchModels: "Hledat modely...",
      SelectModel: "Vybrat model",
      ContextTooltip: {
        Current: (current: number, max: number) =>
          `Aktuální kontext: ${current} / ${max}`,
        CurrentTokens: (current: number, max: number) =>
          `Aktuální tokeny: ${current.toLocaleString()} / ${max.toLocaleString()}`,
        CurrentTokensUnknown: (current: number) =>
          `Aktuální tokeny: ${current.toLocaleString()} / Neznámé`,
        EstimatedTokens: (estimated: number) =>
          `Odhadované tokeny: ${estimated.toLocaleString()}`,
        ContextTokens: (tokens: string) => `Kontext: ${tokens} tokenů`,
      },
    },
    SubTitle: (count: number) => `Celkem ${count} konverzací`,
    EditMessage: {
      Title: "Upravit zprávy",
      Topic: {
        Title: "Téma konverzace",
        SubTitle: "Změnit aktuální téma konverzace",
      },
    },
    Actions: {
      ChatList: "Zobrazit seznam zpráv",
      CompressedHistory: "Zobrazit komprimovanou historii Prompt",
      Export: "Exportovat konverzace",
      Copy: "Kopírovat",
      Stop: "Zastavit",
      Retry: "Zkusit znovu",
      Pin: "Připnout",
      PinToastContent: "1 konverzace byla připnuta k přednastaveným promptům",
      PinToastAction: "Zobrazit",
      Delete: "Smazat",
      Edit: "Upravit",
      FullScreen: "Celá obrazovka",
      RefreshTitle: "Obnovit název",
      RefreshToast: "Požadavek na obnovení názvu byl odeslán",
      Speech: "Řeč",
      StopSpeech: "Zastavit",
      PreviousVersion: "Předchozí verze",
      NextVersion: "Další verze",
      Debug: "Ladit",
      CopyAsCurl: "Kopírovat jako cURL",
    },
    Commands: {
      new: "Nová konverzace",
      newm: "Nová konverzace z masky",
      next: "Další konverzace",
      prev: "Předchozí konverzace",
      clear: "Vymazat kontext",
      fork: "Rozdvojit konverzaci",
      del: "Smazat konverzaci",
    },
    InputActions: {
      Stop: "Zastavit odpověď",
      ToBottom: "Přejít na nejnovější",
      Theme: {
        auto: "Automatické téma",
        light: "Světelný režim",
        dark: "Tmavý režim",
      },
      Prompt: "Rychlé příkazy",
      Masks: "Všechny masky",
      Clear: "Vymazat konverzaci",
      Reset: "Resetovat konverzaci",
      ResetConfirm:
        "Opravdu chcete resetovat celý obsah aktuálního chatovacího okna?",
      Settings: "Nastavení konverzace",
      UploadImage: "Nahrát obrázek",
      Search: "Hledat",
      SearchOn: "Hledání zapnuto",
      SearchOff: "Hledání vypnuto",
      SearchEnabledToast:
        "🔍 Funkce vyhledávání je zapnutá! Nyní můžete vyhledávat na webu",
      SearchDisabledToast: "❌ Funkce vyhledávání je vypnutá",
    },
    MCP: {
      Title: "Správa MCP nástrojů",
      Enable: "Zapnout funkci MCP",
      EnableDesc:
        "Po zapnutí budou k dispozici MCP nástroje. Po vypnutí nebudou odesílány žádné MCP související požadavky",
      NoTools: "Nejsou k dispozici žádné MCP nástroje",
      Loading: "Načítání...",
      ClientFailed:
        "Nepodařilo se načíst MCP klienta, zpracování v tichém režimu",
      ToolsCount: (count: number) => `${count} nástrojů`,
    },
    Rename: "Přejmenovat konverzaci",
    Typing: "Píše se…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} odeslat`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "，Shift + Enter pro nový řádek";
      }
      return inputHints + "，/ pro doplnění, : pro příkaz";
    },
    Send: "Odeslat",
    TokenUsage: "Využití",
    TokenTooltip: {
      Context: "Aktuální kontext",
      CurrentToken: "Aktuální tokeny",
      EstimatedToken: "Odhadované tokeny",
      Unknown: "Neznámé",
    },
    StartSpeak: "Začít mluvit",
    StopSpeak: "Zastavit mluvení",
    Config: {
      Reset: "Vymazat paměť",
      SaveAs: "Uložit jako masku",
    },
    IsContext: "Přednastavené prompty",
    ShortcutKey: {
      Title: "Zkratky",
      newChat: "Otevřít nový chat",
      focusInput: "Zaměřit se na vstupní pole",
      copyLastMessage: "Kopírovat poslední zprávu",
      copyLastCode: "Kopírovat poslední kód",
      showShortcutKey: "Zobrazit zkratky",
      clearContext: "Vymazat kontext",
    },
    Thinking: {
      Title: "Hloubka přemýšlení",
      Dynamic: "Dynamické přemýšlení",
      DynamicDesc: "Model automaticky upravuje hloubku přemýšlení",
      Off: "Vypnout přemýšlení",
      OffDesc: "Žádný proces přemýšlení",
      Light: "Lehké přemýšlení",
      LightDesc: "1024 tokenů",
      Medium: "Střední přemýšlení",
      MediumDesc: "4096 tokenů",
      Deep: "Hluboké přemýšlení",
      DeepDesc: "8192 tokenů",
      VeryDeep: "Velmi hluboké přemýšlení",
      VeryDeepDesc: "16384 tokenů",
      Notice:
        "Pouze modely podporující rozpočet přemýšlení mohou upravit hloubku přemýšlení",
      ClaudeNotice: "Pouze modely řady Claude mohou upravit hloubku přemýšlení",
      GeminiNotice: "Pouze modely řady Gemini mohou upravit hloubku přemýšlení",
      ClaudeLight: "Přemýšlet",
      ClaudeLightDesc: "5000 tokenů",
      ClaudeMedium: "Přemýšlet vážně",
      ClaudeMediumDesc: "10000 tokenů",
      ClaudeDeep: "Přemýšlet hlouběji",
      ClaudeDeepDesc: "20000 tokenů",
      ClaudeVeryDeep: "Přemýšlet extrémně",
      ClaudeVeryDeepDesc: "32000 tokenů",
      ClaudeDynamicDesc:
        "Automaticky upravuje hloubku přemýšlení (výchozí 10000 tokenů)",
    },
  },
  Export: {
    Title: "Sdílet konverzace",
    Copy: "Kopírovat vše",
    Download: "Stáhnout soubor",
    Share: "Sdílet na ShareGPT",
    MessageFromYou: "Uživatel",
    MessageFromChatGPT: "ChatGPT",
    Format: {
      Title: "Formát exportu",
      SubTitle: "Lze exportovat jako Markdown text nebo PNG obrázek",
    },
    IncludeContext: {
      Title: "Zahrnout kontext masky",
      SubTitle: "Zobrazit kontext masky ve zprávách",
    },
    Steps: {
      Select: "Vybrat",
      Preview: "Náhled",
    },
    Image: {
      Toast: "Generování screenshotu",
      Modal: "Dlouhým stiskem nebo pravým tlačítkem myši uložte obrázek",
    },
    Artifacts: {
      Title: "Tisk stránky",
      Error: "Chyba tisku",
    },
  },
  Select: {
    Search: "Hledat zprávy",
    All: "Vybrat vše",
    Latest: "Několik posledních",
    Clear: "Zrušit výběr",
  },
  Memory: {
    Title: "Historie shrnutí",
    EmptyContent: "Obsah konverzace je příliš krátký, není třeba shrnovat",
    Send: "Automaticky komprimovat konverzace a odeslat jako kontext",
    Copy: "Kopírovat shrnutí",
    Reset: "[nepoužívá se]",
    ResetConfirm: "Opravdu chcete vymazat historii shrnutí?",
  },
  Home: {
    NewChat: "Nová konverzace",
    DeleteChat: "Opravdu chcete smazat vybranou konverzaci?",
    DeleteToast: "Konverzace byla smazána",
    Revert: "Vrátit",
  },
  Settings: {
    Title: "Nastavení",
    SubTitle: "Všechny možnosti nastavení",
    ShowPassword: "Zobrazit heslo",

    Tab: {
      General: "Obecná nastavení",
      Sync: "Cloudová synchronizace",
      Mask: "Maska",
      Prompt: "Prompt",
      ModelService: "Modelová služba",
      ModelConfig: "Konfigurace modelu",
      Voice: "Hlas",
    },

    Danger: {
      Reset: {
        Title: "Obnovit všechna nastavení",
        SubTitle: "Obnovit všechna nastavení na výchozí hodnoty",
        Action: "Okamžitě obnovit",
        Confirm: "Opravdu chcete obnovit všechna nastavení?",
      },
      Clear: {
        Title: "Smazat všechna data",
        SubTitle: "Smazat všechny chaty a nastavení",
        Action: "Okamžitě smazat",
        Confirm: "Opravdu chcete smazat všechny chaty a nastavení?",
      },
    },
    Lang: {
      Name: "Language", // POZOR: pokud chcete přidat nový překlad, prosím, nechte tuto hodnotu jako `Language`
      All: "Všechny jazyky",
    },
    Avatar: "Profilový obrázek",
    FontSize: {
      Title: "Velikost písma",
      SubTitle: "Velikost písma pro obsah chatu",
    },
    FontFamily: {
      Title: "Chatové Písmo",
      SubTitle:
        "Písmo obsahu chatu, ponechejte prázdné pro použití globálního výchozího písma",
      Placeholder: "Název Písma",
    },
    InjectSystemPrompts: {
      Title: "Vložit systémové výzvy",
      SubTitle:
        "Automaticky přidat systémovou výzvu simulující ChatGPT na začátek seznamu zpráv pro každý požadavek",
    },
    InputTemplate: {
      Title: "Předzpracování uživatelského vstupu",
      SubTitle: "Nejnovější zpráva uživatele bude vyplněna do této šablony",
    },

    Update: {
      Version: (x: string) => `Aktuální verze: ${x}`,
      IsLatest: "Jste na nejnovější verzi",
      CheckUpdate: "Zkontrolovat aktualizace",
      IsChecking: "Kontrola aktualizací...",
      FoundUpdate: (x: string) => `Nalezena nová verze: ${x}`,
      GoToUpdate: "Přejít na aktualizaci",
      Success: "Aktualizace úspěšná!",
      Failed: "Aktualizace selhala",
    },
    SendKey: "Klávesa pro odeslání",
    Theme: "Téma",
    TightBorder: "Režim bez okrajů",
    SendPreviewBubble: {
      Title: "Náhledová bublina",
      SubTitle: "Náhled Markdown obsahu v náhledové bublině",
    },
    AutoGenerateTitle: {
      Title: "Automatické generování názvu",
      SubTitle: "Generovat vhodný název na základě obsahu konverzace",
    },
    Sync: {
      CloudState: "Data na cloudu",
      NotSyncYet: "Ještě nebylo synchronizováno",
      Success: "Synchronizace úspěšná",
      Fail: "Synchronizace selhala",

      Config: {
        Modal: {
          Title: "Nastavení cloudové synchronizace",
          Check: "Zkontrolovat dostupnost",
        },
        SyncType: {
          Title: "Typ synchronizace",
          SubTitle: "Vyberte oblíbený synchronizační server",
        },
        Proxy: {
          Title: "Povolit proxy",
          SubTitle:
            "Při synchronizaci v prohlížeči musí být proxy povolena, aby se předešlo problémům s CORS",
        },
        ProxyUrl: {
          Title: "Adresa proxy",
          SubTitle: "Pouze pro interní proxy",
        },

        WebDav: {
          Endpoint: "WebDAV adresa",
          UserName: "Uživatelské jméno",
          Password: "Heslo",
        },

        UpStash: {
          Endpoint: "UpStash Redis REST URL",
          UserName: "Název zálohy",
          Password: "UpStash Redis REST Token",
        },
      },

      LocalState: "Lokální data",
      Overview: (overview: any) => {
        return `${overview.chat} konverzací, ${overview.message} zpráv, ${overview.prompt} promptů, ${overview.mask} masek`;
      },
      ImportFailed: "Import selhal",
    },
    Mask: {
      ModelIcon: {
        Title: "Použít ikonu modelu jako AI avatar",
        SubTitle:
          "Po zapnutí bude AI avatar v chatu používat ikonu aktuálního modelu místo emotikonu",
      },
    },
    AccessCode: {
      Title: "Přístupový kód",
      SubTitle: "Řízení přístupu je zapnuto, prosím zadejte přístupový kód",
      Placeholder: "Zadejte přístupový kód",
      Status: {
        Enabled: "Řízení přístupu je zapnuto",
        Valid: "Přístupový kód je platný",
        Invalid: "Přístupový kód je neplatný",
      },
    },
    Prompt: {
      Disable: {
        Title: "Zakázat automatické doplňování promptů",
        SubTitle:
          "Automatické doplňování se aktivuje zadáním / na začátku textového pole",
      },
      List: "Seznam vlastních promptů",
      ListCount: (builtin: number, custom: number) =>
        `Vestavěné ${builtin} položek, uživatelsky definované ${custom} položek`,
      Edit: "Upravit",
      Modal: {
        Title: "Seznam promptů",
        Add: "Nový",
        Search: "Hledat prompty",
      },
      EditModal: {
        Title: "Upravit prompt",
      },
    },
    HistoryCount: {
      Title: "Počet historických zpráv",
      SubTitle: "Počet historických zpráv zahrnutých v každém požadavku",
    },
    CompressThreshold: {
      Title: "Prahová hodnota komprese historických zpráv",
      SubTitle:
        "Když nekomprimované historické zprávy překročí tuto hodnotu, dojde ke kompresi",
    },

    Access: {
      SaasStart: {
        Title: "Použití NextChat AI",
        Label: "(Nejlepší nákladově efektivní řešení)",
        SubTitle:
          "Oficiálně udržováno NextChat, připraveno k použití bez konfigurace, podporuje nejnovější velké modely jako OpenAI o1, GPT-4o, Claude-3.5",
        ChatNow: "Začněte chatovat nyní",
      },
      AccessCode: {
        Title: "Přístupový kód",
        SubTitle: "Administrátor aktivoval šifrovaný přístup",
        Placeholder: "Zadejte přístupový kód",
      },
      CustomEndpoint: {
        Title: "Vlastní rozhraní",
        SubTitle: "Použít vlastní Azure nebo OpenAI službu",
      },
      Provider: {
        Title: "Poskytovatel modelu",
        SubTitle: "Přepnout mezi různými poskytovateli",
        Name: {
          ByteDance: "ByteDance",
          Alibaba: "Alibaba Cloud",
          Moonshot: "Moonshot",
        },
        Status: {
          Enabled: "Zapnuto",
        },
        Models: {
          Title: "Zapnuté modely",
          SubTitle: "Seznam zapnutých modelů pro aktuálního poskytovatele",
          NoModels: "Žádné modely nejsou zapnuty",
          Manage: "Spravovat",
        },
        Description: {
          OpenAI: "Modely řady OpenAI GPT",
          Azure: "Služba Microsoft Azure OpenAI",
          Google: "Modely řady Google Gemini",
          Anthropic: "Modely řady Anthropic Claude",
          ByteDance: "Modely řady ByteDance Doubao",
          Alibaba: "Modely řady Alibaba Cloud Qwen",
          Moonshot: "Modely řady Moonshot Kimi",
          DeepSeek: "Modely řady DeepSeek",
          XAI: "Modely řady xAI Grok",
          SiliconFlow: "SiliconFlow",
          Custom: "Vlastní",
        },
        Terms: {
          Provider: "Poskytovatel",
        },
      },
      OpenAI: {
        ApiKey: {
          Title: "API Key",
          SubTitle:
            "Použijte vlastní OpenAI Key k obejití přístupového omezení",
          Placeholder: "OpenAI API Key",
        },

        Endpoint: {
          Title: "Adresa rozhraní",
          SubTitle: "Kromě výchozí adresy musí obsahovat http(s)://",
        },
      },
      Azure: {
        ApiKey: {
          Title: "Rozhraní klíč",
          SubTitle: "Použijte vlastní Azure Key k obejití přístupového omezení",
          Placeholder: "Azure API Key",
        },

        Endpoint: {
          Title: "Adresa rozhraní",
          SubTitle: "Příklad:",
        },

        ApiVerion: {
          Title: "Verze rozhraní (azure api version)",
          SubTitle: "Vyberte konkrétní verzi",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "Rozhraní klíč",
          SubTitle:
            "Použijte vlastní Anthropic Key k obejití přístupového omezení",
          Placeholder: "Anthropic API Key",
        },

        Endpoint: {
          Title: "Adresa rozhraní",
          SubTitle: "Příklad:",
        },

        ApiVerion: {
          Title: "Verze rozhraní (claude api version)",
          SubTitle: "Vyberte konkrétní verzi API",
        },
      },
      Google: {
        ApiKey: {
          Title: "API klíč",
          SubTitle: "Získejte svůj API klíč od Google AI",
          Placeholder: "Zadejte svůj Google AI Studio API klíč",
        },

        Endpoint: {
          Title: "Konečná adresa",
          SubTitle: "Příklad:",
        },

        ApiVersion: {
          Title: "Verze API (pouze pro gemini-pro)",
          SubTitle: "Vyberte konkrétní verzi API",
        },
        GoogleSafetySettings: {
          Title: "Úroveň bezpečnostního filtrování Google",
          SubTitle: "Nastavit úroveň filtrování obsahu",
        },
      },
      Baidu: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "Použijte vlastní Baidu API Key",
          Placeholder: "Baidu API Key",
        },
        SecretKey: {
          Title: "Secret Key",
          SubTitle: "Použijte vlastní Baidu Secret Key",
          Placeholder: "Baidu Secret Key",
        },
        Endpoint: {
          Title: "Adresa rozhraní",
          SubTitle:
            "Nepodporuje vlastní nastavení, přejděte na .env konfiguraci",
        },
      },
      ByteDance: {
        ApiKey: {
          Title: "Rozhraní klíč",
          SubTitle: "Použijte vlastní ByteDance API Key",
          Placeholder: "ByteDance API Key",
        },
        Endpoint: {
          Title: "Adresa rozhraní",
          SubTitle: "Příklad:",
        },
      },
      Alibaba: {
        ApiKey: {
          Title: "Rozhraní klíč",
          SubTitle: "Použijte vlastní Alibaba Cloud API Key",
          Placeholder: "Alibaba Cloud API Key",
        },
        Endpoint: {
          Title: "Adresa rozhraní",
          SubTitle: "Příklad:",
        },
      },
      Moonshot: {
        ApiKey: {
          Title: "Rozhraní klíč",
          SubTitle: "Použijte vlastní Moonshot API Key",
          Placeholder: "Moonshot API Key",
        },
        Endpoint: {
          Title: "Adresa rozhraní",
          SubTitle: "Příklad:",
        },
      },
      DeepSeek: {
        ApiKey: {
          Title: "Rozhraní klíč",
          SubTitle: "Použijte vlastní DeepSeek API Key",
          Placeholder: "DeepSeek API Key",
        },
        Endpoint: {
          Title: "Adresa rozhraní",
          SubTitle: "Příklad:",
        },
      },
      XAI: {
        ApiKey: {
          Title: "Rozhraní klíč",
          SubTitle: "Použijte vlastní XAI API Key",
          Placeholder: "XAI API Key",
        },
        Endpoint: {
          Title: "Adresa rozhraní",
          SubTitle: "Příklad:",
        },
      },
      SiliconFlow: {
        ApiKey: {
          Title: "Rozhraní klíč",
          SubTitle: "Použijte vlastní SiliconFlow API Key",
          Placeholder: "SiliconFlow API Key",
        },
        Endpoint: {
          Title: "Adresa rozhraní",
          SubTitle: "Příklad:",
        },
      },
      ChatGLM: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "Použijte vlastní ChatGLM API Key",
          Placeholder: "ChatGLM API Key",
        },
        Endpoint: {
          Title: "Adresa rozhraní",
          SubTitle: "Příklad:",
        },
      },
      Iflytek: {
        ApiKey: {
          Title: "ApiKey",
          SubTitle: "Získejte ApiKey z konzole iFlytek Spark",
          Placeholder: "ApiKey",
        },
        ApiSecret: {
          Title: "ApiSecret",
          SubTitle: "Získejte ApiSecret z konzole iFlytek Spark",
          Placeholder: "ApiSecret",
        },
        Endpoint: {
          Title: "Adresa rozhraní",
          SubTitle: "Příklad:",
        },
      },
      AI302: {
        ApiKey: {
          Title: "Rozhraní klíč",
          SubTitle: "Použijte vlastní 302.AI API Key",
          Placeholder: "302.AI API Key",
        },
        Endpoint: {
          Title: "Adresa rozhraní",
          SubTitle: "Příklad:",
        },
      },
      CustomProvider: {
        Add: {
          Title: "Přidat vlastního poskytovatele",
          Button: "Přidat vlastního poskytovatele",
          Description:
            "Přidejte vlastní kanál na základě existujícího typu poskytovatele",
        },
        Modal: {
          Title: "Přidat vlastního poskytovatele",
          Name: {
            Title: "Název poskytovatele",
            Placeholder: "Zadejte název vlastního poskytovatele",
            Required: "Prosím zadejte název poskytovatele",
            Unique:
              "Název poskytovatele již existuje, použijte prosím jiný název",
          },
          Type: {
            Title: "Typ poskytovatele",
            OpenAI: "OpenAI - služba kompatibilní s OpenAI API",
            Google: "Google - Google Gemini API",
            Anthropic: "Anthropic - Anthropic Claude API",
          },
          ApiKey: {
            Title: "API Key",
            Placeholder: "Zadejte API Key",
            Required: "Prosím zadejte API Key",
          },
          Endpoint: {
            Title: "Vlastní endpoint",
            Placeholder: "Ponechte prázdné pro použití výchozího endpointu",
            Optional: "(volitelné)",
          },
          Cancel: "Zrušit",
          Confirm: "Přidat",
        },
        Config: {
          Type: "Typ poskytovatele",
          BasedOn: "Založeno na",
          ApiKeyDescription: "API Key pro vlastního poskytovatele",
          EndpointDescription: "Adresa vlastního API endpointu",
          EndpointPlaceholder: "Adresa API endpointu",
          Delete: {
            Title: "Smazat poskytovatele",
            SubTitle:
              "Smazat tohoto vlastního poskytovatele a všechna jeho nastavení",
            Button: "Smazat",
            Confirm: "Opravdu chcete smazat vlastního poskytovatele",
            ConfirmSuffix: "?",
          },
        },
      },
    },

    Model: "Model (model)",
    CompressModel: {
      Title: "Kompresní model",
      SubTitle: "Model používaný pro kompresi historie",
    },
    Temperature: {
      Title: "Náhodnost (temperature)",
      SubTitle: "Čím vyšší hodnota, tím náhodnější odpovědi",
    },
    TopP: {
      Title: "Jádrové vzorkování (top_p)",
      SubTitle: "Podobné náhodnosti, ale neměňte spolu s náhodností",
    },
    MaxTokens: {
      Title: "Omezení odpovědi (max_tokens)",
      SubTitle: "Maximální počet Tokenů použitých v jednom interakci",
    },
    PresencePenalty: {
      Title: "Čerstvost témat (presence_penalty)",
      SubTitle:
        "Čím vyšší hodnota, tím větší pravděpodobnost rozšíření na nová témata",
    },
    FrequencyPenalty: {
      Title: "Penalizace frekvence (frequency_penalty)",
      SubTitle:
        "Čím vyšší hodnota, tím větší pravděpodobnost snížení opakování slov",
    },
    TTS: {
      Enable: {
        Title: "Zapnout TTS",
        SubTitle: "Zapnout text-to-speech službu",
      },
      Autoplay: {
        Title: "Zapnout automatické přehrávání",
        SubTitle:
          "Automaticky generovat a přehrávat hlas, musí být zapnutý přepínač text-to-speech",
      },
      Model: "Model",
      Engine: "Převodní engine",
      EngineConfig: {
        Title: "Poznámka ke konfiguraci",
        SubTitle:
          "Pro OpenAI-TTS modelovou službu bude použita konfigurace OpenAI poskytovatele. Před použitím přidejte odpovídající API Key do konfigurace OpenAI poskytovatele",
      },
      Voice: {
        Title: "Hlas",
        SubTitle: "Hlas použitý při generování hlasu",
      },
      Speed: {
        Title: "Rychlost",
        SubTitle: "Rychlost generovaného hlasu",
      },
    },
    Realtime: {
      Enable: {
        Title: "Zapnout reálný časový rozhovor",
        SubTitle: "Zapnout funkci reálného časového rozhovoru",
      },
      Provider: {
        Title: "Poskytovatel modelu",
        SubTitle: "Přepnout mezi různými poskytovateli",
      },
      Model: {
        Title: "Model",
        SubTitle: "Vyberte model",
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
          Title: "Název nasazení",
          SubTitle: "Název nasazení",
        },
      },
      Temperature: {
        Title: "Náhodnost (temperature)",
        SubTitle: "Vyšší hodnota vytváří náhodnější odpovědi",
      },
    },
  },
  Store: {
    DefaultTopic: "Výchozí téma",
    BotHello: "Jak vám mohu pomoci?",
    Error: "Došlo k chybě, zkuste to prosím znovu později.",
    Prompt: {
      History: (content: string) =>
        "Toto bude použito jako shrnutí předchozího chatu jako kontext: " +
        content,
      Topic:
        "Vytvořte stručné téma této věty pomocí čtyř až pěti slov, bez vysvětlení, interpunkce, citoslovcí, nadbytečného textu nebo tučného písma. Pokud téma neexistuje, vraťte pouze 'neformální chat'.",
      Summarize:
        "Stručně shrňte obsah konverzace jako kontextový prompt pro budoucí použití, omezte se na 200 slov",
    },
  },
  Copy: {
    Success: "Zkopírováno do schránky",
    Failed: "Kopírování selhalo, prosím, povolte přístup ke schránce",
  },
  Download: {
    Success: "Obsah byl stažen do vašeho adresáře.",
    Failed: "Stahování selhalo.",
  },
  Context: {
    Toast: (x: any) => `Obsahuje ${x} přednastavených promptů`,
    Edit: "Nastavení aktuální konverzace",
    Add: "Přidat novou konverzaci",
    Clear: "Kontext byl vymazán",
    Revert: "Obnovit kontext",
  },

  ChatSettings: {
    Name: "Nastavení chatu",
  },
  Mcp: {
    Name: "MCP",
  },
  FineTuned: {
    Sysmessage: "Jste asistent",
  },
  SearchChat: {
    Name: "Hledat",
    Page: {
      Title: "Hledat v historii chatu",
      Search: "Zadejte hledané klíčové slovo",
      NoResult: "Nebyly nalezeny žádné výsledky",
      NoData: "Žádná data",
      Loading: "Načítání",

      SubTitle: (count: number) => `Nalezeno ${count} výsledků`,
    },
    Item: {
      View: "Zobrazit",
    },
  },
  Mask: {
    Name: "Maska",
    DefaultName: "Výchozí maska",
    Management: "Správa masek",
    NewMask: "Nová maska",
    DefaultModel: "Výchozí model",
    DefaultModelDesc: "Výchozí model pro nový chat",
    UseGlobalModel: "Použít globální výchozí model",
    ConversationCount: (count: number) =>
      `${count} konverzací${count !== 1 ? "" : ""}`,
    Page: {
      Title: "Přednastavené role masky",
      SubTitle: (count: number) => `${count} definovaných rolí`,
      Search: "Hledat role masky",
      Create: "Nový",
    },
    Item: {
      Info: (count: number) => `Obsahuje ${count} přednastavených konverzací`,
      Chat: "Chat",
      View: "Zobrazit",
      Edit: "Upravit",
      Delete: "Smazat",
      DeleteConfirm: "Opravdu chcete smazat?",
    },
    EditModal: {
      Title: (readonly: boolean) =>
        `Upravit přednastavenou masku ${readonly ? " (jen pro čtení)" : ""}`,
      Download: "Stáhnout přednastavení",
      Clone: "Klonovat přednastavení",
    },
    Config: {
      Avatar: "Profilový obrázek",
      Name: "Název role",
      Sync: {
        Title: "Použít globální nastavení",
        SubTitle: "Použít globální modelová nastavení pro aktuální konverzaci",
        Confirm:
          "Vaše vlastní nastavení konverzace bude automaticky přepsáno, opravdu chcete použít globální nastavení?",
      },
      HideContext: {
        Title: "Skrýt kontextové prompty",
        SubTitle: "Kontextové prompty nebudou zobrazeny v chatu",
      },
      Artifacts: {
        Title: "Zapnout artefakty",
        SubTitle: "Po zapnutí umožňuje přímé zobrazení HTML stránek",
      },
      CodeFold: {
        Title: "Zapnout skládání kódu",
        SubTitle:
          "Po zapnutí lze dlouhé bloky kódu automaticky sbalit/rozbalit",
      },
      Share: {
        Title: "Sdílet tuto masku",
        SubTitle: "Vygenerovat přímý odkaz na tuto masku",
        Action: "Kopírovat odkaz",
      },
    },
  },
  NewChat: {
    Return: "Zpět",
    Skip: "Začít hned",
    Title: "Vyberte masku",
    SubTitle: "Začněte nyní a konfrontujte se s myslí za maskou",
    More: "Zobrazit vše",
    Less: "Sbalit kód",
    ShowCode: "Zobrazit kód",
    Preview: "Náhled",
    NotShow: "Již nezobrazovat",
    ConfirmNoShow:
      "Opravdu chcete zakázat? Po zakázání můžete kdykoli znovu povolit v nastavení.",
    Searching: "Hledání...",
    Search: "Hledat",
    NoSearch: "Žádné výsledky vyhledávání",
    SearchFormat: (SearchTime?: number) =>
      SearchTime !== undefined
        ? `(vyhledávání trvalo ${Math.round(SearchTime / 1000)} sekund)`
        : "",
    Thinking: "Přemýšlení...",
    Think: "Obsah přemýšlení",
    NoThink: "Žádný obsah přemýšlení",
    ThinkFormat: (thinkingTime?: number) =>
      thinkingTime !== undefined
        ? `(přemýšlení trvalo ${Math.round(thinkingTime / 1000)} sekund)`
        : "",
  },

  URLCommand: {
    Code: "Byl detekován přístupový kód v odkazu, chcete jej automaticky vyplnit?",
    Settings:
      "Byla detekována přednastavená nastavení v odkazu, chcete je automaticky vyplnit?",
  },

  UI: {
    Confirm: "Potvrdit",
    Cancel: "Zrušit",
    Close: "Zavřít",
    Create: "Nový",
    Edit: "Upravit",
    Export: "Exportovat",
    Import: "Importovat",
    Sync: "Synchronizovat",
    Config: "Konfigurovat",
  },
  Exporter: {
    Description: {
      Title: "Pouze zprávy po vymazání kontextu budou zobrazeny",
    },
    Model: "Model",
    Messages: "Zprávy",
    Topic: "Téma",
    Time: "Čas",
  },
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type LocaleType = typeof cs;
export type PartialLocaleType = DeepPartial<typeof cs>;

export default cs;
