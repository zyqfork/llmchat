import { getClientConfig } from "../config/client";
import { SubmitKey } from "../store/config";
import { SAAS_CHAT_UTM_URL } from "@/app/constant";

const isApp = !!getClientConfig()?.isApp;

const it = {
  WIP: "Work in progress...",
  Error: {
    Unauthorized: isApp
      ? `😆 La conversazione ha incontrato alcuni problemi, non preoccuparti:
    \\ 1️⃣ Se vuoi iniziare senza configurazione, [clicca qui per iniziare a chattare immediatamente 🚀](${SAAS_CHAT_UTM_URL})
    \\ 2️⃣ Se vuoi utilizzare le tue risorse OpenAI, clicca [qui](/#/settings) per modificare le impostazioni ⚙️`
      : `😆 La conversazione ha incontrato alcuni problemi, non preoccuparti:
    \ 1️⃣ Se vuoi iniziare senza configurazione, [clicca qui per iniziare a chattare immediatamente 🚀](${SAAS_CHAT_UTM_URL})
    \ 2️⃣ Se stai utilizzando una versione di distribuzione privata, clicca [qui](/#/auth) per inserire la chiave di accesso 🔑
    \ 3️⃣ Se vuoi utilizzare le tue risorse OpenAI, clicca [qui](/#/settings) per modificare le impostazioni ⚙️
 `,
  },
  Auth: {
    Return: "Ritorna",
    Title: "Password richiesta",
    Tips: "L'amministratore ha abilitato la verifica della password. Inserisci il codice di accesso qui sotto",
    SubTips: "O inserisci la tua chiave API OpenAI o Google",
    Input: "Inserisci il codice di accesso qui",
    Confirm: "Conferma",
    Later: "Più tardi",
    SaasTips: "",
    TopTips: "",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} conversazioni`,
  },
  Chat: {
    MultiModel: {
      Title: "Impostazioni Chat Multi-Modello",
      Enabled: "Multi-Modello (Attivato)",
      Disabled: "Multi-Modello (Disattivato)",
      Count: (count: number) => `${count} modelli`,
      Description:
        "🎯 Modalità Arena Multi-Modello attivata! Clicca sul selettore di modelli per scegliere più modelli per la conversazione.",
      OpenSelector: "Apri Selettore Modelli",
      AlreadySelected: (count: number) => `(${count} selezionati)`,
      Tips: "💡 Suggerimento: In modalità multi-modello, puoi selezionare più modelli simultaneamente, e ogni modello risponderà indipendentemente ai tuoi messaggi, permettendoti di confrontare le risposte dei diversi modelli.",
      EnableToast:
        "🎯 Modalità Multi-Modello attivata! Clicca sul selettore di modelli per scegliere più modelli per l'arena di conversazione",
      DisableToast: "Modalità Multi-Modello disattivata",
      MinimumModelsError:
        "Seleziona almeno 2 modelli per attivare le conversazioni multi-modello",
      ModelsSelectedToast: (count: number) =>
        `${count} modelli selezionati per la conversazione`,
    },
    UI: {
      SidebarToggle: "Comprimi/Espandi Barra Laterale",
      SearchModels: "Cerca modelli...",
      SelectModel: "Seleziona modello",
      ContextTooltip: {
        Current: (current: number, max: number) =>
          `Contesto attuale: ${current} / ${max}`,
        CurrentTokens: (current: number, max: number) =>
          `Token attuali: ${current.toLocaleString()} / ${max.toLocaleString()}`,
        CurrentTokensUnknown: (current: number) =>
          `Token attuali: ${current.toLocaleString()} / Sconosciuto`,
        EstimatedTokens: (estimated: number) =>
          `Token stimati: ${estimated.toLocaleString()}`,
        ContextTokens: (tokens: string) => `Contesto: ${tokens} token`,
      },
    },
    SubTitle: (count: number) => `Totale ${count} conversazioni`,
    EditMessage: {
      Title: "Modifica cronologia messaggi",
      Topic: {
        Title: "Argomento della chat",
        SubTitle: "Modifica l'argomento della chat corrente",
      },
    },
    Actions: {
      ChatList: "Visualizza l'elenco dei messaggi",
      CompressedHistory: "Visualizza la cronologia Prompt compressa",
      Export: "Esporta la cronologia chat",
      Copy: "Copia",
      Stop: "Interrompi",
      Retry: "Riprova",
      Pin: "Fissa",
      PinToastContent: "1 conversazione fissata ai suggerimenti predefiniti",
      PinToastAction: "Visualizza",
      Delete: "Elimina",
      Edit: "Modifica",
      FullScreen: "Schermo Intero",
      RefreshTitle: "Aggiorna titolo",
      RefreshToast: "Richiesta di aggiornamento del titolo inviata",
      Speech: "Riproduci",
      StopSpeech: "Interrompi",
      PreviousVersion: "Versione Precedente",
      NextVersion: "Versione Successiva",
      Debug: "Debug",
      CopyAsCurl: "Copia come cURL",
    },
    Commands: {
      new: "Nuova chat",
      newm: "Nuova chat da maschera",
      next: "Chat successiva",
      prev: "Chat precedente",
      clear: "Pulisci contesto",
      fork: "Copia Conversazione",
      del: "Elimina chat",
    },
    InputActions: {
      Stop: "Interrompi Risposta",
      ToBottom: "Scorri fino al più recente",
      Theme: {
        auto: "Tema automatico",
        light: "Tema chiaro",
        dark: "Tema scuro",
      },
      Prompt: "Comandi rapidi",
      Masks: "Tutte le maschere",
      Clear: "Pulisci chat",
      Reset: "Reimposta Conversazione",
      ResetConfirm:
        "Sei sicuro di voler reimpostare l'intero contenuto della finestra di chat attuale?",
      Settings: "Impostazioni conversazione",
      UploadImage: "Carica immagine",
      Search: "Cerca",
      SearchOn: "Ricerca Attivata",
      SearchOff: "Ricerca Disattivata",
      SearchEnabledToast:
        "🔍 Funzione di ricerca attivata! Ora puoi cercare sul web",
      SearchDisabledToast: "❌ Funzione di ricerca disattivata",
    },
    MCP: {
      Title: "Controllo Strumenti MCP",
      Enable: "Attiva Funzionalità MCP",
      EnableDesc:
        "Quando attivato, gli strumenti MCP possono essere utilizzati. Quando disattivato, i prompt relativi a MCP non verranno inviati",
      NoTools: "Nessuno strumento MCP disponibile",
      Loading: "Caricamento...",
      ClientFailed: "Caricamento client MCP fallito, elaborazione silenziosa",
      ToolsCount: (count: number) => `${count} strumenti`,
    },
    Rename: "Rinomina conversazione",
    Typing: "Digitazione in corso…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} per inviare`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "，Shift + Enter per andare a capo";
      }
      return (
        inputHints +
        "，/ per attivare il completamento automatico, : per attivare il comando"
      );
    },
    Send: "Invia",
    TokenUsage: "Utilizzo",
    TokenTooltip: {
      Context: "Contesto attuale",
      CurrentToken: "Token attuali",
      EstimatedToken: "Token stimati",
      Unknown: "Sconosciuto",
    },
    StartSpeak: "Inizia a Parlare",
    StopSpeak: "Interrompi Parlare",
    Config: {
      Reset: "Pulisci memoria",
      SaveAs: "Salva come maschera",
    },
    IsContext: "Suggerimenti predefiniti",
    ShortcutKey: {
      Title: "Tasti di Scelta Rapida",
      newChat: "Apri nuova chat",
      focusInput: "Focalizza campo di input",
      copyLastMessage: "Copia ultima risposta",
      copyLastCode: "Copia ultimo blocco di codice",
      showShortcutKey: "Mostra tasti di scelta rapida",
      clearContext: "Pulisci contesto",
    },
    Thinking: {
      Title: "Profondità del Pensiero",
      Dynamic: "Pensiero Dinamico",
      DynamicDesc:
        "Il modello decide automaticamente la profondità del pensiero",
      Off: "Pensiero Disattivato",
      OffDesc: "Nessun processo di pensiero",
      Light: "Pensiero Leggero",
      LightDesc: "1024 token",
      Medium: "Pensiero Medio",
      MediumDesc: "4096 token",
      Deep: "Pensiero Profondo",
      DeepDesc: "8192 token",
      VeryDeep: "Pensiero Molto Profondo",
      VeryDeepDesc: "16384 token",
      Notice:
        "Solo i modelli che supportano thinkingBudget possono regolare la profondità del pensiero",
      ClaudeNotice:
        "Solo i modelli della serie Claude possono regolare la profondità del pensiero",
      GeminiNotice:
        "Solo i modelli della serie Gemini possono regolare la profondità del pensiero",
      ClaudeLight: "Pensare",
      ClaudeLightDesc: "5000 token",
      ClaudeMedium: "Pensare Seriamente",
      ClaudeMediumDesc: "10000 token",
      ClaudeDeep: "Pensare Più Seriamente",
      ClaudeDeepDesc: "20000 token",
      ClaudeVeryDeep: "Ultra Pensiero",
      ClaudeVeryDeepDesc: "32000 token",
      ClaudeDynamicDesc:
        "Regola automaticamente la profondità del pensiero (predefinito 10000 token)",
    },
  },
  Export: {
    Title: "Condividi cronologia chat",
    Copy: "Copia tutto",
    Download: "Scarica file",
    Share: "Condividi cronologia chat",
    MessageFromYou: "Utente",
    MessageFromChatGPT: "ChatGPT",
    Format: {
      Title: "Formato di esportazione",
      SubTitle: "Puoi esportare come testo Markdown o immagine PNG",
    },
    IncludeContext: {
      Title: "Includi contesto maschera",
      SubTitle: "Mostrare il contesto della maschera nei messaggi",
    },
    Steps: {
      Select: "Seleziona",
      Preview: "Anteprima",
    },
    Image: {
      Toast: "Generazione screenshot in corso",
      Modal:
        "Tieni premuto o fai clic con il tasto destro per salvare l'immagine",
    },
    Artifacts: {
      Title: "Stampa Pagina",
      Error: "Errore di Stampa",
    },
  },
  Select: {
    Search: "Cerca messaggi",
    All: "Seleziona tutto",
    Latest: "Ultimi messaggi",
    Clear: "Pulisci selezione",
  },
  Memory: {
    Title: "Riassunto storico",
    EmptyContent:
      "Il contenuto della conversazione è troppo breve, nessun riassunto necessario",
    Send: "Comprimi automaticamente la cronologia chat e inviala come contesto",
    Copy: "Copia riassunto",
    Reset: "[unused]",
    ResetConfirm: "Confermi la cancellazione del riassunto storico?",
  },
  Home: {
    NewChat: "Nuova chat",
    DeleteChat: "Confermi l'eliminazione della conversazione selezionata?",
    DeleteToast: "Conversazione eliminata",
    Revert: "Annulla",
  },
  Settings: {
    Title: "Impostazioni",
    SubTitle: "Tutte le opzioni di impostazione",
    ShowPassword: "Mostra Password",

    Tab: {
      General: "Impostazioni Generali",
      Sync: "Sincronizzazione Cloud",
      Mask: "Maschera",
      Prompt: "Prompt",
      ModelService: "Servizio Modello",
      ModelConfig: "Configurazione Modello",
      Voice: "Voce",
    },

    Danger: {
      Reset: {
        Title: "Ripristina tutte le impostazioni",
        SubTitle:
          "Ripristina tutte le opzioni di impostazione ai valori predefiniti",
        Action: "Ripristina subito",
        Confirm: "Confermi il ripristino di tutte le impostazioni?",
      },
      Clear: {
        Title: "Elimina tutti i dati",
        SubTitle: "Elimina tutte le chat e i dati delle impostazioni",
        Action: "Elimina subito",
        Confirm:
          "Confermi l'eliminazione di tutte le chat e dei dati delle impostazioni?",
      },
    },
    Lang: {
      Name: "Language", // ATTENZIONE: se vuoi aggiungere una nuova traduzione, non tradurre questo valore, lascialo come `Language`
      All: "Tutte le lingue",
    },
    Avatar: "Avatar",
    FontSize: {
      Title: "Dimensione del carattere",
      SubTitle: "Dimensione del carattere per il contenuto della chat",
    },
    FontFamily: {
      Title: "Font della Chat",
      SubTitle:
        "Carattere del contenuto della chat, lascia vuoto per applicare il carattere predefinito globale",
      Placeholder: "Nome del Font",
    },
    InjectSystemPrompts: {
      Title: "Inserisci suggerimenti di sistema",
      SubTitle:
        "Aggiungi forzatamente un suggerimento di sistema simulato di ChatGPT all'inizio della lista dei messaggi per ogni richiesta",
    },
    InputTemplate: {
      Title: "Preprocessing dell'input utente",
      SubTitle:
        "L'ultimo messaggio dell'utente verrà inserito in questo modello",
    },

    Update: {
      Version: (x: string) => `Versione attuale: ${x}`,
      IsLatest: "È l'ultima versione",
      CheckUpdate: "Controlla aggiornamenti",
      IsChecking: "Controllo aggiornamenti in corso...",
      FoundUpdate: (x: string) => `Nuova versione trovata: ${x}`,
      GoToUpdate: "Vai all'aggiornamento",
      Success: "Aggiornamento riuscito!",
      Failed: "Aggiornamento fallito",
    },
    SendKey: "Tasto di invio",
    Theme: "Tema",
    TightBorder: "Modalità senza bordi",
    SendPreviewBubble: {
      Title: "Bolla di anteprima",
      SubTitle: "Anteprima del contenuto Markdown nella bolla di anteprima",
    },
    AutoGenerateTitle: {
      Title: "Generazione automatica del titolo",
      SubTitle:
        "Genera un titolo appropriato in base al contenuto della conversazione",
    },
    Sync: {
      CloudState: "Dati cloud",
      NotSyncYet: "Non è ancora avvenuta alcuna sincronizzazione",
      Success: "Sincronizzazione riuscita",
      Fail: "Sincronizzazione fallita",

      Config: {
        Modal: {
          Title: "Configura sincronizzazione cloud",
          Check: "Controlla disponibilità",
        },
        SyncType: {
          Title: "Tipo di sincronizzazione",
          SubTitle: "Scegli il server di sincronizzazione preferito",
        },
        Proxy: {
          Title: "Abilita proxy",
          SubTitle:
            "Durante la sincronizzazione nel browser, è necessario abilitare il proxy per evitare restrizioni CORS",
        },
        ProxyUrl: {
          Title: "Indirizzo proxy",
          SubTitle: "Solo per il proxy CORS fornito con questo progetto",
        },

        WebDav: {
          Endpoint: "Indirizzo WebDAV",
          UserName: "Nome utente",
          Password: "Password",
        },

        UpStash: {
          Endpoint: "URL REST di UpStash Redis",
          UserName: "Nome di backup",
          Password: "Token REST di UpStash Redis",
        },
      },

      LocalState: "Dati locali",
      Overview: (overview: any) => {
        return `${overview.chat} chat, ${overview.message} messaggi, ${overview.prompt} suggerimenti, ${overview.mask} maschere`;
      },
      ImportFailed: "Importazione fallita",
    },
    Mask: {
      ModelIcon: {
        Title: "Usa Icona Modello come Avatar IA",
        SubTitle:
          "Quando attivato, l'avatar IA nelle conversazioni userà l'icona del modello corrente invece delle emoji",
      },
    },
    AccessCode: {
      Title: "Codice di Accesso",
      SubTitle:
        "Controllo di accesso attivato, per favore inserisci il codice di accesso",
      Placeholder: "Inserisci il codice di accesso",
      Status: {
        Enabled: "Controllo di accesso attivato",
        Valid: "Codice di accesso valido",
        Invalid: "Codice di accesso non valido",
      },
    },
    Prompt: {
      Disable: {
        Title: "Disabilita completamento automatico dei suggerimenti",
        SubTitle:
          "Inserisci / all'inizio della casella di input per attivare il completamento automatico",
      },
      List: "Elenco dei suggerimenti personalizzati",
      ListCount: (builtin: number, custom: number) =>
        `${builtin} predefiniti, ${custom} definiti dall'utente`,
      Edit: "Modifica",
      Modal: {
        Title: "Elenco dei suggerimenti",
        Add: "Nuovo",
        Search: "Cerca suggerimenti",
      },
      EditModal: {
        Title: "Modifica suggerimenti",
      },
    },
    HistoryCount: {
      Title: "Numero di messaggi storici inclusi",
      SubTitle: "Numero di messaggi storici inclusi in ogni richiesta",
    },
    CompressThreshold: {
      Title: "Soglia di compressione dei messaggi storici",
      SubTitle:
        "Quando i messaggi storici non compressi superano questo valore, verranno compressi",
    },

    Access: {
      SaasStart: {
        Title: "",
        Label: "",
        SubTitle: "",
        ChatNow: "",
      },
      AccessCode: {
        Title: "Password di accesso",
        SubTitle: "L'amministratore ha abilitato l'accesso criptato",
        Placeholder: "Inserisci la password di accesso",
      },
      CustomEndpoint: {
        Title: "Interfaccia personalizzata",
        SubTitle: "Utilizzare servizi Azure o OpenAI personalizzati",
      },
      Provider: {
        Title: "Fornitore del modello",
        SubTitle: "Cambia fornitore di servizi",
        Name: {
          ByteDance: "ByteDance",
          Alibaba: "Alibaba Cloud",
          Moonshot: "Moonshot",
        },
        Status: {
          Enabled: "Attivato",
        },
        Models: {
          Title: "Modelli Attivati",
          SubTitle: "Elenco dei modelli attivati nel fornitore attuale",
          NoModels: "Nessun modello attivato",
          Manage: "Gestisci",
        },
        Description: {
          OpenAI: "Modelli della serie OpenAI GPT",
          Azure: "Servizio Microsoft Azure OpenAI",
          Google: "Modelli della serie Google Gemini",
          Anthropic: "Modelli della serie Anthropic Claude",
          ByteDance: "Modelli della serie ByteDance Doubao",
          Alibaba: "Modelli della serie Alibaba Cloud Qwen",
          Moonshot: "Modelli della serie Moonshot Kimi",
          DeepSeek: "Modelli della serie DeepSeek",
          XAI: "Modelli della serie xAI Grok",
          SiliconFlow: "SiliconFlow",
          Custom: "Personalizzato",
        },
        Terms: {
          Provider: "Fornitore",
        },
      },
      OpenAI: {
        ApiKey: {
          Title: "Chiave API OpenAI",
          SubTitle: "Utilizza una chiave OpenAI personalizzata",
          Placeholder: "sk-xxx",
        },

        Endpoint: {
          Title: "Endpoint OpenAI",
          SubTitle:
            "Deve iniziare con http(s):// o usare /api/openai come predefinito",
        },
      },
      Azure: {
        ApiKey: {
          Title: "Chiave API Azure",
          SubTitle: "Controlla la tua chiave API dalla console Azure",
          Placeholder: "Chiave API Azure",
        },

        Endpoint: {
          Title: "Endpoint Azure",
          SubTitle: "Esempio: ",
        },

        ApiVerion: {
          Title: "Versione API Azure",
          SubTitle: "Controlla la tua versione API dalla console Azure",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "Chiave API Anthropic",
          SubTitle:
            "Utilizza una chiave Anthropic personalizzata per bypassare le limitazioni di accesso",
          Placeholder: "Chiave API Anthropic",
        },

        Endpoint: {
          Title: "Indirizzo dell'endpoint",
          SubTitle: "Esempio: ",
        },

        ApiVerion: {
          Title: "Versione API (versione API Claude)",
          SubTitle: "Seleziona e inserisci una versione API specifica",
        },
      },
      Google: {
        ApiKey: {
          Title: "Chiave API",
          SubTitle: "Ottieni la tua chiave API da Google AI",
          Placeholder: "Inserisci la tua chiave API Google AI Studio",
        },

        Endpoint: {
          Title: "Indirizzo dell'endpoint",
          SubTitle: "Esempio: ",
        },

        ApiVersion: {
          Title: "Versione API (solo per gemini-pro)",
          SubTitle: "Seleziona una versione API specifica",
        },
        GoogleSafetySettings: {
          Title: "Livello di filtraggio sicurezza Google",
          SubTitle: "Imposta il livello di filtraggio dei contenuti",
        },
      },
      Baidu: {
        ApiKey: {
          Title: "Chiave API",
          SubTitle: "Utilizza una chiave API Baidu personalizzata",
          Placeholder: "Chiave API Baidu",
        },
        SecretKey: {
          Title: "Chiave Segreta",
          SubTitle: "Utilizza una chiave segreta Baidu personalizzata",
          Placeholder: "Chiave Segreta Baidu",
        },
        Endpoint: {
          Title: "Indirizzo dell'endpoint",
          SubTitle:
            "Gli indirizzi personalizzati non sono supportati, vai su .env",
        },
      },
      Tencent: {
        ApiKey: {
          Title: "Chiave API",
          SubTitle: "Utilizza una chiave API Tencent personalizzata",
          Placeholder: "Chiave API Tencent",
        },
        SecretKey: {
          Title: "Chiave Segreta",
          SubTitle: "Utilizza una chiave segreta Tencent personalizzata",
          Placeholder: "Chiave Segreta Tencent",
        },
        Endpoint: {
          Title: "Indirizzo dell'endpoint",
          SubTitle:
            "Gli indirizzi personalizzati non sono supportati, vai su .env",
        },
      },
      ByteDance: {
        ApiKey: {
          Title: "Chiave dell'interfaccia",
          SubTitle: "Utilizza una chiave API ByteDance personalizzata",
          Placeholder: "Chiave API ByteDance",
        },
        Endpoint: {
          Title: "Indirizzo dell'endpoint",
          SubTitle: "Esempio: ",
        },
      },
      Alibaba: {
        ApiKey: {
          Title: "Chiave dell'interfaccia",
          SubTitle: "Utilizza una chiave API Alibaba Cloud personalizzata",
          Placeholder: "Chiave API Alibaba Cloud",
        },
        Endpoint: {
          Title: "Indirizzo dell'endpoint",
          SubTitle: "Esempio: ",
        },
      },
      Moonshot: {
        ApiKey: {
          Title: "Chiave dell'interfaccia",
          SubTitle: "Utilizza una chiave API Moonshot personalizzata",
          Placeholder: "Chiave API Moonshot",
        },
        Endpoint: {
          Title: "Indirizzo dell'endpoint",
          SubTitle: "Esempio: ",
        },
      },
      DeepSeek: {
        ApiKey: {
          Title: "Chiave dell'interfaccia",
          SubTitle: "Utilizza una chiave API DeepSeek personalizzata",
          Placeholder: "Chiave API DeepSeek",
        },
        Endpoint: {
          Title: "Indirizzo dell'endpoint",
          SubTitle: "Esempio: ",
        },
      },
      XAI: {
        ApiKey: {
          Title: "Chiave dell'interfaccia",
          SubTitle: "Utilizza una chiave API XAI personalizzata",
          Placeholder: "Chiave API XAI",
        },
        Endpoint: {
          Title: "Indirizzo dell'endpoint",
          SubTitle: "Esempio: ",
        },
      },
      SiliconFlow: {
        ApiKey: {
          Title: "Chiave dell'interfaccia",
          SubTitle: "Utilizza una chiave API SiliconFlow personalizzata",
          Placeholder: "Chiave API SiliconFlow",
        },
        Endpoint: {
          Title: "Indirizzo dell'endpoint",
          SubTitle: "Esempio: ",
        },
      },
      ChatGLM: {
        ApiKey: {
          Title: "Chiave API",
          SubTitle: "Utilizza una chiave API ChatGLM personalizzata",
          Placeholder: "Chiave API ChatGLM",
        },
        Endpoint: {
          Title: "Indirizzo dell'endpoint",
          SubTitle: "Esempio: ",
        },
      },
      Iflytek: {
        ApiKey: {
          Title: "ApiKey",
          SubTitle: "Ottieni ApiKey dalla console iFlytek Spark",
          Placeholder: "ApiKey",
        },
        ApiSecret: {
          Title: "ApiSecret",
          SubTitle: "Ottieni ApiSecret dalla console iFlytek Spark",
          Placeholder: "ApiSecret",
        },
        Endpoint: {
          Title: "Indirizzo dell'endpoint",
          SubTitle: "Esempio: ",
        },
      },
      AI302: {
        ApiKey: {
          Title: "Chiave dell'interfaccia",
          SubTitle: "Utilizza una chiave API 302.AI personalizzata",
          Placeholder: "Chiave API 302.AI",
        },
        Endpoint: {
          Title: "Indirizzo dell'endpoint",
          SubTitle: "Esempio: ",
        },
      },
      CustomProvider: {
        Add: {
          Title: "Aggiungi Fornitore Personalizzato",
          Button: "Aggiungi Fornitore Personalizzato",
          Description:
            "Aggiungi canale personalizzato basato su tipi di fornitore esistenti",
        },
        Modal: {
          Title: "Aggiungi Fornitore Personalizzato",
          Name: {
            Title: "Nome Fornitore",
            Placeholder: "Inserisci il nome del fornitore personalizzato",
            Required: "Per favore inserisci il nome del fornitore",
            Unique:
              "Il nome del fornitore esiste già, per favore usa un altro nome",
          },
          Type: {
            Title: "Tipo di Fornitore",
            OpenAI: "OpenAI - Servizi compatibili con API OpenAI",
            Google: "Google - API Google Gemini",
            Anthropic: "Anthropic - API Anthropic Claude",
          },
          ApiKey: {
            Title: "Chiave API",
            Placeholder: "Inserisci la chiave API",
            Required: "Per favore inserisci la chiave API",
          },
          Endpoint: {
            Title: "Endpoint Personalizzato",
            Placeholder: "Lascia vuoto per usare l'endpoint predefinito",
            Optional: "(Opzionale)",
          },
          Cancel: "Annulla",
          Confirm: "Aggiungi",
        },
        Config: {
          Type: "Tipo di Fornitore",
          BasedOn: "Basato su",
          ApiKeyDescription: "Chiave API del fornitore personalizzato",
          EndpointDescription: "Indirizzo endpoint API personalizzato",
          EndpointPlaceholder: "Indirizzo endpoint API",
          Delete: {
            Title: "Elimina Fornitore",
            SubTitle:
              "Elimina questo fornitore personalizzato e tutte le sue configurazioni",
            Button: "Elimina",
            Confirm:
              "Sei sicuro di voler eliminare il fornitore personalizzato",
            ConfirmSuffix: "?",
          },
        },
      },
    },

    Model: "Modello",
    CompressModel: {
      Title: "Modello di compressione",
      SubTitle: "Modello utilizzato per comprimere la cronologia",
    },
    Temperature: {
      Title: "Casualità (temperature)",
      SubTitle: "Valore più alto, risposte più casuali",
    },
    TopP: {
      Title: "Campionamento nucleare (top_p)",
      SubTitle:
        "Simile alla casualità, ma non cambiarlo insieme alla casualità",
    },
    MaxTokens: {
      Title: "Limite di token per risposta (max_tokens)",
      SubTitle: "Numero massimo di token per ogni interazione",
    },
    PresencePenalty: {
      Title: "Novità del tema (presence_penalty)",
      SubTitle:
        "Valore più alto, maggiore possibilità di espandere a nuovi argomenti",
    },
    FrequencyPenalty: {
      Title: "Penalità di frequenza (frequency_penalty)",
      SubTitle:
        "Valore più alto, maggiore possibilità di ridurre le ripetizioni",
    },
    TTS: {
      Enable: {
        Title: "Attiva TTS",
        SubTitle: "Attiva servizio di conversione testo-voce",
      },
      Autoplay: {
        Title: "Attiva Riproduzione Automatica",
        SubTitle:
          "Genera e riproduci automaticamente la voce, devi prima attivare l'interruttore di conversione testo-voce",
      },
      Model: "Modello",
      Engine: "Motore di Conversione",
      EngineConfig: {
        Title: "Nota di Configurazione",
        SubTitle:
          "OpenAI-TTS userà la configurazione del fornitore OpenAI nei servizi di modello. Per favore aggiungi la chiave API corrispondente nel fornitore OpenAI prima di usare",
      },
      Voice: {
        Title: "Voce",
        SubTitle: "La voce da usare quando si genera l'audio",
      },
      Speed: {
        Title: "Velocità",
        SubTitle: "La velocità dell'audio generato",
      },
    },
    Realtime: {
      Enable: {
        Title: "Chat in Tempo Reale",
        SubTitle: "Attiva funzione di chat in tempo reale",
      },
      Provider: {
        Title: "Fornitore di Modello",
        SubTitle: "Cambia tra diversi fornitori",
      },
      Model: {
        Title: "Modello",
        SubTitle: "Seleziona un modello",
      },
      ApiKey: {
        Title: "Chiave API",
        SubTitle: "Chiave API",
        Placeholder: "Chiave API",
      },
      Azure: {
        Endpoint: {
          Title: "Endpoint",
          SubTitle: "Endpoint",
        },
        Deployment: {
          Title: "Nome Distribuzione",
          SubTitle: "Nome Distribuzione",
        },
      },
      Temperature: {
        Title: "Casualità (temperature)",
        SubTitle: "Valori più alti producono risposte più casuali",
      },
    },
  },
  Store: {
    DefaultTopic: "Nuova chat",
    BotHello: "Come posso aiutarti?",
    Error: "Si è verificato un errore, riprova più tardi",
    Prompt: {
      History: (content: string) =>
        "Questo è un riassunto della chat storica come contesto: " + content,
      Topic:
        "Riporta il tema di questa frase in modo conciso con quattro o cinque parole, senza spiegazioni, punteggiatura, interiezioni, testo superfluo e senza grassetto. Se non c'è un tema, rispondi direttamente con 'chit-chat'",
      Summarize:
        "Riassumi brevemente il contenuto della conversazione come prompt di contesto per il seguito, mantenendolo entro 200 parole",
    },
  },
  Copy: {
    Success: "Copiato negli appunti",
    Failed: "Copia fallita, concedi i permessi per gli appunti",
  },
  Download: {
    Success: "Contenuto scaricato nella tua directory.",
    Failed: "Download fallito.",
  },
  Context: {
    Toast: (x: any) => `Include ${x} suggerimenti predefiniti`,
    Edit: "Impostazioni della conversazione attuale",
    Add: "Aggiungi una conversazione",
    Clear: "Contesto cancellato",
    Revert: "Ripristina contesto",
  },

  ChatSettings: {
    Name: "Impostazioni Chat",
  },
  Mcp: {
    Name: "MCP",
  },
  FineTuned: {
    Sysmessage: "Sei un assistente",
  },
  SearchChat: {
    Name: "Cerca",
    Page: {
      Title: "Cerca nei messaggi",
      Search: "Inserisci parole chiave per la ricerca",
      NoResult: "Nessun risultato trovato",
      NoData: "Nessun dato",
      Loading: "Caricamento in corso",

      SubTitle: (count: number) => `Trovati ${count} risultati`,
    },
    Item: {
      View: "Visualizza",
    },
  },
  Mask: {
    Name: "Assistente",
    DefaultName: "Assistente Predefinito",
    Management: "Gestione Assistenti",
    NewMask: "Nuovo Assistente",
    DefaultModel: "Modello Predefinito",
    DefaultModelDesc: "Modello predefinito per nuove conversazioni",
    UseGlobalModel: "Usa Modello Globale Predefinito",
    ConversationCount: (count: number) =>
      `${count} conversazion${count !== 1 ? "i" : "e"}`,
    Page: {
      Title: "Assistenti di Ruolo Predefiniti",
      SubTitle: (count: number) => `${count} definizioni di ruoli predefinite`,
      Search: "Cerca Assistenti di Ruolo",
      Create: "Crea",
    },
    Item: {
      Info: (count: number) => `${count} prompt predefiniti inclusi`,
      Chat: "Conversazione",
      View: "Visualizza",
      Edit: "Modifica",
      Delete: "Elimina",
      DeleteConfirm: "Confermi eliminazione?",
    },
    EditModal: {
      Title: "Modifica Assistente Predefinito",
      Download: "Scarica Predefinito",
      Clone: "Clona Predefinito",
    },
    Config: {
      Avatar: "Avatar del Ruolo",
      Name: "Nome del Ruolo",
      Sync: {
        Title: "Usa Impostazioni Globali",
        SubTitle: "Usa impostazioni globali in questa chat",
        Confirm:
          "Confermi di sostituire le impostazioni personalizzate con le impostazioni globali?",
      },
      HideContext: {
        Title: "Nascondi Prompt di Contesto",
        SubTitle: "Non mostrare i prompt di contesto nella chat",
      },
      Artifacts: {
        Title: "Attiva Artefatti",
        SubTitle:
          "Quando attivato, consente di visualizzare pagine HTML direttamente",
      },
      CodeFold: {
        Title: "Attiva Piegatura Codice",
        SubTitle:
          "Quando attivato, i blocchi di codice lunghi possono essere piegati/espansi automaticamente",
      },
      Share: {
        Title: "Condividi Questo Assistente",
        SubTitle: "Genera un link per questo assistente",
        Action: "Copia Link",
      },
    },
  },
  NewChat: {
    Return: "Ritorna",
    Skip: "Inizia Subito",
    Title: "Scegli un Assistente",
    SubTitle: "Conversa con l'Anima dietro l'Assistente",
    More: "Trova Altro",
    Less: "Comprimi Codice",
    ShowCode: "Mostra Codice",
    Preview: "Anteprima",
    NotShow: "Non Mostrare Più",
    ConfirmNoShow:
      "Confermi di disabilitare? Puoi riabilitare nelle impostazioni in seguito.",
    Searching: "Ricerca in corso...",
    Search: "Cerca",
    NoSearch: "Nessun risultato di ricerca",
    SearchFormat: (SearchTime?: number) =>
      SearchTime !== undefined
        ? `(Ricerca richiesta ${Math.round(SearchTime / 1000)} secondi)`
        : "",
    Thinking: "Pensiero in corso...",
    Think: "Contenuto del Pensiero",
    NoThink: "Nessun contenuto del pensiero",
    ThinkFormat: (thinkingTime?: number) =>
      thinkingTime !== undefined
        ? `(Pensiero richiesto ${Math.round(thinkingTime / 1000)} secondi)`
        : "",
  },

  URLCommand: {
    Code: "Codice di accesso rilevato nel link, riempirlo automaticamente?",
    Settings:
      "Impostazioni predefinite rilevate nel link, riempirle automaticamente?",
  },

  UI: {
    Confirm: "Conferma",
    Cancel: "Annulla",
    Close: "Chiudi",
    Create: "Crea",
    Edit: "Modifica",
    Export: "Esporta",
    Import: "Importa",
    Sync: "Sincronizza",
    Config: "Configura",
  },
  Exporter: {
    Description: {
      Title:
        "Solo i messaggi dopo la cancellazione del contesto verranno visualizzati",
    },
    Model: "Modello",
    Messages: "Messaggi",
    Topic: "Tema",
    Time: "Tempo",
  },
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type LocaleType = typeof it;
export type PartialLocaleType = DeepPartial<typeof it>;

export default it;
