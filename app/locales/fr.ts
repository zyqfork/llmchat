import { getClientConfig } from "../config/client";
import { SubmitKey } from "../store/config";
import { SAAS_CHAT_UTM_URL } from "@/app/constant";

const isApp = !!getClientConfig()?.isApp;

const fr = {
  WIP: "Prochainement...",
  Error: {
    Unauthorized: isApp
      ? `😆 La conversation a rencontré quelques problèmes, pas de panique :
    \\ 1️⃣ Si vous souhaitez commencer sans configuration, [cliquez ici pour démarrer la conversation immédiatement 🚀](${SAAS_CHAT_UTM_URL})
    \\ 2️⃣ Si vous souhaitez utiliser vos propres ressources OpenAI, cliquez [ici](/#/settings) pour modifier les paramètres ⚙️`
      : `😆 La conversation a rencontré quelques problèmes, pas de panique :
    \ 1️⃣ Si vous souhaitez commencer sans configuration, [cliquez ici pour démarrer la conversation immédiatement 🚀](${SAAS_CHAT_UTM_URL})
    \ 2️⃣ Si vous utilisez une version déployée privée, cliquez [ici](/#/auth) pour entrer la clé d'accès 🔑
    \ 3️⃣ Si vous souhaitez utiliser vos propres ressources OpenAI, cliquez [ici](/#/settings) pour modifier les paramètres ⚙️
 `,
  },
  Auth: {
    Return: "Retour",
    Title: "Mot de passe requis",
    Tips: "L'administrateur a activé la vérification par mot de passe. Veuillez entrer le code d'accès ci-dessous",
    SubTips: "Ou entrez votre clé API OpenAI ou Google",
    Input: "Entrez le code d'accès ici",
    Confirm: "Confirmer",
    Later: "Plus tard",
    SaasTips: "",
    TopTips: "",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} conversations`,
  },
  Chat: {
    MultiModel: {
      Title: "Paramètres de Chat Multi-Modèles",
      Enabled: "Multi-Modèles (Activé)",
      Disabled: "Multi-Modèles (Désactivé)",
      Count: (count: number) => `${count} modèles`,
      Description:
        "🎯 Mode arène multi-modèles activé ! Cliquez sur le sélecteur de modèles pour sélectionner plusieurs modèles pour la conversation.",
      OpenSelector: "Ouvrir le Sélecteur de Modèles",
      AlreadySelected: (count: number) => `(${count} sélectionnés)`,
      Tips: "💡 Astuce : En mode multi-modèles, vous pouvez sélectionner plusieurs modèles simultanément, et chaque modèle répondra indépendamment à vos messages, vous permettant de comparer les réponses des différents modèles.",
      EnableToast:
        "🎯 Mode multi-modèles activé ! Cliquez sur le sélecteur de modèles pour sélectionner plusieurs modèles pour l'arène de conversation",
      DisableToast: "Mode multi-modèles désactivé",
      MinimumModelsError:
        "Veuillez sélectionner au moins 2 modèles pour activer la conversation multi-modèles",
      ModelsSelectedToast: (count: number) =>
        `${count} modèles sélectionnés pour la conversation`,
    },
    UI: {
      SidebarToggle: "Réduire/Étendre la Barre Latérale",
      SearchModels: "Rechercher des modèles...",
      SelectModel: "Sélectionner un Modèle",
      ContextTooltip: {
        Current: (current: number, max: number) =>
          `Contexte actuel : ${current} / ${max}`,
        CurrentTokens: (current: number, max: number) =>
          `Tokens actuels : ${current.toLocaleString()} / ${max.toLocaleString()}`,
        CurrentTokensUnknown: (current: number) =>
          `Tokens actuels : ${current.toLocaleString()} / Inconnu`,
        EstimatedTokens: (estimated: number) =>
          `Tokens estimés : ${estimated.toLocaleString()}`,
        ContextTokens: (tokens: string) => `Contexte : ${tokens} tokens`,
      },
    },
    SubTitle: (count: number) => `Total de ${count} conversations`,
    EditMessage: {
      Title: "Modifier l'historique des messages",
      Topic: {
        Title: "Sujet de la discussion",
        SubTitle: "Modifier le sujet de la discussion actuel",
      },
    },
    Actions: {
      ChatList: "Voir la liste des messages",
      CompressedHistory: "Voir l'historique des prompts compressés",
      Export: "Exporter l'historique de la discussion",
      Copy: "Copier",
      Stop: "Arrêter",
      Retry: "Réessayer",
      Pin: "Épingler",
      PinToastContent: "1 conversation épinglée aux prompts prédéfinis",
      PinToastAction: "Voir",
      Delete: "Supprimer",
      Edit: "Modifier",
      FullScreen: "Plein Écran",
      RefreshTitle: "Actualiser le titre",
      RefreshToast: "Demande d'actualisation du titre envoyée",
      Speech: "Lire",
      StopSpeech: "Arrêter",
      PreviousVersion: "Version Précédente",
      NextVersion: "Version Suivante",
      Debug: "Déboguer",
      CopyAsCurl: "Copier comme cURL",
    },
    Commands: {
      new: "Nouvelle discussion",
      newm: "Nouvelle discussion depuis l'assistant",
      next: "Discussion suivante",
      prev: "Discussion précédente",
      clear: "Effacer le contexte",
      fork: "Copier la discussion",
      del: "Supprimer la discussion",
    },
    InputActions: {
      Stop: "Arrêter la réponse",
      ToBottom: "Aller au plus récent",
      Theme: {
        auto: "Thème automatique",
        light: "Mode clair",
        dark: "Mode sombre",
      },
      Prompt: "Commandes rapides",
      Masks: "Tous les assistants",
      Clear: "Effacer la discussion",
      Reset: "Réinitialiser la discussion",
      ResetConfirm:
        "Êtes-vous sûr de vouloir réinitialiser tout le contenu de la fenêtre de discussion actuelle ?",
      Settings: "Paramètres de la discussion",
      UploadImage: "Télécharger une image",
      Search: "Rechercher",
      SearchOn: "Recherche Activée",
      SearchOff: "Recherche Désactivée",
      SearchEnabledToast:
        "🔍 Fonction de recherche activée ! Vous pouvez maintenant effectuer des recherches sur le web",
      SearchDisabledToast: "❌ Fonction de recherche désactivée",
    },
    MCP: {
      Title: "Contrôle des Outils MCP",
      Enable: "Activer les Fonctions MCP",
      EnableDesc:
        "Lorsqu'il est activé, les outils MCP peuvent être utilisés. Lorsqu'il est désactivé, aucun prompt lié à MCP ne sera envoyé",
      NoTools: "Aucun outil MCP disponible",
      Loading: "Chargement...",
      ClientFailed: "Échec du chargement du client MCP, traitement silencieux",
      ToolsCount: (count: number) => `${count} outils`,
    },
    Rename: "Renommer la discussion",
    Typing: "En train d'écrire…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} pour envoyer`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "，Shift + Enter pour passer à la ligne";
      }
      return inputHints + "，/ pour compléter, : pour déclencher des commandes";
    },
    Send: "Envoyer",
    TokenUsage: "Utilisation",
    TokenTooltip: {
      Context: "Contexte Actuel",
      CurrentToken: "Token Actuel",
      EstimatedToken: "Token Estimé",
      Unknown: "Inconnu",
    },
    StartSpeak: "Commencer à Parler",
    StopSpeak: "Arrêter de Parler",
    Config: {
      Reset: "Réinitialiser aux Valeurs Par Défaut",
      SaveAs: "Enregistrer comme Assistant",
    },
    IsContext: "Prompt Contextuel",
    ShortcutKey: {
      Title: "Raccourcis Clavier",
      newChat: "Ouvrir une Nouvelle Discussion",
      focusInput: "Focus sur le Champ de Saisie",
      copyLastMessage: "Copier la Dernière Réponse",
      copyLastCode: "Copier le Dernier Bloc de Code",
      showShortcutKey: "Afficher les Raccourcis",
      clearContext: "Effacer le Contexte",
    },
    Thinking: {
      Title: "Profondeur de Réflexion",
      Dynamic: "Réflexion Dynamique",
      DynamicDesc:
        "Le modèle décide automatiquement de la profondeur de réflexion",
      Off: "Réflexion Désactivée",
      OffDesc: "Aucun processus de réflexion",
      Light: "Réflexion Légère",
      LightDesc: "1024 tokens",
      Medium: "Réflexion Moyenne",
      MediumDesc: "4096 tokens",
      Deep: "Réflexion Profonde",
      DeepDesc: "8192 tokens",
      VeryDeep: "Réflexion Très Profonde",
      VeryDeepDesc: "16384 tokens",
      Notice:
        "Seuls les modèles prenant en charge thinkingBudget peuvent ajuster la profondeur de réflexion",
      ClaudeNotice:
        "Seuls les modèles de la série Claude peuvent ajuster la profondeur de réflexion",
      GeminiNotice:
        "Seuls les modèles de la série Gemini peuvent ajuster la profondeur de réflexion",
      ClaudeLight: "Réfléchir",
      ClaudeLightDesc: "5000 tokens",
      ClaudeMedium: "Réfléchir Dur",
      ClaudeMediumDesc: "10000 tokens",
      ClaudeDeep: "Réfléchir Plus Dur",
      ClaudeDeepDesc: "20000 tokens",
      ClaudeVeryDeep: "Ultra-réflexion",
      ClaudeVeryDeepDesc: "32000 tokens",
      ClaudeDynamicDesc:
        "Ajuster automatiquement la profondeur de réflexion (par défaut 10000 tokens)",
    },
  },
  Export: {
    Title: "Partager l'historique des discussions",
    Copy: "Tout copier",
    Download: "Télécharger le fichier",
    Share: "Partager l'historique des discussions",
    MessageFromYou: "Utilisateur",
    MessageFromChatGPT: "ChatGPT",
    Format: {
      Title: "Format d'exportation",
      SubTitle: "Vous pouvez exporter en texte Markdown ou en image PNG",
    },
    IncludeContext: {
      Title: "Inclure le contexte de l'assistant",
      SubTitle: "Afficher le contexte de l'assistant dans les messages ou non",
    },
    Steps: {
      Select: "Sélectionner",
      Preview: "Aperçu",
    },
    Image: {
      Toast: "Génération de la capture d'écran",
      Modal:
        "Appuyez longuement ou faites un clic droit pour enregistrer l'image",
    },
    Artifacts: {
      Title: "Imprimer la page",
      Error: "Erreur d'impression",
    },
  },
  Select: {
    Search: "Rechercher des messages",
    All: "Tout sélectionner",
    Latest: "Derniers messages",
    Clear: "Effacer la sélection",
  },
  Memory: {
    Title: "Résumé historique",
    EmptyContent: "Le contenu de la discussion est trop court pour être résumé",
    Send: "Compresser automatiquement l'historique des discussions et l'envoyer comme contexte",
    Copy: "Copier le résumé",
    Reset: "[non utilisé]",
    ResetConfirm: "Confirmer la suppression du résumé historique ?",
  },
  Home: {
    NewChat: "Nouvelle discussion",
    DeleteChat: "Confirmer la suppression de la discussion sélectionnée ?",
    DeleteToast: "Discussion supprimée",
    Revert: "Annuler",
  },
  Settings: {
    Title: "Paramètres",
    SubTitle: "Toutes les options de configuration",
    ShowPassword: "Afficher le Mot de Passe",

    Tab: {
      General: "Configuration Générale",
      Sync: "Synchronisation Cloud",
      Mask: "Assistant",
      Prompt: "Prompts",
      ModelService: "Service de Modèle",
      ModelConfig: "Configuration du Modèle",
      Voice: "Voix",
    },

    Danger: {
      Reset: {
        Title: "Réinitialiser tous les paramètres",
        SubTitle:
          "Réinitialiser toutes les options de configuration aux valeurs par défaut",
        Action: "Réinitialiser maintenant",
        Confirm: "Confirmer la réinitialisation de tous les paramètres ?",
      },
      Clear: {
        Title: "Effacer toutes les données",
        SubTitle:
          "Effacer toutes les discussions et les données de configuration",
        Action: "Effacer maintenant",
        Confirm:
          "Confirmer l'effacement de toutes les discussions et données de configuration ?",
      },
    },
    Lang: {
      Name: "Language", // ATTENTION: if you wanna add a new translation, please do not translate this value, leave it as `Language`
      All: "Toutes les langues",
    },
    Avatar: "Avatar",
    FontSize: {
      Title: "Taille de la police",
      SubTitle: "Taille de la police pour le contenu des discussions",
    },
    FontFamily: {
      Title: "Police de Chat",
      SubTitle:
        "Police du contenu du chat, laissez vide pour appliquer la police par défaut globale",
      Placeholder: "Nom de la Police",
    },
    InjectSystemPrompts: {
      Title: "Injecter des invites système",
      SubTitle:
        "Ajouter de manière forcée une invite système simulée de ChatGPT au début de chaque liste de messages",
    },
    InputTemplate: {
      Title: "Prétraitement des entrées utilisateur",
      SubTitle:
        "Le dernier message de l'utilisateur sera intégré dans ce modèle",
    },

    Update: {
      Version: (x: string) => `Version actuelle : ${x}`,
      IsLatest: "Vous avez la dernière version",
      CheckUpdate: "Vérifier les mises à jour",
      IsChecking: "Vérification des mises à jour en cours...",
      FoundUpdate: (x: string) => `Nouvelle version trouvée : ${x}`,
      GoToUpdate: "Aller à la mise à jour",
      Success: "Mise à jour réussie !",
      Failed: "Échec de la mise à jour",
    },
    SendKey: "Touche d'envoi",
    Theme: "Thème",
    ColorScheme: {
      Title: "Schéma de Couleurs",
      Options: {
        default: "Bleu par Défaut",
        ocean: "Bleu Océan",
        forest: "Vert Forêt",
        sunset: "Orange Coucher de Soleil",
        purple: "Violet Rêve",
        rose: "Rose",
      },
    },
    TightBorder: "Mode sans bordure",
    SendPreviewBubble: {
      Title: "Bulle d'aperçu",
      SubTitle: "Aperçu du contenu Markdown dans la bulle d'aperçu",
    },
    AutoGenerateTitle: {
      Title: "Génération automatique de titres",
      SubTitle:
        "Générer un titre approprié en fonction du contenu de la discussion",
    },
    Sync: {
      CloudState: "Données cloud",
      NotSyncYet: "Pas encore synchronisé",
      Success: "Synchronisation réussie",
      Fail: "Échec de la synchronisation",

      Config: {
        Modal: {
          Title: "Configurer la synchronisation cloud",
          Check: "Vérifier la disponibilité",
        },
        SyncType: {
          Title: "Type de synchronisation",
          SubTitle: "Choisissez le serveur de synchronisation préféré",
        },
        Proxy: {
          Title: "Activer le proxy",
          SubTitle:
            "Lors de la synchronisation dans le navigateur, le proxy doit être activé pour éviter les restrictions de domaine croisé",
        },
        ProxyUrl: {
          Title: "Adresse du proxy",
          SubTitle:
            "Uniquement pour le proxy de domaine croisé fourni par le projet",
        },

        WebDav: {
          Endpoint: "Adresse WebDAV",
          UserName: "Nom d'utilisateur",
          Password: "Mot de passe",
        },

        UpStash: {
          Endpoint: "URL REST Redis UpStash",
          UserName: "Nom de sauvegarde",
          Password: "Token REST Redis UpStash",
        },
      },

      LocalState: "Données locales",
      Overview: (overview: any) => {
        return `${overview.chat} discussions, ${overview.message} messages, ${overview.prompt} invites, ${overview.mask} masques`;
      },
      ImportFailed: "Échec de l'importation",
    },
    Mask: {
      ModelIcon: {
        Title: "Utiliser l'Icône du Modèle comme Avatar IA",
        SubTitle:
          "Lorsqu'il est activé, l'avatar IA dans les conversations utilisera l'icône du modèle actuel au lieu des emojis",
      },
    },
    AccessCode: {
      Title: "Code d'Accès",
      SubTitle:
        "Le contrôle d'accès est activé, veuillez entrer le code d'accès",
      Placeholder: "Entrez le code d'accès",
      Status: {
        Enabled: "Contrôle d'accès activé",
        Valid: "Code d'accès valide",
        Invalid: "Code d'accès invalide",
      },
    },
    Prompt: {
      Disable: {
        Title: "Désactiver la complétion automatique des invites",
        SubTitle:
          "Saisir / au début de la zone de texte pour déclencher la complétion automatique",
      },
      List: "Liste des invites personnalisées",
      ListCount: (builtin: number, custom: number) =>
        `${builtin} intégrées, ${custom} définies par l'utilisateur`,
      Edit: "Modifier",
      Modal: {
        Title: "Liste des invites",
        Add: "Créer",
        Search: "Rechercher des invites",
      },
      EditModal: {
        Title: "Modifier les invites",
      },
    },
    HistoryCount: {
      Title: "Nombre de messages historiques",
      SubTitle: "Nombre de messages historiques envoyés avec chaque demande",
    },
    CompressThreshold: {
      Title: "Seuil de compression des messages historiques",
      SubTitle:
        "Compresser les messages historiques lorsque leur longueur dépasse cette valeur",
    },

    Access: {
      SaasStart: {
        Title: "",
        Label: "",
        SubTitle: "",
        ChatNow: "",
      },
      AccessCode: {
        Title: "Mot de passe d'accès",
        SubTitle: "L'administrateur a activé l'accès sécurisé",
        Placeholder: "Veuillez entrer le mot de passe d'accès",
      },
      CustomEndpoint: {
        Title: "Interface personnalisée",
        SubTitle: "Utiliser un service Azure ou OpenAI personnalisé",
      },
      Provider: {
        Title: "Fournisseur de modèle",
        SubTitle: "Changer de fournisseur de service",
        Name: {
          ByteDance: "ByteDance",
          Alibaba: "Alibaba Cloud",
          Moonshot: "Moonshot",
        },
        Status: {
          Enabled: "Activé",
        },
        Models: {
          Title: "Modèles activés",
          SubTitle: "Liste des modèles activés dans le fournisseur actuel",
          NoModels: "Aucun modèle activé",
          Manage: "Gérer",
        },
        Description: {
          OpenAI: "Modèles de la série OpenAI GPT",
          Azure: "Service OpenAI Microsoft Azure",
          Google: "Modèles de la série Google Gemini",
          Anthropic: "Modèles de la série Anthropic Claude",
          ByteDance: "Modèles de la série ByteDance Doubao",
          Alibaba: "Modèles de la série Alibaba Cloud Qwen",
          Moonshot: "Modèles de la série Moonshot Kimi",
          DeepSeek: "Modèles de la série DeepSeek",
          XAI: "Modèles de la série xAI Grok",
          SiliconFlow: "SiliconFlow",
          Custom: "Personnalisé",
        },
        Terms: {
          Provider: "Fournisseur",
        },
      },
      OpenAI: {
        ApiKey: {
          Title: "Clé API OpenAI",
          SubTitle: "Utiliser une clé OpenAI personnalisée",
          Placeholder: "sk-xxx",
        },

        Endpoint: {
          Title: "Endpoint OpenAI",
          SubTitle:
            "Doit commencer par http(s):// ou utiliser /api/openai par défaut",
        },
      },
      Azure: {
        ApiKey: {
          Title: "Clé API Azure",
          SubTitle: "Vérifiez votre clé API depuis la console Azure",
          Placeholder: "Clé API Azure",
        },

        Endpoint: {
          Title: "Endpoint Azure",
          SubTitle: "Exemple : ",
        },

        ApiVerion: {
          Title: "Version API Azure",
          SubTitle: "Vérifiez votre version API depuis la console Azure",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "Clé API Anthropic",
          SubTitle:
            "Utiliser une clé Anthropic personnalisée pour contourner les restrictions d'accès par mot de passe",
          Placeholder: "Clé API Anthropic",
        },

        Endpoint: {
          Title: "Adresse de l'endpoint",
          SubTitle: "Exemple : ",
        },

        ApiVerion: {
          Title: "Version API (version API claude)",
          SubTitle: "Sélectionnez et entrez une version spécifique de l'API",
        },
      },
      Google: {
        ApiKey: {
          Title: "Clé API",
          SubTitle: "Obtenez votre clé API Google AI",
          Placeholder: "Entrez votre clé API Google AI Studio",
        },

        Endpoint: {
          Title: "Adresse de l'endpoint",
          SubTitle: "Exemple : ",
        },

        ApiVersion: {
          Title: "Version API (spécifique à gemini-pro)",
          SubTitle: "Choisissez une version spécifique de l'API",
        },
        GoogleSafetySettings: {
          Title: "Paramètres de sécurité Google",
          SubTitle: "Définir le niveau de filtrage de contenu",
        },
      },
      Baidu: {
        ApiKey: {
          Title: "Clé API",
          SubTitle: "Utiliser une clé API Baidu personnalisée",
          Placeholder: "Clé API Baidu",
        },
        SecretKey: {
          Title: "Clé secrète",
          SubTitle: "Utiliser une clé secrète Baidu personnalisée",
          Placeholder: "Clé secrète Baidu",
        },
        Endpoint: {
          Title: "Adresse de l'endpoint",
          SubTitle:
            "Non pris en charge pour les configurations personnalisées dans .env",
        },
      },
      Tencent: {
        ApiKey: {
          Title: "Clé API",
          SubTitle: "Utiliser une clé API Tencent personnalisée",
          Placeholder: "Clé API Tencent",
        },
        SecretKey: {
          Title: "Clé secrète",
          SubTitle: "Utiliser une clé secrète Tencent personnalisée",
          Placeholder: "Clé secrète Tencent",
        },
        Endpoint: {
          Title: "Adresse de l'endpoint",
          SubTitle:
            "Non pris en charge pour les configurations personnalisées dans .env",
        },
      },
      ByteDance: {
        ApiKey: {
          Title: "Clé d'interface",
          SubTitle: "Utiliser une clé API ByteDance personnalisée",
          Placeholder: "Clé API ByteDance",
        },
        Endpoint: {
          Title: "Adresse de l'endpoint",
          SubTitle: "Exemple : ",
        },
      },
      Alibaba: {
        ApiKey: {
          Title: "Clé d'interface",
          SubTitle: "Utiliser une clé API Alibaba Cloud personnalisée",
          Placeholder: "Clé API Alibaba Cloud",
        },
        Endpoint: {
          Title: "Adresse de l'endpoint",
          SubTitle: "Exemple : ",
        },
      },
      Moonshot: {
        ApiKey: {
          Title: "Clé d'interface",
          SubTitle: "Utiliser une clé API Moonshot personnalisée",
          Placeholder: "Clé API Moonshot",
        },
        Endpoint: {
          Title: "Adresse de l'endpoint",
          SubTitle: "Exemple : ",
        },
      },
      DeepSeek: {
        ApiKey: {
          Title: "Clé d'interface",
          SubTitle: "Utiliser une clé API DeepSeek personnalisée",
          Placeholder: "Clé API DeepSeek",
        },
        Endpoint: {
          Title: "Adresse de l'endpoint",
          SubTitle: "Exemple : ",
        },
      },
      XAI: {
        ApiKey: {
          Title: "Clé d'interface",
          SubTitle: "Utiliser une clé API XAI personnalisée",
          Placeholder: "Clé API XAI",
        },
        Endpoint: {
          Title: "Adresse de l'endpoint",
          SubTitle: "Exemple : ",
        },
      },
      SiliconFlow: {
        ApiKey: {
          Title: "Clé d'interface",
          SubTitle: "Utiliser une clé API SiliconFlow personnalisée",
          Placeholder: "Clé API SiliconFlow",
        },
        Endpoint: {
          Title: "Adresse de l'endpoint",
          SubTitle: "Exemple : ",
        },
      },
      ChatGLM: {
        ApiKey: {
          Title: "Clé API",
          SubTitle: "Utiliser une clé API ChatGLM personnalisée",
          Placeholder: "Clé API ChatGLM",
        },
        Endpoint: {
          Title: "Adresse de l'endpoint",
          SubTitle: "Exemple : ",
        },
      },
      Iflytek: {
        ApiKey: {
          Title: "ApiKey",
          SubTitle: "Obtenez ApiKey depuis la console iFlytek Spark",
          Placeholder: "ApiKey",
        },
        ApiSecret: {
          Title: "ApiSecret",
          SubTitle: "Obtenez ApiSecret depuis la console iFlytek Spark",
          Placeholder: "ApiSecret",
        },
        Endpoint: {
          Title: "Adresse de l'endpoint",
          SubTitle: "Exemple : ",
        },
      },
      AI302: {
        ApiKey: {
          Title: "Clé d'interface",
          SubTitle: "Utiliser une clé API 302.AI personnalisée",
          Placeholder: "Clé API 302.AI",
        },
        Endpoint: {
          Title: "Adresse de l'endpoint",
          SubTitle: "Exemple : ",
        },
      },
      CustomProvider: {
        Add: {
          Title: "Ajouter un Fournisseur Personnalisé",
          Button: "Ajouter un Fournisseur Personnalisé",
          Description:
            "Ajouter un canal personnalisé basé sur des types de fournisseurs existants",
        },
        Modal: {
          Title: "Ajouter un Fournisseur Personnalisé",
          Name: {
            Title: "Nom du Fournisseur",
            Placeholder: "Entrez le nom du fournisseur personnalisé",
            Required: "Veuillez entrer le nom du fournisseur",
            Unique:
              "Le nom du fournisseur existe déjà, veuillez utiliser un autre nom",
          },
          Type: {
            Title: "Type de Fournisseur",
            OpenAI: "OpenAI - Services compatibles avec l'API OpenAI",
            Google: "Google - API Google Gemini",
            Anthropic: "Anthropic - API Anthropic Claude",
          },
          ApiKey: {
            Title: "Clé API",
            Placeholder: "Entrez la clé API",
            Required: "Veuillez entrer la clé API",
          },
          Endpoint: {
            Title: "Endpoint Personnalisé",
            Placeholder: "Laisser vide pour utiliser l'endpoint par défaut",
            Optional: "(Optionnel)",
          },
          Cancel: "Annuler",
          Confirm: "Ajouter",
        },
        Config: {
          Type: "Type de Fournisseur",
          BasedOn: "Basé sur",
          ApiKeyDescription: "Clé API du fournisseur personnalisé",
          EndpointDescription: "Adresse de l'endpoint API personnalisé",
          EndpointPlaceholder: "Adresse de l'endpoint API",
          Delete: {
            Title: "Supprimer le Fournisseur",
            SubTitle:
              "Supprimer ce fournisseur personnalisé et toutes ses configurations",
            Button: "Supprimer",
            Confirm:
              "Êtes-vous sûr de vouloir supprimer le fournisseur personnalisé",
            ConfirmSuffix: " ?",
          },
        },
      },
    },

    Model: "Modèle (model)",
    CompressModel: {
      Title: "Modèle de compression",
      SubTitle: "Modèle utilisé pour compresser l'historique",
    },
    Temperature: {
      Title: "Aléatoire (temperature)",
      SubTitle: "Plus la valeur est élevée, plus les réponses sont aléatoires",
    },
    TopP: {
      Title: "Échantillonnage par noyau (top_p)",
      SubTitle:
        "Semblable à l'aléatoire, mais ne pas modifier en même temps que l'aléatoire",
    },
    MaxTokens: {
      Title: "Limite de réponse unique (max_tokens)",
      SubTitle: "Nombre maximal de tokens utilisés pour une interaction unique",
    },
    PresencePenalty: {
      Title: "Nouveauté du sujet (presence_penalty)",
      SubTitle:
        "Plus la valeur est élevée, plus il est probable d'élargir aux nouveaux sujets",
    },
    FrequencyPenalty: {
      Title: "Pénalité de fréquence (frequency_penalty)",
      SubTitle:
        "Plus la valeur est élevée, plus il est probable de réduire les répétitions",
    },
    TTS: {
      Enable: {
        Title: "Activer TTS",
        SubTitle: "Activer le service de synthèse vocale",
      },
      Autoplay: {
        Title: "Activer la lecture automatique",
        SubTitle:
          "Générer automatiquement la voix et lire, vous devez d'abord activer l'interrupteur de synthèse vocale",
      },
      Model: "Modèle",
      Engine: "Moteur de conversion",
      EngineConfig: {
        Title: "Note de configuration",
        SubTitle:
          "OpenAI-TTS utilisera la configuration du fournisseur OpenAI dans Services de Modèle. Veuillez ajouter la clé API correspondante dans le fournisseur OpenAI avant l'utilisation",
      },
      Voice: {
        Title: "Voix",
        SubTitle: "La voix à utiliser lors de la génération de l'audio",
      },
      Speed: {
        Title: "Vitesse",
        SubTitle: "La vitesse de l'audio généré",
      },
    },
    Realtime: {
      Enable: {
        Title: "Chat en temps réel",
        SubTitle: "Activer la fonction de chat en temps réel",
      },
      Provider: {
        Title: "Fournisseur de modèles",
        SubTitle: "Changer entre différents fournisseurs",
      },
      Model: {
        Title: "Modèle",
        SubTitle: "Sélectionner un modèle",
      },
      ApiKey: {
        Title: "Clé API",
        SubTitle: "Clé API",
        Placeholder: "Clé API",
      },
      Azure: {
        Endpoint: {
          Title: "Endpoint",
          SubTitle: "Endpoint",
        },
        Deployment: {
          Title: "Nom du déploiement",
          SubTitle: "Nom du déploiement",
        },
      },
      Temperature: {
        Title: "Aléatoire (temperature)",
        SubTitle:
          "Des valeurs plus élevées entraînent des réponses plus aléatoires",
      },
    },
  },
  Store: {
    DefaultTopic: "Nouvelle discussion",
    BotHello: "Comment puis-je vous aider ?",
    Error: "Une erreur est survenue, veuillez réessayer plus tard",
    Prompt: {
      History: (content: string) =>
        "Voici le résumé de la discussion précédente : " + content,
      Topic:
        "Utilisez quatre à cinq mots pour retourner le sujet succinct de cette phrase, sans explication, sans ponctuation, sans interjections, sans texte superflu, sans gras. Si aucun sujet, retournez simplement « discussion informelle »",
      Summarize:
        "Faites un résumé succinct de la discussion, à utiliser comme prompt de contexte ultérieur, en moins de 200 mots",
    },
  },
  Copy: {
    Success: "Copié dans le presse-papiers",
    Failed: "Échec de la copie, veuillez autoriser l'accès au presse-papiers",
  },
  Download: {
    Success: "Le contenu a été téléchargé dans votre répertoire.",
    Failed: "Échec du téléchargement.",
  },
  Context: {
    Toast: (x: any) => `Contient ${x} invites prédéfinies`,
    Edit: "Paramètres de la discussion actuelle",
    Add: "Ajouter une discussion",
    Clear: "Contexte effacé",
    Revert: "Restaurer le contexte",
  },

  ChatSettings: {
    Name: "Paramètres de Conversation",
  },
  Mcp: {
    Name: "MCP",
  },
  FineTuned: {
    Sysmessage: "Vous êtes un assistant",
  },
  SearchChat: {
    Name: "Recherche",
    Page: {
      Title: "Rechercher dans l'historique des discussions",
      Search: "Entrez le mot-clé de recherche",
      NoResult: "Aucun résultat trouvé",
      NoData: "Aucune donnée",
      Loading: "Chargement",

      SubTitle: (count: number) => `${count} résultats trouvés`,
    },
    Item: {
      View: "Voir",
    },
  },
  Mask: {
    Name: "Assistant",
    DefaultName: "Assistant Par Défaut",
    Management: "Gestion des Assistants",
    NewMask: "Nouvel Assistant",
    DefaultModel: "Modèle Par Défaut",
    DefaultModelDesc: "Modèle par défaut pour les nouvelles conversations",
    UseGlobalModel: "Utiliser le Modèle Global Par Défaut",
    ConversationCount: (count: number) =>
      `${count} conversation${count > 1 ? "s" : ""}`,
    Page: {
      Title: "Assistants de Rôle Prédéfinis",
      SubTitle: (count: number) => `${count} définitions de rôle prédéfinies`,
      Search: "Rechercher des assistants de rôle",
      Create: "Créer",
    },
    Item: {
      Info: (count: number) => `Contient ${count} prompts`,
      Chat: "Discussion",
      View: "Voir",
      Edit: "Modifier",
      Delete: "Supprimer",
      DeleteConfirm: "Confirmer la suppression ?",
    },
    EditModal: {
      Title: "Modifier l'Assistant",
      Download: "Télécharger le prédéfini",
      Clone: "Cloner le prédéfini",
    },
    Config: {
      Avatar: "Avatar du rôle",
      Name: "Nom du rôle",
      Sync: {
        Title: "Utiliser les paramètres globaux",
        SubTitle:
          "Cette discussion utilise-t-elle les paramètres du modèle globaux ?",
        Confirm:
          "Les paramètres personnalisés de cette discussion seront automatiquement remplacés. Confirmer l'activation des paramètres globaux ?",
      },
      HideContext: {
        Title: "Masquer les discussions prédéfinies",
        SubTitle:
          "Les discussions prédéfinies ne seront pas affichées dans l'interface de discussion après masquage",
      },
      Artifacts: {
        Title: "Activer les Artefacts",
        SubTitle:
          "Lorsqu'il est activé, les pages HTML peuvent être rendues directement",
      },
      CodeFold: {
        Title: "Activer le Pliage de Code",
        SubTitle:
          "Lorsqu'il est activé, les blocs de code longs peuvent être pliés/dépliés automatiquement",
      },
      Share: {
        Title: "Partager cet assistant",
        SubTitle: "Générer un lien direct pour cet assistant",
        Action: "Copier le lien",
      },
    },
  },
  NewChat: {
    Return: "Retour",
    Skip: "Commencer directement",
    Title: "Choisir un assistant",
    SubTitle:
      "Commencez maintenant, rencontrez les pensées derrière l'assistant",
    More: "Voir tout",
    Less: "Réduire le code",
    ShowCode: "Afficher le code",
    Preview: "Aperçu",
    NotShow: "Ne plus afficher",
    ConfirmNoShow:
      "Confirmer la désactivation ? Vous pourrez réactiver cette option à tout moment dans les paramètres.",
    Searching: "Recherche en cours...",
    Search: "Rechercher",
    NoSearch: "Aucun résultat de recherche",
    SearchFormat: (SearchTime?: number) =>
      SearchTime !== undefined
        ? `(Recherche a pris ${Math.round(SearchTime / 1000)} s)`
        : "",
    Thinking: "Réflexion en cours...",
    Think: "Contenu de la réflexion",
    NoThink: "Aucun contenu de réflexion",
    ThinkFormat: (thinkingTime?: number) =>
      thinkingTime !== undefined
        ? `(Réflexion a pris ${Math.round(thinkingTime / 1000)} s)`
        : "",
  },

  URLCommand: {
    Code: "Code d'accès détecté depuis l'URL, confirmer l'application ?",
    Settings:
      "Configuration prédéfinie détectée depuis l'URL, confirmer l'application ?",
  },

  UI: {
    Confirm: "Confirmer",
    Cancel: "Annuler",
    Close: "Fermer",
    Create: "Créer",
    Edit: "Modifier",
    Export: "Exporter",
    Import: "Importer",
    Sync: "Synchroniser",
    Config: "Configurer",
  },
  Exporter: {
    Description: {
      Title:
        "Seuls les messages après avoir effacé le contexte seront affichés",
    },
    Model: "Modèle",
    Messages: "Messages",
    Topic: "Sujet",
    Time: "Temps",
  },
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type LocaleType = typeof fr;
export type PartialLocaleType = DeepPartial<typeof fr>;

export default fr;
