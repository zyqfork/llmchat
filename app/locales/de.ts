import { getClientConfig } from "../config/client";
import { SubmitKey } from "../store/config";
import { SAAS_CHAT_UTM_URL } from "@/app/constant";

const isApp = !!getClientConfig()?.isApp;

const de = {
  WIP: "In Bearbeitung...",
  Error: {
    Unauthorized: isApp
      ? `😆 Das Gespräch hatte einige Probleme, keine Sorge:
    \\ 1️⃣ Wenn du ohne Konfiguration sofort starten möchtest, [klicke hier, um sofort zu chatten 🚀](${SAAS_CHAT_UTM_URL})
    \\ 2️⃣ Wenn du deine eigenen OpenAI-Ressourcen verwenden möchtest, klicke [hier](/#/settings), um die Einstellungen zu ändern ⚙️`
      : `😆 Das Gespräch hatte einige Probleme, keine Sorge:
    \ 1️⃣ Wenn du ohne Konfiguration sofort starten möchtest, [klicke hier, um sofort zu chatten 🚀](${SAAS_CHAT_UTM_URL})
    \ 2️⃣ Wenn du eine private Bereitstellung verwendest, klicke [hier](/#/auth), um den Zugriffsschlüssel einzugeben 🔑
    \ 3️⃣ Wenn du deine eigenen OpenAI-Ressourcen verwenden möchtest, klicke [hier](/#/settings), um die Einstellungen zu ändern ⚙️
 `,
  },
  Auth: {
    Return: "Zurück",
    Title: "Passwort erforderlich",
    Tips: "Der Administrator hat die Passwortüberprüfung aktiviert. Bitte geben Sie den Zugangscode unten ein.",
    SubTips: "Oder geben Sie Ihren OpenAI oder Google API-Schlüssel ein.",
    Input: "Geben Sie hier den Zugangscode ein",
    Confirm: "Bestätigen",
    Later: "Später",
    SaasTips: "",
    TopTips: "",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} Gespräche`,
  },
  Chat: {
    MultiModel: {
      Title: "Multi-Modell Chat-Einstellungen",
      Enabled: "Multi-Modell (Aktiviert)",
      Disabled: "Multi-Modell (Deaktiviert)",
      Count: (count: number) => `${count} Modelle`,
      Description:
        "🎯 Multi-Modell-Arena-Modus aktiviert! Klicken Sie auf den Modell-Selektor, um mehrere Modelle für die Konversation auszuwählen.",
      OpenSelector: "Modell-Selektor öffnen",
      AlreadySelected: (count: number) => `(${count} ausgewählt)`,
      Tips: "💡 Tipp: Im Multi-Modell-Modus können Sie mehrere Modelle gleichzeitig auswählen, und jedes Modell wird unabhängig auf Ihre Nachrichten antworten, sodass Sie die Antworten verschiedener Modelle vergleichen können.",
      EnableToast:
        "🎯 Multi-Modell-Modus aktiviert! Klicken Sie auf den Modell-Selektor, um mehrere Modelle für die Gesprächsarena auszuwählen",
      DisableToast: "Multi-Modell-Modus deaktiviert",
      MinimumModelsError:
        "Bitte wählen Sie mindestens 2 Modelle aus, um Multi-Modell-Gespräche zu aktivieren",
      ModelsSelectedToast: (count: number) =>
        `${count} Modelle für die Konversation ausgewählt`,
    },
    UI: {
      SidebarToggle: "Seitenleiste ein-/ausklappen",
      SearchModels: "Modelle suchen...",
      SelectModel: "Modell auswählen",
      ContextTooltip: {
        Current: (current: number, max: number) =>
          `Aktueller Kontext: ${current} / ${max}`,
        CurrentTokens: (current: number, max: number) =>
          `Aktuelle Tokens: ${current.toLocaleString()} / ${max.toLocaleString()}`,
        CurrentTokensUnknown: (current: number) =>
          `Aktuelle Tokens: ${current.toLocaleString()} / Unbekannt`,
        EstimatedTokens: (estimated: number) =>
          `Geschätzte Tokens: ${estimated.toLocaleString()}`,
        ContextTokens: (tokens: string) => `Kontext: ${tokens} Tokens`,
      },
    },
    SubTitle: (count: number) => `Insgesamt ${count} Gespräche`,
    EditMessage: {
      Title: "Nachricht bearbeiten",
      Topic: {
        Title: "Chat-Thema",
        SubTitle: "Ändern Sie das aktuelle Chat-Thema",
      },
    },
    Actions: {
      ChatList: "Nachrichtenliste anzeigen",
      CompressedHistory: "Komprimierte Historie anzeigen",
      Export: "Chatverlauf exportieren",
      Copy: "Kopieren",
      Stop: "Stoppen",
      Retry: "Erneut versuchen",
      Pin: "Anheften",
      PinToastContent: "1 Gespräch an den voreingestellten Prompt angeheftet",
      PinToastAction: "Ansehen",
      Delete: "Löschen",
      Edit: "Bearbeiten",
      FullScreen: "Vollbild",
      RefreshTitle: "Titel aktualisieren",
      RefreshToast: "Anfrage zur Titelaktualisierung gesendet",
      Speech: "Abspielen",
      StopSpeech: "Stoppen",
      PreviousVersion: "Vorherige Version",
      NextVersion: "Nächste Version",
      Debug: "Debuggen",
      CopyAsCurl: "Als cURL kopieren",
    },
    Commands: {
      new: "Neues Gespräch",
      newm: "Neues Gespräch aus dem Assistenten",
      next: "Nächstes Gespräch",
      prev: "Vorheriges Gespräch",
      clear: "Kontext löschen",
      fork: "Gespräch kopieren",
      del: "Gespräch löschen",
    },
    InputActions: {
      Stop: "Antwort stoppen",
      ToBottom: "Zum neuesten Beitrag",
      Theme: {
        auto: "Automatisches Thema",
        light: "Helles Thema",
        dark: "Dunkles Thema",
      },
      Prompt: "Schnellbefehle",
      Masks: "Alle Assistenten",
      Clear: "Chat löschen",
      Reset: "Gespräch zurücksetzen",
      ResetConfirm:
        "Sind Sie sicher, dass Sie den gesamten Inhalt des aktuellen Chat-Fensters zurücksetzen möchten?",
      Settings: "Gesprächseinstellungen",
      UploadImage: "Bild hochladen",
      Search: "Suchen",
      SearchOn: "Suche Aktiviert",
      SearchOff: "Suche Deaktiviert",
      SearchEnabledToast:
        "🔍 Suchfunktion aktiviert! Sie können jetzt im Web suchen",
      SearchDisabledToast: "❌ Suchfunktion deaktiviert",
    },
    MCP: {
      Title: "MCP-Werkzeugkontrolle",
      Enable: "MCP-Funktionen aktivieren",
      EnableDesc:
        "Wenn aktiviert, können MCP-Werkzeuge verwendet werden. Wenn deaktiviert, werden keine MCP-bezogenen Prompts gesendet",
      NoTools: "Keine MCP-Werkzeuge verfügbar",
      Loading: "Laden...",
      ClientFailed: "Fehler beim Laden des MCP-Clients, stille Verarbeitung",
      ToolsCount: (count: number) => `${count} Werkzeuge`,
    },
    Rename: "Gespräch umbenennen",
    Typing: "Tippt…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} senden`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "，Shift + Enter für Zeilenumbruch";
      }
      return inputHints + "，/ für Autovervollständigung, : für Befehle";
    },
    Send: "Senden",
    TokenUsage: "Verwendung",
    TokenTooltip: {
      Context: "Aktueller Kontext",
      CurrentToken: "Aktuelle Tokens",
      EstimatedToken: "Geschätzte Tokens",
      Unknown: "Unbekannt",
    },
    StartSpeak: "Sprechen starten",
    StopSpeak: "Sprechen stoppen",
    Config: {
      Reset: "Auf Standardwerte zurücksetzen",
      SaveAs: "Als Assistent speichern",
    },
    IsContext: "Kontext-Prompt",
    ShortcutKey: {
      Title: "Tastenkombinationen",
      newChat: "Neues Gespräch öffnen",
      focusInput: "Eingabefeld fokussieren",
      copyLastMessage: "Letzte Antwort kopieren",
      copyLastCode: "Letzten Code-Block kopieren",
      showShortcutKey: "Tastenkombinationen anzeigen",
      clearContext: "Kontext löschen",
    },
    Thinking: {
      Title: "Denktiefe",
      Dynamic: "Dynamisches Denken",
      DynamicDesc: "Das Modell entscheidet automatisch über die Denktiefe",
      Off: "Denken Deaktiviert",
      OffDesc: "Kein Denkprozess",
      Light: "Leichtes Denken",
      LightDesc: "1024 Tokens",
      Medium: "Mittleres Denken",
      MediumDesc: "4096 Tokens",
      Deep: "Tiefgreifendes Denken",
      DeepDesc: "8192 Tokens",
      VeryDeep: "Sehr Tiefes Denken",
      VeryDeepDesc: "16384 Tokens",
      Notice:
        "Nur Modelle, die thinkingBudget unterstützen, können die Denktiefe anpassen",
      ClaudeNotice: "Nur Claude-Serienmodelle können die Denktiefe anpassen",
      GeminiNotice: "Nur Gemini-Serienmodelle können die Denktiefe anpassen",
      ClaudeLight: "Denken",
      ClaudeLightDesc: "5000 Tokens",
      ClaudeMedium: "Hart Nachdenken",
      ClaudeMediumDesc: "10000 Tokens",
      ClaudeDeep: "Härter Nachdenken",
      ClaudeDeepDesc: "20000 Tokens",
      ClaudeVeryDeep: "Ultra-Denken",
      ClaudeVeryDeepDesc: "32000 Tokens",
      ClaudeDynamicDesc:
        "Denktiefe automatisch anpassen (Standard 10000 Tokens)",
    },
  },
  Export: {
    Title: "Chatverlauf teilen",
    Copy: "Alles kopieren",
    Download: "Datei herunterladen",
    Share: "Chatverlauf teilen",
    MessageFromYou: "Benutzer",
    MessageFromChatGPT: "ChatGPT",
    Format: {
      Title: "Exportformat",
      SubTitle: "Sie können als Markdown-Text oder PNG-Bild exportieren",
    },
    IncludeContext: {
      Title: "Assistentenkontext einbeziehen",
      SubTitle: "Assistentenkontext in Nachrichten anzeigen oder nicht",
    },
    Steps: {
      Select: "Auswählen",
      Preview: "Vorschau",
    },
    Image: {
      Toast: "Screenshot wird erstellt",
      Modal: "Gedrückt halten oder Rechtsklick, um Bild zu speichern",
    },
    Artifacts: {
      Title: "Seite drucken",
      Error: "Druckfehler",
    },
  },
  Select: {
    Search: "Nachrichten suchen",
    All: "Alles auswählen",
    Latest: "Neueste",
    Clear: "Auswahl aufheben",
  },
  Memory: {
    Title: "Historische Zusammenfassung",
    EmptyContent:
      "Gesprächsinhalte sind zu kurz, keine Zusammenfassung erforderlich",
    Send: "Chatverlauf automatisch komprimieren und als Kontext senden",
    Copy: "Zusammenfassung kopieren",
    Reset: "[nicht verwendet]",
    ResetConfirm: "Zusammenfassung löschen bestätigen?",
  },
  Home: {
    NewChat: "Neues Gespräch",
    DeleteChat: "Bestätigen Sie das Löschen des ausgewählten Gesprächs?",
    DeleteToast: "Gespräch gelöscht",
    Revert: "Rückgängig machen",
  },
  Settings: {
    Title: "Einstellungen",
    SubTitle: "Alle Einstellungsmöglichkeiten",
    ShowPassword: "Passwort anzeigen",

    Tab: {
      General: "Allgemeine Einstellungen",
      Sync: "Cloud-Synchronisation",
      Mask: "Assistent",
      Prompt: "Prompts",
      ModelService: "Modellservice",
      ModelConfig: "Modelleinstellungen",
      Voice: "Sprache",
    },

    Danger: {
      Reset: {
        Title: "Alle Einstellungen zurücksetzen",
        SubTitle: "Setzt alle Einstellungen auf die Standardwerte zurück",
        Action: "Jetzt zurücksetzen",
        Confirm: "Bestätigen Sie das Zurücksetzen aller Einstellungen?",
      },
      Clear: {
        Title: "Alle Daten löschen",
        SubTitle: "Löscht alle Chats und Einstellungsdaten",
        Action: "Jetzt löschen",
        Confirm:
          "Bestätigen Sie das Löschen aller Chats und Einstellungsdaten?",
      },
    },
    Lang: {
      Name: "Sprache", // ACHTUNG: Wenn Sie eine neue Übersetzung hinzufügen möchten, übersetzen Sie diesen Wert bitte nicht, lassen Sie ihn als `Sprache`
      All: "Alle Sprachen",
    },
    Avatar: "Avatar",
    FontSize: {
      Title: "Schriftgröße",
      SubTitle: "Schriftgröße des Chat-Inhalts",
    },
    FontFamily: {
      Title: "Chat-Schriftart",
      SubTitle:
        "Schriftart des Chat-Inhalts, leer lassen, um die globale Standardschriftart anzuwenden",
      Placeholder: "Schriftartname",
    },
    InjectSystemPrompts: {
      Title: "Systemweite Eingabeaufforderungen einfügen",
      SubTitle:
        "Fügt jeder Nachricht am Anfang der Nachrichtenliste eine simulierte ChatGPT-Systemaufforderung hinzu",
    },
    InputTemplate: {
      Title: "Benutzer-Eingabeverarbeitung",
      SubTitle:
        "Die neueste Nachricht des Benutzers wird in diese Vorlage eingefügt",
    },

    Update: {
      Version: (x: string) => `Aktuelle Version: ${x}`,
      IsLatest: "Bereits die neueste Version",
      CheckUpdate: "Auf Updates überprüfen",
      IsChecking: "Überprüfe auf Updates...",
      FoundUpdate: (x: string) => `Neue Version gefunden: ${x}`,
      GoToUpdate: "Zum Update gehen",
      Success: "Update erfolgreich!",
      Failed: "Update fehlgeschlagen",
    },
    SendKey: "Sende-Taste",
    Theme: "Thema",
    ColorScheme: {
      Title: "Farbschema",
      Options: {
        default: "Standard Blau",
        ocean: "Ozean Blau",
        forest: "Wald Grün",
        sunset: "Sonnenuntergang Orange",
        purple: "Lila Traum",
        rose: "Rosa",
      },
    },
    TightBorder: "Randloser Modus",
    SendPreviewBubble: {
      Title: "Vorschau-Bubble",
      SubTitle: "Markdown-Inhalt in der Vorschau-Bubble anzeigen",
    },
    AutoGenerateTitle: {
      Title: "Titel automatisch generieren",
      SubTitle:
        "Basierend auf dem Chat-Inhalt einen passenden Titel generieren",
    },
    Sync: {
      CloudState: "Cloud-Daten",
      NotSyncYet: "Noch nicht synchronisiert",
      Success: "Synchronisation erfolgreich",
      Fail: "Synchronisation fehlgeschlagen",

      Config: {
        Modal: {
          Title: "Cloud-Synchronisation konfigurieren",
          Check: "Verfügbarkeit überprüfen",
        },
        SyncType: {
          Title: "Synchronisationstyp",
          SubTitle: "Wählen Sie den bevorzugten Synchronisationsserver aus",
        },
        Proxy: {
          Title: "Proxy aktivieren",
          SubTitle:
            "Beim Synchronisieren im Browser muss ein Proxy aktiviert werden, um Cross-Origin-Beschränkungen zu vermeiden",
        },
        ProxyUrl: {
          Title: "Proxy-Adresse",
          SubTitle: "Nur für projektinterne Cross-Origin-Proxy",
        },

        WebDav: {
          Endpoint: "WebDAV-Adresse",
          UserName: "Benutzername",
          Password: "Passwort",
        },

        UpStash: {
          Endpoint: "UpStash Redis REST-Url",
          UserName: "Sicherungsname",
          Password: "UpStash Redis REST-Token",
        },
      },

      LocalState: "Lokale Daten",
      Overview: (overview: any) => {
        return `${overview.chat} Chats, ${overview.message} Nachrichten, ${overview.prompt} Eingabeaufforderungen, ${overview.mask} Masken`;
      },
      ImportFailed: "Import fehlgeschlagen",
    },
    Mask: {
      ModelIcon: {
        Title: "Modell-Symbol als KI-Avatar verwenden",
        SubTitle:
          "Wenn aktiviert, wird der KI-Avatar in Gesprächen das aktuelle Modellsymbol anstelle von Emojis verwenden",
      },
    },
    AccessCode: {
      Title: "Zugangscode",
      SubTitle:
        "Zugriffskontrolle ist aktiviert, bitte geben Sie den Zugangscode ein",
      Placeholder: "Geben Sie den Zugangscode ein",
      Status: {
        Enabled: "Zugriffskontrolle aktiviert",
        Valid: "Zugangscode gültig",
        Invalid: "Zugangscode ungültig",
      },
    },
    Prompt: {
      Disable: {
        Title: "Automatische Eingabeaufforderung deaktivieren",
        SubTitle:
          "Geben Sie am Anfang des Eingabefelds / ein, um die automatische Vervollständigung auszulösen",
      },
      List: "Benutzerdefinierte Eingabeaufforderungsliste",
      ListCount: (builtin: number, custom: number) =>
        `Eingebaut ${builtin} Stück, Benutzerdefiniert ${custom} Stück`,
      Edit: "Bearbeiten",
      Modal: {
        Title: "Eingabeaufforderungsliste",
        Add: "Neu erstellen",
        Search: "Eingabeaufforderungen suchen",
      },
      EditModal: {
        Title: "Eingabeaufforderung bearbeiten",
      },
    },
    HistoryCount: {
      Title: "Anzahl der historischen Nachrichten",
      SubTitle:
        "Anzahl der historischen Nachrichten, die bei jeder Anfrage mitgesendet werden",
    },
    CompressThreshold: {
      Title: "Komprimierungsschwelle für historische Nachrichtenlänge",
      SubTitle:
        "Wenn die unkomprimierten historischen Nachrichten diesen Wert überschreiten, wird komprimiert",
    },

    Access: {
      SaasStart: {
        Title: "",
        Label: "",
        SubTitle: "",
        ChatNow: "",
      },
      AccessCode: {
        Title: "Zugangscode",
        SubTitle:
          "Der Administrator hat die verschlüsselte Zugriffskontrolle aktiviert",
        Placeholder: "Geben Sie den Zugangscode ein",
      },
      CustomEndpoint: {
        Title: "Benutzerdefinierte Schnittstelle",
        SubTitle: "Benutzerdefinierte Azure- oder OpenAI-Dienste verwenden",
      },
      Provider: {
        Title: "Modellanbieter",
        SubTitle: "Wechseln Sie zu verschiedenen Anbietern",
        Name: {
          ByteDance: "ByteDance",
          Alibaba: "Alibaba Cloud",
          Moonshot: "Moonshot",
        },
        Status: {
          Enabled: "Aktiviert",
        },
        Models: {
          Title: "Aktivierte Modelle",
          SubTitle: "Liste der aktivierten Modelle im aktuellen Anbieter",
          NoModels: "Keine Modelle aktiviert",
          Manage: "Verwalten",
        },
        Description: {
          OpenAI: "OpenAI GPT-Serienmodelle",
          Azure: "Microsoft Azure OpenAI Service",
          Google: "Google Gemini-Serienmodelle",
          Anthropic: "Anthropic Claude-Serienmodelle",
          ByteDance: "ByteDance Doubao-Serienmodelle",
          Alibaba: "Alibaba Cloud Qwen-Serienmodelle",
          Moonshot: "Moonshot Kimi-Serienmodelle",
          DeepSeek: "DeepSeek-Serienmodelle",
          XAI: "xAI Grok-Serienmodelle",
          SiliconFlow: "SiliconFlow",
          Custom: "Benutzerdefiniert",
        },
        Terms: {
          Provider: "Anbieter",
        },
      },
      OpenAI: {
        ApiKey: {
          Title: "OpenAI API-Schlüssel",
          SubTitle: "Verwenden Sie benutzerdefinierten OpenAI-Schlüssel",
          Placeholder: "sk-xxx",
        },

        Endpoint: {
          Title: "OpenAI Endpoint",
          SubTitle:
            "Muss mit http(s):// beginnen oder /api/openai als Standard verwenden",
        },
      },
      Azure: {
        ApiKey: {
          Title: "Azure API-Schlüssel",
          SubTitle: "Überprüfen Sie Ihren API-Schlüssel in der Azure-Konsole",
          Placeholder: "Azure API-Schlüssel",
        },

        Endpoint: {
          Title: "Azure Endpoint",
          SubTitle: "Beispiel:",
        },

        ApiVerion: {
          Title: "Azure API-Version",
          SubTitle: "Überprüfen Sie Ihre API-Version in der Azure-Konsole",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "Anthropic API-Schlüssel",
          SubTitle:
            "Verwenden Sie benutzerdefinierten Anthropic-Schlüssel, um Passwortzugangsbeschränkungen zu umgehen",
          Placeholder: "Anthropic API-Schlüssel",
        },

        Endpoint: {
          Title: "Endpunktadresse",
          SubTitle: "Beispiel:",
        },

        ApiVerion: {
          Title: "API-Version (Claude API-Version)",
          SubTitle: "Wählen und geben Sie eine spezifische API-Version ein",
        },
      },
      Google: {
        ApiKey: {
          Title: "API-Schlüssel",
          SubTitle: "Holen Sie sich Ihren API-Schlüssel von Google AI",
          Placeholder: "Geben Sie Ihren Google AI Studio API-Schlüssel ein",
        },

        Endpoint: {
          Title: "Endpunktadresse",
          SubTitle: "Beispiel:",
        },

        ApiVersion: {
          Title: "API-Version (nur für gemini-pro)",
          SubTitle: "Wählen Sie eine spezifische API-Version aus",
        },
        GoogleSafetySettings: {
          Title: "Google Sicherheitsfilterstufe",
          SubTitle: "Inhaltfilterstufe einstellen",
        },
      },
      Baidu: {
        ApiKey: {
          Title: "API-Schlüssel",
          SubTitle: "Verwenden Sie benutzerdefinierten Baidu API-Schlüssel",
          Placeholder: "Baidu API-Schlüssel",
        },
        SecretKey: {
          Title: "Geheimschlüssel",
          SubTitle: "Verwenden Sie benutzerdefinierten Baidu Geheimschlüssel",
          Placeholder: "Baidu Geheimschlüssel",
        },
        Endpoint: {
          Title: "Endpunktadresse",
          SubTitle:
            "Keine benutzerdefinierten Adressen unterstützen, konfigurieren Sie in .env",
        },
      },
      Tencent: {
        ApiKey: {
          Title: "API-Schlüssel",
          SubTitle: "Verwenden Sie benutzerdefinierten Tencent API-Schlüssel",
          Placeholder: "Tencent API-Schlüssel",
        },
        SecretKey: {
          Title: "Geheimschlüssel",
          SubTitle: "Verwenden Sie benutzerdefinierten Tencent Geheimschlüssel",
          Placeholder: "Tencent Geheimschlüssel",
        },
        Endpoint: {
          Title: "Endpunktadresse",
          SubTitle:
            "Keine benutzerdefinierten Adressen unterstützen, konfigurieren Sie in .env",
        },
      },
      ByteDance: {
        ApiKey: {
          Title: "Schnittstellenschlüssel",
          SubTitle: "Verwenden Sie benutzerdefinierten ByteDance API-Schlüssel",
          Placeholder: "ByteDance API-Schlüssel",
        },
        Endpoint: {
          Title: "Endpunktadresse",
          SubTitle: "Beispiel:",
        },
      },
      Alibaba: {
        ApiKey: {
          Title: "Schnittstellenschlüssel",
          SubTitle:
            "Verwenden Sie benutzerdefinierten Alibaba Cloud API-Schlüssel",
          Placeholder: "Alibaba Cloud API-Schlüssel",
        },
        Endpoint: {
          Title: "Endpunktadresse",
          SubTitle: "Beispiel:",
        },
      },
      Moonshot: {
        ApiKey: {
          Title: "Schnittstellenschlüssel",
          SubTitle: "Verwenden Sie benutzerdefinierten Moonshot API-Schlüssel",
          Placeholder: "Moonshot API-Schlüssel",
        },
        Endpoint: {
          Title: "Endpunktadresse",
          SubTitle: "Beispiel:",
        },
      },
      DeepSeek: {
        ApiKey: {
          Title: "Schnittstellenschlüssel",
          SubTitle: "Verwenden Sie benutzerdefinierten DeepSeek API-Schlüssel",
          Placeholder: "DeepSeek API-Schlüssel",
        },
        Endpoint: {
          Title: "Endpunktadresse",
          SubTitle: "Beispiel:",
        },
      },
      XAI: {
        ApiKey: {
          Title: "Schnittstellenschlüssel",
          SubTitle: "Verwenden Sie benutzerdefinierten XAI API-Schlüssel",
          Placeholder: "XAI API-Schlüssel",
        },
        Endpoint: {
          Title: "Endpunktadresse",
          SubTitle: "Beispiel:",
        },
      },
      SiliconFlow: {
        ApiKey: {
          Title: "Schnittstellenschlüssel",
          SubTitle:
            "Verwenden Sie benutzerdefinierten SiliconFlow API-Schlüssel",
          Placeholder: "SiliconFlow API-Schlüssel",
        },
        Endpoint: {
          Title: "Endpunktadresse",
          SubTitle: "Beispiel:",
        },
      },
      ChatGLM: {
        ApiKey: {
          Title: "API-Schlüssel",
          SubTitle: "Verwenden Sie benutzerdefinierten ChatGLM API-Schlüssel",
          Placeholder: "ChatGLM API-Schlüssel",
        },
        Endpoint: {
          Title: "Endpunktadresse",
          SubTitle: "Beispiel:",
        },
      },
      Iflytek: {
        ApiKey: {
          Title: "ApiKey",
          SubTitle: "Holen Sie sich ApiKey von der iFlytek Spark-Konsole",
          Placeholder: "ApiKey",
        },
        ApiSecret: {
          Title: "ApiSecret",
          SubTitle: "Holen Sie sich ApiSecret von der iFlytek Spark-Konsole",
          Placeholder: "ApiSecret",
        },
        Endpoint: {
          Title: "Endpunktadresse",
          SubTitle: "Beispiel:",
        },
      },
      AI302: {
        ApiKey: {
          Title: "Schnittstellenschlüssel",
          SubTitle:
            "Verwenden Sie einen benutzerdefinierten 302.AI API-Schlüssel",
          Placeholder: "302.AI API-Schlüssel",
        },
        Endpoint: {
          Title: "Endpunktadresse",
          SubTitle: "Beispiel:",
        },
      },
      CustomProvider: {
        Add: {
          Title: "Benutzerdefinierten Anbieter hinzufügen",
          Button: "Benutzerdefinierten Anbieter hinzufügen",
          Description:
            "Benutzerdefinierten Kanal basierend auf vorhandenen Anbietertypen hinzufügen",
        },
        Modal: {
          Title: "Benutzerdefinierten Anbieter hinzufügen",
          Name: {
            Title: "Anbietername",
            Placeholder:
              "Geben Sie den Namen des benutzerdefinierten Anbieters ein",
            Required: "Bitte geben Sie den Anbieternamen ein",
            Unique:
              "Anbietername existiert bereits, bitte verwenden Sie einen anderen Namen",
          },
          Type: {
            Title: "Anbietertyp",
            OpenAI: "OpenAI - OpenAI API-kompatible Dienste",
            Google: "Google - Google Gemini API",
            Anthropic: "Anthropic - Anthropic Claude API",
          },
          ApiKey: {
            Title: "API-Schlüssel",
            Placeholder: "Geben Sie den API-Schlüssel ein",
            Required: "Bitte geben Sie den API-Schlüssel ein",
          },
          Endpoint: {
            Title: "Benutzerdefinierter Endpunkt",
            Placeholder: "Leer lassen, um den Standardendpunkt zu verwenden",
            Optional: "(Optional)",
          },
          Cancel: "Abbrechen",
          Confirm: "Hinzufügen",
        },
        Config: {
          Type: "Anbietertyp",
          BasedOn: "Basierend auf",
          ApiKeyDescription: "API-Schlüssel des benutzerdefinierten Anbieters",
          EndpointDescription: "Adresse der benutzerdefinierten API-Endpunkt",
          EndpointPlaceholder: "Adresse der API-Endpunkt",
          Delete: {
            Title: "Anbieter löschen",
            SubTitle:
              "Diesen benutzerdefinierten Anbieter und alle seine Konfigurationen löschen",
            Button: "Löschen",
            Confirm:
              "Sind Sie sicher, dass Sie den benutzerdefinierten Anbieter löschen möchten",
            ConfirmSuffix: "?",
          },
        },
      },
    },

    Model: "Modell (model)",
    CompressModel: {
      Title: "Kompressionsmodell",
      SubTitle: "Modell zur Komprimierung des Verlaufs",
    },
    Temperature: {
      Title: "Zufälligkeit (temperature)",
      SubTitle: "Je höher der Wert, desto zufälliger die Antwort",
    },
    TopP: {
      Title: "Kern-Sampling (top_p)",
      SubTitle:
        "Ähnlich der Zufälligkeit, aber nicht zusammen mit Zufälligkeit ändern",
    },
    MaxTokens: {
      Title: "Maximale Token-Anzahl pro Antwort (max_tokens)",
      SubTitle: "Maximale Anzahl der Tokens pro Interaktion",
    },
    PresencePenalty: {
      Title: "Themenfrische (presence_penalty)",
      SubTitle:
        "Je höher der Wert, desto wahrscheinlicher wird auf neue Themen eingegangen",
    },
    FrequencyPenalty: {
      Title: "Häufigkeitsstrafe (frequency_penalty)",
      SubTitle:
        "Je höher der Wert, desto wahrscheinlicher werden wiederholte Wörter reduziert",
    },
    TTS: {
      Enable: {
        Title: "TTS aktivieren",
        SubTitle: "Text-zu-Sprache-Dienst aktivieren",
      },
      Autoplay: {
        Title: "Automatische Wiedergabe aktivieren",
        SubTitle:
          "Automatisch Sprache generieren und abspielen, Sie müssen zuerst den Text-zu-Sprache-Schalter aktivieren",
      },
      Model: "Modell",
      Engine: "Konvertierungs-Engine",
      EngineConfig: {
        Title: "Konfigurationshinweis",
        SubTitle:
          "OpenAI-TTS wird die OpenAI-Anbieterkonfiguration in Modellservices verwenden. Bitte fügen Sie den entsprechenden API-Schlüssel im OpenAI-Anbieter hinzu, bevor Sie es verwenden",
      },
      Voice: {
        Title: "Stimme",
        SubTitle: "Die zu verwendende Stimme bei der Audioerzeugung",
      },
      Speed: {
        Title: "Geschwindigkeit",
        SubTitle: "Die Geschwindigkeit des erzeugten Audios",
      },
    },
    Realtime: {
      Enable: {
        Title: "Echtzeit-Chat",
        SubTitle: "Echtzeit-Chat-Funktion aktivieren",
      },
      Provider: {
        Title: "Modellanbieter",
        SubTitle: "Zwischen verschiedenen Anbietern wechseln",
      },
      Model: {
        Title: "Modell",
        SubTitle: "Ein Modell auswählen",
      },
      ApiKey: {
        Title: "API-Schlüssel",
        SubTitle: "API-Schlüssel",
        Placeholder: "API-Schlüssel",
      },
      Azure: {
        Endpoint: {
          Title: "Endpunkt",
          SubTitle: "Endpunkt",
        },
        Deployment: {
          Title: "Bereitstellungsname",
          SubTitle: "Bereitstellungsname",
        },
      },
      Temperature: {
        Title: "Zufälligkeit (temperature)",
        SubTitle: "Höhere Werte führen zu zufälligeren Antworten",
      },
    },
  },
  Store: {
    DefaultTopic: "Neuer Chat",
    BotHello: "Wie kann ich Ihnen helfen?",
    Error:
      "Ein Fehler ist aufgetreten, bitte versuchen Sie es später noch einmal",
    Prompt: {
      History: (content: string) =>
        "Dies ist eine Zusammenfassung des bisherigen Chats als Hintergrundinformation: " +
        content,
      Topic:
        "Geben Sie ein kurzes Thema in vier bis fünf Wörtern zurück, ohne Erklärungen, ohne Satzzeichen, ohne Füllwörter, ohne zusätzliche Texte und ohne Fettdruck. Wenn kein Thema vorhanden ist, geben Sie bitte „Allgemeines Gespräch“ zurück.",
      Summarize:
        "Fassen Sie den Gesprächsinhalt zusammen, um als Kontextaufforderung für den nächsten Schritt zu dienen, halten Sie es unter 200 Zeichen",
    },
  },
  Copy: {
    Success: "In die Zwischenablage geschrieben",
    Failed:
      "Kopieren fehlgeschlagen, bitte erlauben Sie Zugriff auf die Zwischenablage",
  },
  Download: {
    Success: "Inhalt wurde in Ihrem Verzeichnis heruntergeladen.",
    Failed: "Download fehlgeschlagen.",
  },
  Context: {
    Toast: (x: any) => `Beinhaltet ${x} vordefinierte Eingabeaufforderungen`,
    Edit: "Aktuelle Gesprächseinstellungen",
    Add: "Neues Gespräch hinzufügen",
    Clear: "Kontext gelöscht",
    Revert: "Kontext wiederherstellen",
  },

  ChatSettings: {
    Name: "Gesprächseinstellungen",
  },
  Mcp: {
    Name: "MCP",
  },
  FineTuned: {
    Sysmessage: "Du bist ein Assistent",
  },
  SearchChat: {
    Name: "Suche",
    Page: {
      Title: "Chatverlauf durchsuchen",
      Search: "Suchbegriff eingeben",
      NoResult: "Keine Ergebnisse gefunden",
      NoData: "Keine Daten",
      Loading: "Laden",

      SubTitle: (count: number) => `${count} Ergebnisse gefunden`,
    },
    Item: {
      View: "Ansehen",
    },
  },
  Mask: {
    Name: "Assistent",
    DefaultName: "Standard-Assistent",
    Management: "Assistenten-Verwaltung",
    NewMask: "Neuer Assistent",
    DefaultModel: "Standard-Modell",
    DefaultModelDesc: "Standard-Modell für neue Gespräche",
    UseGlobalModel: "Globales Standard-Modell verwenden",
    ConversationCount: (count: number) =>
      `${count} Gespräch${count > 1 ? "e" : ""}`,
    Page: {
      Title: "Vordefinierte Rollenassistenten",
      SubTitle: (count: number) =>
        `${count} vordefinierte Rollenbeschreibungen`,
      Search: "Rollenassistenten suchen",
      Create: "Erstellen",
    },
    Item: {
      Info: (count: number) => `Beinhaltet ${count} Eingabeaufforderungen`,
      Chat: "Gespräch",
      View: "Anzeigen",
      Edit: "Bearbeiten",
      Delete: "Löschen",
      DeleteConfirm: "Löschung bestätigen?",
    },
    EditModal: {
      Title: "Assistenten bearbeiten",
      Download: "Voreinstellung herunterladen",
      Clone: "Voreinstellung klonen",
    },
    Config: {
      Avatar: "Rollen-Avatar",
      Name: "Rollenname",
      Sync: {
        Title: "Globale Einstellungen verwenden",
        SubTitle:
          "Soll das aktuelle Gespräch die globalen Modelleinstellungen verwenden?",
        Confirm:
          "Die benutzerdefinierten Einstellungen des aktuellen Gesprächs werden automatisch überschrieben. Bestätigen Sie, dass Sie die globalen Einstellungen aktivieren möchten?",
      },
      HideContext: {
        Title: "Vordefinierte Gespräche ausblenden",
        SubTitle:
          "Nach dem Ausblenden werden vordefinierte Gespräche nicht mehr im Chat angezeigt",
      },
      Artifacts: {
        Title: "Artefakte aktivieren",
        SubTitle: "Wenn aktiviert, können HTML-Seiten direkt gerendert werden",
      },
      CodeFold: {
        Title: "Code-Faltung aktivieren",
        SubTitle:
          "Wenn aktiviert, können lange Code-Blöcke automatisch gefaltet/entfaltet werden",
      },
      Share: {
        Title: "Diesen Assistenten teilen",
        SubTitle: "Erzeugen Sie einen Direktlink zu diesem Assistenten",
        Action: "Link kopieren",
      },
    },
  },
  NewChat: {
    Return: "Zurück",
    Skip: "Direkt beginnen",
    Title: "Assistenten auswählen",
    SubTitle:
      "Starten Sie jetzt und lassen Sie sich von den Gedanken hinter dem Assistenten inspirieren",
    More: "Alle anzeigen",
    Less: "Code einklappen",
    ShowCode: "Code anzeigen",
    Preview: "Vorschau",
    NotShow: "Nicht mehr anzeigen",
    ConfirmNoShow:
      "Deaktivierung bestätigen? Sie können diese Option jederzeit in den Einstellungen wieder aktivieren.",
    Searching: "Suche läuft...",
    Search: "Suchen",
    NoSearch: "Keine Suchergebnisse",
    SearchFormat: (SearchTime?: number) =>
      SearchTime !== undefined
        ? `(Suche dauerte ${Math.round(SearchTime / 1000)} s)`
        : "",
    Thinking: "Denke...",
    Think: "Denkinhalt",
    NoThink: "Kein Denkinhalt",
    ThinkFormat: (thinkingTime?: number) =>
      thinkingTime !== undefined
        ? `(Denken dauerte ${Math.round(thinkingTime / 1000)} s)`
        : "",
  },

  URLCommand: {
    Code: "Zugangscode aus URL erkannt, Anwendung bestätigen?",
    Settings:
      "Vordefinierte Einstellungen aus URL erkannt, Anwendung bestätigen?",
  },

  UI: {
    Confirm: "Bestätigen",
    Cancel: "Abbrechen",
    Close: "Schließen",
    Create: "Erstellen",
    Edit: "Bearbeiten",
    Export: "Exportieren",
    Import: "Importieren",
    Sync: "Synchronisieren",
    Config: "Konfigurieren",
  },
  Exporter: {
    Description: {
      Title: "Nur Nachrichten nach dem Löschen des Kontexts werden angezeigt",
    },
    Model: "Modell",
    Messages: "Nachrichten",
    Topic: "Thema",
    Time: "Zeit",
  },
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type LocaleType = typeof de;
export type PartialLocaleType = DeepPartial<typeof de>;

export default de;
