import { getClientConfig } from "../config/client";
import { SubmitKey } from "../store/config";
import { SAAS_CHAT_UTM_URL } from "@/app/constant";

const isApp = !!getClientConfig()?.isApp;

const pt = {
  WIP: "Em breve...",
  Error: {
    Unauthorized: isApp
      ? `😆 A conversa encontrou alguns problemas, não se preocupe:
   \\ 1️⃣ Se você quiser começar sem configuração, [clique aqui para começar a conversar imediatamente 🚀](${SAAS_CHAT_UTM_URL})
   \\ 2️⃣ Se você deseja usar seus próprios recursos OpenAI, clique [aqui](/#/settings) para modificar as configurações ⚙️`
      : `😆 A conversa encontrou alguns problemas, não se preocupe:
   \ 1️⃣ Se você quiser começar sem configuração, [clique aqui para começar a conversar imediatamente 🚀](${SAAS_CHAT_UTM_URL})
   \ 2️⃣ Se você estiver usando uma versão de implantação privada, clique [aqui](/#/auth) para inserir a chave de acesso 🔑
   \ 3️⃣ Se você deseja usar seus próprios recursos OpenAI, clique [aqui](/#/settings) para modificar as configurações ⚙️
`,
  },
  Auth: {
    Return: "Voltar",
    Title: "Necessário Código de Acesso",
    Tips: "Por favor, insira o código de acesso abaixo",
    SubTips: "Ou insira sua Chave API OpenAI ou Google",
    Input: "código de acesso",
    Confirm: "Confirmar",
    Later: "Depois",
    SaasTips: "",
    TopTips: "",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} mensagens`,
  },
  Chat: {
    MultiModel: {
      Title: "Configurações de Chat Multi-Modelo",
      Enabled: "Multi-Modelo (Ativado)",
      Disabled: "Multi-Modelo (Desativado)",
      Count: (count: number) => `${count} modelos`,
      Description:
        "🎯 Modo Arena Multi-Modelo ativado! Clique no seletor de modelos para escolher vários modelos para a conversa.",
      OpenSelector: "Abrir Seletor de Modelos",
      AlreadySelected: (count: number) => `(${count} selecionados)`,
      Tips: "💡 Dica: No modo multi-modelo, você pode selecionar vários modelos simultaneamente, e cada modelo responderá independentemente às suas mensagens, permitindo que você compare as respostas de diferentes modelos.",
      EnableToast:
        "🎯 Modo Multi-Modelo ativado! Clique no seletor de modelos para escolher vários modelos para a arena de conversa",
      DisableToast: "Modo Multi-Modelo desativado",
      MinimumModelsError:
        "Por favor, selecione pelo menos 2 modelos para ativar conversas multi-modelo",
      ModelsSelectedToast: (count: number) =>
        `${count} modelos selecionados para a conversa`,
    },
    UI: {
      SidebarToggle: "Recolher/Expandir Barra Lateral",
      SearchModels: "Pesquisar modelos...",
      SelectModel: "Selecionar modelo",
      ContextTooltip: {
        Current: (current: number, max: number) =>
          `Contexto atual: ${current} / ${max}`,
        CurrentTokens: (current: number, max: number) =>
          `Tokens atuais: ${current.toLocaleString()} / ${max.toLocaleString()}`,
        CurrentTokensUnknown: (current: number) =>
          `Tokens atuais: ${current.toLocaleString()} / Desconhecido`,
        EstimatedTokens: (estimated: number) =>
          `Tokens estimados: ${estimated.toLocaleString()}`,
        ContextTokens: (tokens: string) => `Contexto: ${tokens} tokens`,
      },
    },
    SubTitle: (count: number) => `${count} mensagens`,
    EditMessage: {
      Title: "Editar Todas as Mensagens",
      Topic: {
        Title: "Tópico",
        SubTitle: "Mudar o tópico atual",
      },
    },
    Actions: {
      ChatList: "Ir Para Lista de Chat",
      CompressedHistory: "Prompt de Memória Histórica Comprimida",
      Export: "Exportar Todas as Mensagens como Markdown",
      Copy: "Copiar",
      Stop: "Parar",
      Retry: "Tentar Novamente",
      Pin: "Fixar",
      PinToastContent: "Fixada 1 mensagem para prompts contextuais",
      PinToastAction: "Visualizar",
      Delete: "Deletar",
      Edit: "Editar",
      FullScreen: "Tela Cheia",
      RefreshTitle: "Atualizar Título",
      RefreshToast: "Solicitação de atualização de título enviada",
      Speech: "Reproduzir",
      StopSpeech: "Parar",
      PreviousVersion: "Versão Anterior",
      NextVersion: "Próxima Versão",
      Debug: "Depurar",
      CopyAsCurl: "Copiar como cURL",
    },
    Commands: {
      new: "Iniciar um novo chat",
      newm: "Iniciar um novo chat com máscara",
      next: "Próximo Chat",
      prev: "Chat Anterior",
      clear: "Limpar Contexto",
      fork: "Copiar Conversa",
      del: "Deletar Chat",
    },
    InputActions: {
      Stop: "Parar Resposta",
      ToBottom: "Ir para o Mais Recente",
      Theme: {
        auto: "Automático",
        light: "Tema Claro",
        dark: "Tema Escuro",
      },
      Prompt: "Prompts",
      Masks: "Todas as Máscaras",
      Clear: "Limpar Chat",
      Reset: "Redefinir Conversa",
      ResetConfirm:
        "Tem certeza de que deseja redefinir todo o conteúdo da janela de chat atual?",
      Settings: "Configurações do Chat",
      UploadImage: "Upload de Imagem",
      Search: "Pesquisar",
      SearchOn: "Pesquisa Ativada",
      SearchOff: "Pesquisa Desativada",
      SearchEnabledToast:
        "🔍 Função de pesquisa ativada! Agora você pode pesquisar na web",
      SearchDisabledToast: "❌ Função de pesquisa desativada",
    },
    MCP: {
      Title: "Controle de Ferramentas MCP",
      Enable: "Ativar Funcionalidades MCP",
      EnableDesc:
        "Quando ativado, ferramentas MCP podem ser usadas. Quando desativado, prompts relacionados ao MCP não serão enviados",
      NoTools: "Nenhuma ferramenta MCP disponível",
      Loading: "Carregando...",
      ClientFailed: "Falha ao carregar cliente MCP, processamento silencioso",
      ToolsCount: (count: number) => `${count} ferramentas`,
    },
    Rename: "Renomear Chat",
    Typing: "Digitando…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} para enviar`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += ", Shift + Enter para quebrar linha";
      }
      return inputHints + ", / para buscar prompts, : para usar comandos";
    },
    Send: "Enviar",
    TokenUsage: "Uso",
    TokenTooltip: {
      Context: "Contexto atual",
      CurrentToken: "Tokens atuais",
      EstimatedToken: "Tokens estimados",
      Unknown: "Desconhecido",
    },
    StartSpeak: "Iniciar Fala",
    StopSpeak: "Parar Fala",
    Config: {
      Reset: "Redefinir para Padrão",
      SaveAs: "Salvar como Máscara",
    },
    IsContext: "Prompt Contextual",
    ShortcutKey: {
      Title: "Atalhos do Teclado",
      newChat: "Abrir novo chat",
      focusInput: "Focar campo de entrada",
      copyLastMessage: "Copiar última resposta",
      copyLastCode: "Copiar último bloco de código",
      showShortcutKey: "Mostrar atalhos",
      clearContext: "Limpar contexto",
    },
    Thinking: {
      Title: "Profundidade de Pensamento",
      Dynamic: "Pensamento Dinâmico",
      DynamicDesc:
        "O modelo decide automaticamente a profundidade do pensamento",
      Off: "Pensamento Desativado",
      OffDesc: "Sem processo de pensamento",
      Light: "Pensamento Leve",
      LightDesc: "1024 tokens",
      Medium: "Pensamento Médio",
      MediumDesc: "4096 tokens",
      Deep: "Pensamento Profundo",
      DeepDesc: "8192 tokens",
      VeryDeep: "Pensamento Muito Profundo",
      VeryDeepDesc: "16384 tokens",
      Notice:
        "Apenas modelos que suportam thinkingBudget podem ajustar a profundidade do pensamento",
      ClaudeNotice:
        "Apenas modelos da série Claude podem ajustar a profundidade do pensamento",
      GeminiNotice:
        "Apenas modelos da série Gemini podem ajustar a profundidade do pensamento",
      ClaudeLight: "Pensar",
      ClaudeLightDesc: "5000 tokens",
      ClaudeMedium: "Pensar Seriamente",
      ClaudeMediumDesc: "10000 tokens",
      ClaudeDeep: "Pensar Mais Seriamente",
      ClaudeDeepDesc: "20000 tokens",
      ClaudeVeryDeep: "Ultra Pensamento",
      ClaudeVeryDeepDesc: "32000 tokens",
      ClaudeDynamicDesc:
        "Ajustar automaticamente a profundidade do pensamento (padrão 10000 tokens)",
    },
  },
  Export: {
    Title: "Exportar Mensagens",
    Copy: "Copiar Tudo",
    Download: "Baixar",
    Share: "Compartilhar Histórico de Chat",
    MessageFromYou: "Mensagem De Você",
    MessageFromChatGPT: "Mensagem De ChatGPT",
    Format: {
      Title: "Formato de Exportação",
      SubTitle: "Markdown ou Imagem PNG",
    },
    IncludeContext: {
      Title: "Incluindo Contexto",
      SubTitle: "Exportar prompts de contexto na máscara ou não",
    },
    Steps: {
      Select: "Selecionar",
      Preview: "Pré-visualizar",
    },
    Image: {
      Toast: "Capturando Imagem...",
      Modal:
        "Pressione longamente ou clique com o botão direito para salvar a imagem",
    },
    Artifacts: {
      Title: "Imprimir Página",
      Error: "Erro de Impressão",
    },
  },
  Select: {
    Search: "Buscar",
    All: "Selecionar Tudo",
    Latest: "Selecionar Mais Recente",
    Clear: "Limpar",
  },
  Memory: {
    Title: "Prompt de Memória",
    EmptyContent: "Nada ainda.",
    Send: "Enviar Memória",
    Copy: "Copiar Memória",
    Reset: "Resetar Sessão",
    ResetConfirm:
      "Resetar irá limpar o histórico de conversa atual e a memória histórica. Você tem certeza que quer resetar?",
  },
  Home: {
    NewChat: "Novo Chat",
    DeleteChat: "Confirmar para deletar a conversa selecionada?",
    DeleteToast: "Chat Deletado",
    Revert: "Reverter",
  },
  Settings: {
    Title: "Configurações",
    SubTitle: "Todas as Configurações",
    ShowPassword: "Mostrar Senha",

    Tab: {
      General: "Configurações Gerais",
      Sync: "Sincronização na Nuvem",
      Mask: "Máscara",
      Prompt: "Prompt",
      ModelService: "Serviço de Modelo",
      ModelConfig: "Configuração do Modelo",
      Voice: "Voz",
    },

    Danger: {
      Reset: {
        Title: "Resetar Todas as Configurações",
        SubTitle: "Resetar todos os itens de configuração para o padrão",
        Action: "Resetar",
        Confirm: "Confirmar para resetar todas as configurações para o padrão?",
      },
      Clear: {
        Title: "Limpar Todos os Dados",
        SubTitle: "Limpar todas as mensagens e configurações",
        Action: "Limpar",
        Confirm: "Confirmar para limpar todas as mensagens e configurações?",
      },
    },
    Lang: {
      Name: "Language", // ATENÇÃO: se você quiser adicionar uma nova tradução, não traduza este valor, deixe como `Language`
      All: "Todos os Idiomas",
    },
    Avatar: "Avatar",
    FontSize: {
      Title: "Tamanho da Fonte",
      SubTitle: "Ajustar o tamanho da fonte do conteúdo do chat",
    },
    FontFamily: {
      Title: "Fonte do Chat",
      SubTitle:
        "Fonte do conteúdo do chat, deixe vazio para aplicar a fonte padrão global",
      Placeholder: "Nome da Fonte",
    },
    InjectSystemPrompts: {
      Title: "Inserir Prompts de Sistema",
      SubTitle: "Inserir um prompt de sistema global para cada requisição",
    },
    InputTemplate: {
      Title: "Modelo de Entrada",
      SubTitle: "A mensagem mais recente será preenchida neste modelo",
    },

    Update: {
      Version: (x: string) => `Versão: ${x}`,
      IsLatest: "Última versão",
      CheckUpdate: "Verificar Atualização",
      IsChecking: "Verificando atualização...",
      FoundUpdate: (x: string) => `Nova versão encontrada: ${x}`,
      GoToUpdate: "Atualizar",
      Success: "Atualização bem-sucedida!",
      Failed: "Falha na atualização",
    },
    SendKey: "Tecla de Envio",
    Theme: "Tema",
    TightBorder: "Borda Ajustada",
    SendPreviewBubble: {
      Title: "Bolha de Pré-visualização de Envio",
      SubTitle: "Pré-visualizar markdown na bolha",
    },
    AutoGenerateTitle: {
      Title: "Gerar Título Automaticamente",
      SubTitle: "Gerar um título adequado baseado no conteúdo da conversa",
    },
    Sync: {
      CloudState: "Última Atualização",
      NotSyncYet: "Ainda não sincronizado",
      Success: "Sincronização bem sucedida",
      Fail: "Falha na sincronização",

      Config: {
        Modal: {
          Title: "Configurar Sincronização",
          Check: "Verificar Conexão",
        },
        SyncType: {
          Title: "Tipo de Sincronização",
          SubTitle: "Escolha seu serviço de sincronização favorito",
        },
        Proxy: {
          Title: "Habilitar Proxy CORS",
          SubTitle: "Habilitar um proxy para evitar restrições de cross-origin",
        },
        ProxyUrl: {
          Title: "Endpoint de Proxy",
          SubTitle: "Apenas aplicável ao proxy CORS embutido para este projeto",
        },

        WebDav: {
          Endpoint: "Endpoint WebDAV",
          UserName: "Nome de Usuário",
          Password: "Senha",
        },

        UpStash: {
          Endpoint: "URL REST Redis UpStash",
          UserName: "Nome do Backup",
          Password: "Token REST Redis UpStash",
        },
      },

      LocalState: "Dados Locais",
      Overview: (overview: any) => {
        return `${overview.chat} chats，${overview.message} mensagens，${overview.prompt} prompts，${overview.mask} máscaras`;
      },
      ImportFailed: "Falha ao importar do arquivo",
    },
    Mask: {
      ModelIcon: {
        Title: "Usar Ícone do Modelo como Avatar de IA",
        SubTitle:
          "Quando ativado, o avatar de IA nas conversas usará o ícone do modelo atual em vez de emojis",
      },
    },
    AccessCode: {
      Title: "Código de Acesso",
      SubTitle:
        "Controle de acesso ativado, por favor insira o código de acesso",
      Placeholder: "Insira o código de acesso",
      Status: {
        Enabled: "Controle de acesso ativado",
        Valid: "Código de acesso válido",
        Invalid: "Código de acesso inválido",
      },
    },
    Prompt: {
      Disable: {
        Title: "Desabilitar auto-completar",
        SubTitle: "Digite / para acionar auto-completar",
      },
      List: "Lista de Prompts",
      ListCount: (builtin: number, custom: number) =>
        `${builtin} embutidos, ${custom} definidos pelo usuário`,
      Edit: "Editar",
      Modal: {
        Title: "Lista de Prompts",
        Add: "Adicionar Um",
        Search: "Buscar Prompts",
      },
      EditModal: {
        Title: "Editar Prompt",
      },
    },
    HistoryCount: {
      Title: "Contagem de Mensagens Anexadas",
      SubTitle: "Número de mensagens enviadas anexadas por requisição",
    },
    CompressThreshold: {
      Title: "Limite de Compressão de Histórico",
      SubTitle:
        "Irá comprimir se o comprimento das mensagens não comprimidas exceder o valor",
    },

    Access: {
      SaasStart: {
        Title: "",
        Label: "",
        SubTitle: "",
        ChatNow: "",
      },
      AccessCode: {
        Title: "Código de Acesso",
        SubTitle: "Controle de Acesso Habilitado",
        Placeholder: "Insira o Código",
      },
      CustomEndpoint: {
        Title: "Endpoint Personalizado",
        SubTitle: "Use serviço personalizado Azure ou OpenAI",
      },
      Provider: {
        Title: "Provedor do Modelo",
        SubTitle: "Selecione Azure ou OpenAI",
        Name: {
          ByteDance: "ByteDance",
          Alibaba: "Alibaba Cloud",
          Moonshot: "Moonshot",
        },
        Status: {
          Enabled: "Habilitado",
        },
        Models: {
          Title: "Modelos Ativados",
          SubTitle: "Lista de modelos ativados no provedor atual",
          NoModels: "Nenhum modelo ativado",
          Manage: "Gerenciar",
        },
        Description: {
          OpenAI: "Modelos da série OpenAI GPT",
          Azure: "Serviço Microsoft Azure OpenAI",
          Google: "Modelos da série Google Gemini",
          Anthropic: "Modelos da série Anthropic Claude",
          ByteDance: "Modelos da série ByteDance Doubao",
          Alibaba: "Modelos da série Alibaba Cloud Qwen",
          Moonshot: "Modelos da série Moonshot Kimi",
          DeepSeek: "Modelos da série DeepSeek",
          XAI: "Modelos da série xAI Grok",
          SiliconFlow: "SiliconFlow",
          Custom: "Personalizado",
        },
        Terms: {
          Provider: "Provedor",
        },
      },
      OpenAI: {
        ApiKey: {
          Title: "Chave API OpenAI",
          SubTitle: "Usar chave OpenAI personalizada",
          Placeholder: "sk-xxx",
        },

        Endpoint: {
          Title: "Endpoint OpenAI",
          SubTitle:
            "Deve começar com http(s):// ou usar /api/openai como padrão",
        },
      },
      Azure: {
        ApiKey: {
          Title: "Chave API Azure",
          SubTitle: "Verifique sua chave API do console Azure",
          Placeholder: "Chave API Azure",
        },

        Endpoint: {
          Title: "Endpoint Azure",
          SubTitle: "Exemplo: ",
        },

        ApiVerion: {
          Title: "Versão API Azure",
          SubTitle: "Verifique sua versão API do console Azure",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "Chave API Anthropic",
          SubTitle:
            "Usar chave Anthropic personalizada para contornar restrições de acesso",
          Placeholder: "Chave API Anthropic",
        },

        Endpoint: {
          Title: "Endereço do Endpoint",
          SubTitle: "Exemplo: ",
        },

        ApiVerion: {
          Title: "Versão API (Versão API Claude)",
          SubTitle: "Selecione e insira uma versão API específica",
        },
      },
      Google: {
        ApiKey: {
          Title: "Chave API",
          SubTitle: "Obtenha sua chave API do Google AI",
          Placeholder: "Insira sua chave API do Google AI Studio",
        },

        Endpoint: {
          Title: "Endereço do Endpoint",
          SubTitle: "Exemplo: ",
        },

        ApiVersion: {
          Title: "Versão API (apenas para gemini-pro)",
          SubTitle: "Selecione uma versão API específica",
        },
        GoogleSafetySettings: {
          Title: "Nível de Filtro de Segurança Google",
          SubTitle: "Ajustar nível de filtragem de conteúdo",
        },
      },
      Baidu: {
        ApiKey: {
          Title: "Chave API",
          SubTitle: "Usar chave API Baidu personalizada",
          Placeholder: "Chave API Baidu",
        },
        SecretKey: {
          Title: "Chave Secreta",
          SubTitle: "Usar chave secreta Baidu personalizada",
          Placeholder: "Chave Secreta Baidu",
        },
        Endpoint: {
          Title: "Endereço do Endpoint",
          SubTitle:
            "Endereços personalizados não são suportados, configure em .env",
        },
      },
      Tencent: {
        ApiKey: {
          Title: "Chave API",
          SubTitle: "Usar chave API Tencent personalizada",
          Placeholder: "Chave API Tencent",
        },
        SecretKey: {
          Title: "Chave Secreta",
          SubTitle: "Usar chave secreta Tencent personalizada",
          Placeholder: "Chave Secreta Tencent",
        },
        Endpoint: {
          Title: "Endereço do Endpoint",
          SubTitle:
            "Endereços personalizados não são suportados, configure em .env",
        },
      },
      ByteDance: {
        ApiKey: {
          Title: "Chave de Interface",
          SubTitle: "Usar chave API ByteDance personalizada",
          Placeholder: "Chave API ByteDance",
        },
        Endpoint: {
          Title: "Endereço do Endpoint",
          SubTitle: "Exemplo: ",
        },
      },
      Alibaba: {
        ApiKey: {
          Title: "Chave de Interface",
          SubTitle: "Usar chave API Alibaba Cloud personalizada",
          Placeholder: "Chave API Alibaba Cloud",
        },
        Endpoint: {
          Title: "Endereço do Endpoint",
          SubTitle: "Exemplo: ",
        },
      },
      Moonshot: {
        ApiKey: {
          Title: "Chave de Interface",
          SubTitle: "Usar chave API Moonshot personalizada",
          Placeholder: "Chave API Moonshot",
        },
        Endpoint: {
          Title: "Endereço do Endpoint",
          SubTitle: "Exemplo: ",
        },
      },
      DeepSeek: {
        ApiKey: {
          Title: "Chave de Interface",
          SubTitle: "Usar chave API DeepSeek personalizada",
          Placeholder: "Chave API DeepSeek",
        },
        Endpoint: {
          Title: "Endereço do Endpoint",
          SubTitle: "Exemplo: ",
        },
      },
      XAI: {
        ApiKey: {
          Title: "Chave de Interface",
          SubTitle: "Usar chave API XAI personalizada",
          Placeholder: "Chave API XAI",
        },
        Endpoint: {
          Title: "Endereço do Endpoint",
          SubTitle: "Exemplo: ",
        },
      },
      SiliconFlow: {
        ApiKey: {
          Title: "Chave de Interface",
          SubTitle: "Usar chave API SiliconFlow personalizada",
          Placeholder: "Chave API SiliconFlow",
        },
        Endpoint: {
          Title: "Endereço do Endpoint",
          SubTitle: "Exemplo: ",
        },
      },
      ChatGLM: {
        ApiKey: {
          Title: "Chave API",
          SubTitle: "Usar chave API ChatGLM personalizada",
          Placeholder: "Chave API ChatGLM",
        },
        Endpoint: {
          Title: "Endereço do Endpoint",
          SubTitle: "Exemplo: ",
        },
      },
      Iflytek: {
        ApiKey: {
          Title: "ApiKey",
          SubTitle: "Obtenha ApiKey do console iFlytek Spark",
          Placeholder: "ApiKey",
        },
        ApiSecret: {
          Title: "ApiSecret",
          SubTitle: "Obtenha ApiSecret do console iFlytek Spark",
          Placeholder: "ApiSecret",
        },
        Endpoint: {
          Title: "Endereço do Endpoint",
          SubTitle: "Exemplo: ",
        },
      },
      AI302: {
        ApiKey: {
          Title: "Chave de Interface",
          SubTitle: "Usar chave API 302.AI personalizada",
          Placeholder: "Chave API 302.AI",
        },
        Endpoint: {
          Title: "Endereço do Endpoint",
          SubTitle: "Exemplo: ",
        },
      },
      CustomProvider: {
        Add: {
          Title: "Adicionar Provedor Personalizado",
          Button: "Adicionar Provedor Personalizado",
          Description:
            "Adicionar canal personalizado baseado em tipos de provedor existentes",
        },
        Modal: {
          Title: "Adicionar Provedor Personalizado",
          Name: {
            Title: "Nome do Provedor",
            Placeholder: "Insira o nome do provedor personalizado",
            Required: "Por favor, insira o nome do provedor",
            Unique: "O nome do provedor já existe, por favor use outro nome",
          },
          Type: {
            Title: "Tipo de Provedor",
            OpenAI: "OpenAI - Serviços compatíveis com API OpenAI",
            Google: "Google - API Google Gemini",
            Anthropic: "Anthropic - API Anthropic Claude",
          },
          ApiKey: {
            Title: "Chave API",
            Placeholder: "Insira a chave API",
            Required: "Por favor, insira a chave API",
          },
          Endpoint: {
            Title: "Endpoint Personalizado",
            Placeholder: "Deixe vazio para usar o endpoint padrão",
            Optional: "(Opcional)",
          },
          Cancel: "Cancelar",
          Confirm: "Adicionar",
        },
        Config: {
          Type: "Tipo de Provedor",
          BasedOn: "Baseado em",
          ApiKeyDescription: "Chave API do provedor personalizado",
          EndpointDescription: "Endereço do endpoint de API personalizado",
          EndpointPlaceholder: "Endereço do endpoint de API",
          Delete: {
            Title: "Excluir Provedor",
            SubTitle:
              "Excluir este provedor personalizado e todas as suas configurações",
            Button: "Excluir",
            Confirm:
              "Tem certeza de que deseja excluir o provedor personalizado",
            ConfirmSuffix: "?",
          },
        },
      },
    },

    Model: "Modelo",
    CompressModel: {
      Title: "Modelo de Compressão",
      SubTitle: "Modelo usado para comprimir o histórico",
    },
    Temperature: {
      Title: "Temperatura",
      SubTitle: "Um valor maior torna a saída mais aleatória",
    },
    TopP: {
      Title: "Top P",
      SubTitle: "Não altere este valor junto com a temperatura",
    },
    MaxTokens: {
      Title: "Máximo de Tokens",
      SubTitle: "Comprimento máximo de tokens de entrada e tokens gerados",
    },
    PresencePenalty: {
      Title: "Penalidade de Presença",
      SubTitle:
        "Um valor maior aumenta a probabilidade de falar sobre novos tópicos",
    },
    FrequencyPenalty: {
      Title: "Penalidade de Frequência",
      SubTitle:
        "Um valor maior diminui a probabilidade de repetir a mesma linha",
    },
    TTS: {
      Enable: {
        Title: "Ativar TTS",
        SubTitle: "Ativar serviço de conversão texto-fala",
      },
      Autoplay: {
        Title: "Ativar Reprodução Automática",
        SubTitle:
          "Gerar e reproduzir automaticamente a fala, você precisa ativar primeiro o interruptor de conversão texto-fala",
      },
      Model: "Modelo",
      Engine: "Motor de Conversão",
      EngineConfig: {
        Title: "Nota de Configuração",
        SubTitle:
          "OpenAI-TTS usará a configuração do provedor OpenAI nos serviços de modelo. Por favor, adicione a chave API correspondente no provedor OpenAI antes de usar",
      },
      Voice: {
        Title: "Voz",
        SubTitle: "A voz a ser usada ao gerar áudio",
      },
      Speed: {
        Title: "Velocidade",
        SubTitle: "A velocidade do áudio gerado",
      },
    },
    Realtime: {
      Enable: {
        Title: "Chat em Tempo Real",
        SubTitle: "Ativar função de chat em tempo real",
      },
      Provider: {
        Title: "Provedor de Modelo",
        SubTitle: "Alternar entre diferentes provedores",
      },
      Model: {
        Title: "Modelo",
        SubTitle: "Selecione um modelo",
      },
      ApiKey: {
        Title: "Chave API",
        SubTitle: "Chave API",
        Placeholder: "Chave API",
      },
      Azure: {
        Endpoint: {
          Title: "Endpoint",
          SubTitle: "Endpoint",
        },
        Deployment: {
          Title: "Nome da Implantação",
          SubTitle: "Nome da Implantação",
        },
      },
      Temperature: {
        Title: "Temperatura",
        SubTitle: "Valores mais altos resultam em respostas mais aleatórias",
      },
    },
  },
  Store: {
    DefaultTopic: "Nova Conversa",
    BotHello: "Olá! Como posso ajudá-lo hoje?",
    Error: "Algo deu errado, por favor tente novamente mais tarde.",
    Prompt: {
      History: (content: string) =>
        "Este é um resumo do histórico de chat como um recapitulativo: " +
        content,
      Topic:
        "Por favor, gere um título de quatro a cinco palavras resumindo nossa conversa sem qualquer introdução, pontuação, aspas, períodos, símbolos ou texto adicional. Remova as aspas que o envolvem.",
      Summarize:
        "Resuma a discussão brevemente em 200 palavras ou menos para usar como um prompt para o contexto futuro.",
    },
  },
  Copy: {
    Success: "Copiado para a área de transferência",
    Failed:
      "Falha na cópia, por favor conceda permissão para acessar a área de transferência",
  },
  Download: {
    Success: "Conteúdo baixado para seu diretório.",
    Failed: "Falha no download.",
  },
  Context: {
    Toast: (x: any) => `Com ${x} prompts contextuais`,
    Edit: "Configurações do Chat Atual",
    Add: "Adicionar um Prompt",
    Clear: "Contexto Limpo",
    Revert: "Reverter",
  },

  ChatSettings: {
    Name: "Configurações do Chat",
  },
  Mcp: {
    Name: "MCP",
  },
  FineTuned: {
    Sysmessage: "Você é um assistente que",
  },
  SearchChat: {
    Name: "Pesquisar",
    Page: {
      Title: "Pesquisar histórico de chat",
      Search: "Digite palavras-chave para pesquisa",
      NoResult: "Nenhum resultado encontrado",
      NoData: "Sem dados",
      Loading: "Carregando",

      SubTitle: (count: number) => `Encontrado ${count} resultados`,
    },
    Item: {
      View: "Ver",
    },
  },
  Mask: {
    Name: "Assistente",
    DefaultName: "Assistente Padrão",
    Management: "Gerenciamento de Assistentes",
    NewMask: "Novo Assistente",
    DefaultModel: "Modelo Padrão",
    DefaultModelDesc: "Modelo padrão para novas conversas",
    UseGlobalModel: "Usar Modelo Padrão Global",
    ConversationCount: (count: number) =>
      `${count} conversa${count !== 1 ? "s" : ""}`,
    Page: {
      Title: "Assistentes de Personagem Predefinidos",
      SubTitle: (count: number) =>
        `${count} definições de personagens predefinidas`,
      Search: "Buscar Assistentes de Personagem",
      Create: "Criar",
    },
    Item: {
      Info: (count: number) => `${count} prompts predefinidos incluídos`,
      Chat: "Conversar",
      View: "Visualizar",
      Edit: "Editar",
      Delete: "Excluir",
      DeleteConfirm: "Confirmar exclusão?",
    },
    EditModal: {
      Title: "Editar Assistente Predefinido",
      Download: "Baixar Predefinição",
      Clone: "Clonar Predefinição",
    },
    Config: {
      Avatar: "Avatar do Personagem",
      Name: "Nome do Personagem",
      Sync: {
        Title: "Usar Configuração Global",
        SubTitle: "Usar configuração global neste chat",
        Confirm:
          "Confirmar para substituir a configuração personalizada pela configuração global?",
      },
      HideContext: {
        Title: "Ocultar Prompts de Contexto",
        SubTitle: "Não mostrar prompts de contexto no chat",
      },
      Artifacts: {
        Title: "Ativar Artefatos",
        SubTitle: "Quando ativado, permite renderizar páginas HTML diretamente",
      },
      CodeFold: {
        Title: "Ativar Dobra de Código",
        SubTitle:
          "Quando ativado, blocos de código longos podem ser dobrados/expandidos automaticamente",
      },
      Share: {
        Title: "Compartilhar Este Assistente",
        SubTitle: "Gerar um link para este assistente",
        Action: "Copiar Link",
      },
    },
  },
  NewChat: {
    Return: "Retornar",
    Skip: "Apenas Começar",
    Title: "Escolher um Assistente",
    SubTitle: "Converse com a Alma por trás do Assistente",
    More: "Encontrar Mais",
    Less: "Recolher Código",
    ShowCode: "Mostrar Código",
    Preview: "Pré-visualizar",
    NotShow: "Nunca Mostrar Novamente",
    ConfirmNoShow:
      "Confirmar para desabilitar？Você pode habilitar nas configurações depois.",
    Searching: "Pesquisando...",
    Search: "Pesquisar",
    NoSearch: "Nenhum resultado de pesquisa",
    SearchFormat: (SearchTime?: number) =>
      SearchTime !== undefined
        ? `(Pesquisa levou ${Math.round(SearchTime / 1000)} segundos)`
        : "",
    Thinking: "Pensando...",
    Think: "Conteúdo do Pensamento",
    NoThink: "Nenhum conteúdo de pensamento",
    ThinkFormat: (thinkingTime?: number) =>
      thinkingTime !== undefined
        ? `(Pensamento levou ${Math.round(thinkingTime / 1000)} segundos)`
        : "",
  },

  URLCommand: {
    Code: "Código de acesso detectado a partir da url, confirmar para aplicar? ",
    Settings:
      "Configurações detectadas a partir da url, confirmar para aplicar?",
  },

  UI: {
    Confirm: "Confirmar",
    Cancel: "Cancelar",
    Close: "Fechar",
    Create: "Criar",
    Edit: "Editar",
    Export: "Exportar",
    Import: "Importar",
    Sync: "Sincronizar",
    Config: "Configurar",
  },
  Exporter: {
    Description: {
      Title: "Apenas mensagens após a limpeza do contexto serão exibidas",
    },
    Model: "Modelo",
    Messages: "Mensagens",
    Topic: "Tópico",
    Time: "Tempo",
  },
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type LocaleType = typeof pt;
export type PartialLocaleType = DeepPartial<typeof pt>;

export default pt;
