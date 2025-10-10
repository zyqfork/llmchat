import { getClientConfig } from "../config/client";
import { SubmitKey } from "../store/config";
import { SAAS_CHAT_UTM_URL } from "@/app/constant";

const isApp = !!getClientConfig()?.isApp;

const es = {
  WIP: "En construcción...",
  Error: {
    Unauthorized: isApp
      ? `😆 La conversación encontró algunos problemas, no te preocupes:
    \\ 1️⃣ Si deseas comenzar sin configuración, [haz clic aquí para empezar a chatear inmediatamente 🚀](${SAAS_CHAT_UTM_URL})
    \\ 2️⃣ Si deseas usar tus propios recursos de OpenAI, haz clic [aquí](/#/settings) para modificar la configuración ⚙️`
      : `😆 La conversación encontró algunos problemas, no te preocupes:
    \ 1️⃣ Si deseas comenzar sin configuración, [haz clic aquí para empezar a chatear inmediatamente 🚀](${SAAS_CHAT_UTM_URL})
    \ 2️⃣ Si estás utilizando una versión de implementación privada, haz clic [aquí](/#/auth) para ingresar la clave de acceso 🔑
    \ 3️⃣ Si deseas usar tus propios recursos de OpenAI, haz clic [aquí](/#/settings) para modificar la configuración ⚙️
 `,
  },
  Auth: {
    Return: "Regresar",
    Title: "Se requiere contraseña",
    Tips: "El administrador ha habilitado la verificación de contraseña. Introduce el código de acceso a continuación",
    SubTips: "O ingresa tu clave API de OpenAI o Google",
    Input: "Introduce el código de acceso aquí",
    Confirm: "Confirmar",
    Later: "Más tarde",
    SaasTips: "",
    TopTips: "",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} conversaciones`,
  },
  Chat: {
    MultiModel: {
      Title: "Configuración de Chat Multi-Modelo",
      Enabled: "Multi-Modelo (Activado)",
      Disabled: "Multi-Modelo (Desactivado)",
      Count: (count: number) => `${count} modelos`,
      Description:
        "🎯 ¡Modo arena multi-modelo habilitado! Haz clic en el selector de modelos para seleccionar múltiples modelos para la conversación.",
      OpenSelector: "Abrir Selector de Modelos",
      AlreadySelected: (count: number) => `(${count} seleccionados)`,
      Tips: "💡 Consejo: En modo multi-modelo, puedes seleccionar múltiples modelos simultáneamente, y cada modelo responderá independientemente a tus mensajes, permitiéndote comparar las respuestas de diferentes modelos.",
      EnableToast:
        "🎯 ¡Modo multi-modelo habilitado! Haz clic en el selector de modelos para seleccionar múltiples modelos para la arena de conversación",
      DisableToast: "Modo multi-modelo desactivado",
      MinimumModelsError:
        "Por favor selecciona al menos 2 modelos para habilitar la conversación multi-modelo",
      ModelsSelectedToast: (count: number) =>
        `Seleccionados ${count} modelos para la conversación`,
    },
    UI: {
      SidebarToggle: "Contraer/Expandir Barra Lateral",
      SearchModels: "Buscar modelos...",
      SelectModel: "Seleccionar Modelo",
      ContextTooltip: {
        Current: (current: number, max: number) =>
          `Contexto actual: ${current} / ${max}`,
        CurrentTokens: (current: number, max: number) =>
          `Tokens actuales: ${current.toLocaleString()} / ${max.toLocaleString()}`,
        CurrentTokensUnknown: (current: number) =>
          `Tokens actuales: ${current.toLocaleString()} / Desconocido`,
        EstimatedTokens: (estimated: number) =>
          `Tokens estimados: ${estimated.toLocaleString()}`,
        ContextTokens: (tokens: string) => `Contexto: ${tokens} tokens`,
      },
    },
    SubTitle: (count: number) => `Total de ${count} conversaciones`,
    EditMessage: {
      Title: "Editar registro de mensajes",
      Topic: {
        Title: "Tema de la conversación",
        SubTitle: "Cambiar el tema de la conversación actual",
      },
    },
    Actions: {
      ChatList: "Ver lista de mensajes",
      CompressedHistory: "Ver historial de Prompts comprimidos",
      Export: "Exportar historial de chat",
      Copy: "Copiar",
      Stop: "Detener",
      Retry: "Reintentar",
      Pin: "Fijar",
      PinToastContent:
        "Se ha fijado 1 conversación a los prompts predeterminados",
      PinToastAction: "Ver",
      Delete: "Eliminar",
      Edit: "Editar",
      FullScreen: "Pantalla Completa",
      RefreshTitle: "Actualizar título",
      RefreshToast: "Se ha enviado la solicitud de actualización del título",
      Speech: "Reproducir",
      StopSpeech: "Detener",
      PreviousVersion: "Versión Anterior",
      NextVersion: "Versión Siguiente",
      Debug: "Depurar",
      CopyAsCurl: "Copiar como cURL",
    },
    Commands: {
      new: "Nueva conversación",
      newm: "Nueva conversación desde el asistente",
      next: "Siguiente conversación",
      prev: "Conversación anterior",
      clear: "Limpiar contexto",
      fork: "Copiar conversación",
      del: "Eliminar conversación",
    },
    InputActions: {
      Stop: "Detener respuesta",
      ToBottom: "Ir al más reciente",
      Theme: {
        auto: "Tema automático",
        light: "Modo claro",
        dark: "Modo oscuro",
      },
      Prompt: "Comandos rápidos",
      Masks: "Todos los asistentes",
      Clear: "Limpiar chat",
      Reset: "Restablecer conversación",
      ResetConfirm:
        "¿Estás seguro de restablecer todo el contenido de la ventana de chat actual?",
      Settings: "Configuración de conversación",
      UploadImage: "Subir imagen",
      Search: "Buscar",
      SearchOn: "Búsqueda Activada",
      SearchOff: "Búsqueda Desactivada",
      SearchEnabledToast:
        "🔍 ¡Función de búsqueda habilitada! Ahora puedes realizar búsquedas en la web",
      SearchDisabledToast: "❌ Función de búsqueda deshabilitada",
    },
    MCP: {
      Title: "Control de Herramientas MCP",
      Enable: "Habilitar Funciones MCP",
      EnableDesc:
        "Cuando está habilitado, se pueden usar herramientas MCP. Cuando está deshabilitado, no se enviarán prompts relacionados con MCP",
      NoTools: "No hay herramientas MCP disponibles",
      Loading: "Cargando...",
      ClientFailed: "Error al cargar el cliente MCP, manejo silencioso",
      ToolsCount: (count: number) => `${count} herramientas`,
    },
    Rename: "Renombrar conversación",
    Typing: "Escribiendo…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} para enviar`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "，Shift + Enter para nueva línea";
      }
      return (
        inputHints + "，/ para activar autocompletado，: para activar comandos"
      );
    },
    Send: "Enviar",
    TokenUsage: "Uso",
    TokenTooltip: {
      Context: "Contexto Actual",
      CurrentToken: "Token Actual",
      EstimatedToken: "Token Estimado",
      Unknown: "Desconocido",
    },
    StartSpeak: "Iniciar Habla",
    StopSpeak: "Detener Habla",
    Config: {
      Reset: "Restablecer Valores Predeterminados",
      SaveAs: "Guardar como Asistente",
    },
    IsContext: "Prompt Contextual",
    ShortcutKey: {
      Title: "Atajos de Teclado",
      newChat: "Abrir Nueva Conversación",
      focusInput: "Enfocar Campo de Entrada",
      copyLastMessage: "Copiar Última Respuesta",
      copyLastCode: "Copiar Último Bloque de Código",
      showShortcutKey: "Mostrar Atajos",
      clearContext: "Limpiar Contexto",
    },
    Thinking: {
      Title: "Profundidad de Pensamiento",
      Dynamic: "Pensamiento Dinámico",
      DynamicDesc:
        "El modelo decide automáticamente la profundidad del pensamiento",
      Off: "Pensamiento Desactivado",
      OffDesc: "Sin proceso de pensamiento",
      Light: "Pensamiento Ligero",
      LightDesc: "1024 tokens",
      Medium: "Pensamiento Medio",
      MediumDesc: "4096 tokens",
      Deep: "Pensamiento Profundo",
      DeepDesc: "8192 tokens",
      VeryDeep: "Pensamiento Muy Profundo",
      VeryDeepDesc: "16384 tokens",
      Notice:
        "Solo los modelos que soportan thinkingBudget pueden ajustar la profundidad del pensamiento",
      ClaudeNotice:
        "Solo los modelos de la serie Claude pueden ajustar la profundidad del pensamiento",
      GeminiNotice:
        "Solo los modelos de la serie Gemini pueden ajustar la profundidad del pensamiento",
      ClaudeLight: "Pensar",
      ClaudeLightDesc: "5000 tokens",
      ClaudeMedium: "Pensar Duro",
      ClaudeMediumDesc: "10000 tokens",
      ClaudeDeep: "Pensar Más Duro",
      ClaudeDeepDesc: "20000 tokens",
      ClaudeVeryDeep: "Ultra-pensamiento",
      ClaudeVeryDeepDesc: "32000 tokens",
      ClaudeDynamicDesc:
        "Ajustar automáticamente la profundidad del pensamiento (predeterminado 10000 tokens)",
    },
  },
  Export: {
    Title: "Compartir historial de chat",
    Copy: "Copiar todo",
    Download: "Descargar archivo",
    Share: "Compartir historial de chat",
    MessageFromYou: "Usuario",
    MessageFromChatGPT: "ChatGPT",
    Format: {
      Title: "Formato de exportación",
      SubTitle: "Puedes exportar como texto Markdown o imagen PNG",
    },
    IncludeContext: {
      Title: "Incluir contexto de asistente",
      SubTitle: "Mostrar contexto de asistente en los mensajes o no",
    },
    Steps: {
      Select: "Seleccionar",
      Preview: "Vista previa",
    },
    Image: {
      Toast: "Generando captura de pantalla",
      Modal: "Mantén presionado o haz clic derecho para guardar la imagen",
    },
    Artifacts: {
      Title: "Imprimir página",
      Error: "Error al imprimir",
    },
  },
  Select: {
    Search: "Buscar mensajes",
    All: "Seleccionar todo",
    Latest: "Últimos mensajes",
    Clear: "Limpiar selección",
  },
  Memory: {
    Title: "Resumen histórico",
    EmptyContent:
      "El contenido de la conversación es demasiado corto para resumir",
    Send: "Comprimir automáticamente el historial de chat y enviarlo como contexto",
    Copy: "Copiar resumen",
    Reset: "[no usado]",
    ResetConfirm: "¿Confirmar para borrar el resumen histórico?",
  },
  Home: {
    NewChat: "Nueva conversación",
    DeleteChat: "¿Confirmar la eliminación de la conversación seleccionada?",
    DeleteToast: "Conversación eliminada",
    Revert: "Deshacer",
  },
  Settings: {
    Title: "Configuración",
    SubTitle: "Todas las opciones de configuración",
    ShowPassword: "Mostrar Contraseña",

    Tab: {
      General: "Configuración General",
      Sync: "Sincronización en la Nube",
      Mask: "Asistente",
      Prompt: "Prompts",
      ModelService: "Servicio de Modelo",
      ModelConfig: "Configuración del Modelo",
      Voice: "Voz",
    },

    Danger: {
      Reset: {
        Title: "Restablecer todas las configuraciones",
        SubTitle:
          "Restablecer todas las opciones de configuración a los valores predeterminados",
        Action: "Restablecer ahora",
        Confirm: "¿Confirmar el restablecimiento de todas las configuraciones?",
      },
      Clear: {
        Title: "Eliminar todos los datos",
        SubTitle: "Eliminar todos los chats y datos de configuración",
        Action: "Eliminar ahora",
        Confirm:
          "¿Confirmar la eliminación de todos los chats y datos de configuración?",
      },
    },
    Lang: {
      Name: "Language", // ATENCIÓN: si deseas agregar una nueva traducción, por favor no traduzcas este valor, déjalo como `Language`
      All: "Todos los idiomas",
    },
    Avatar: "Avatar",
    FontSize: {
      Title: "Tamaño de fuente",
      SubTitle: "Tamaño de la fuente del contenido del chat",
    },
    FontFamily: {
      Title: "Fuente del Chat",
      SubTitle:
        "Fuente del contenido del chat, dejar vacío para aplicar la fuente predeterminada global",
      Placeholder: "Nombre de la Fuente",
    },
    InjectSystemPrompts: {
      Title: "Inyectar mensajes del sistema",
      SubTitle:
        "Forzar la adición de un mensaje del sistema simulado de ChatGPT al principio de cada lista de mensajes",
    },
    InputTemplate: {
      Title: "Preprocesamiento de entrada del usuario",
      SubTitle: "El último mensaje del usuario se rellenará en esta plantilla",
    },

    Update: {
      Version: (x: string) => `Versión actual: ${x}`,
      IsLatest: "Ya estás en la última versión",
      CheckUpdate: "Buscar actualizaciones",
      IsChecking: "Buscando actualizaciones...",
      FoundUpdate: (x: string) => `Nueva versión encontrada: ${x}`,
      GoToUpdate: "Ir a actualizar",
      Success: "¡Actualización exitosa!",
      Failed: "Error al actualizar",
    },
    SendKey: "Tecla de envío",
    Theme: "Tema",
    TightBorder: "Modo sin bordes",
    SendPreviewBubble: {
      Title: "Burbuja de vista previa",
      SubTitle: "Previsualizar contenido Markdown en burbuja de vista previa",
    },
    AutoGenerateTitle: {
      Title: "Generar título automáticamente",
      SubTitle: "Generar un título adecuado basado en el contenido del chat",
    },
    Sync: {
      CloudState: "Datos en la nube",
      NotSyncYet: "Aún no se ha sincronizado",
      Success: "Sincronización exitosa",
      Fail: "Sincronización fallida",

      Config: {
        Modal: {
          Title: "Configurar sincronización en la nube",
          Check: "Verificar disponibilidad",
        },
        SyncType: {
          Title: "Tipo de sincronización",
          SubTitle: "Selecciona el servidor de sincronización preferido",
        },
        Proxy: {
          Title: "Habilitar proxy",
          SubTitle:
            "Debes habilitar el proxy para sincronizar en el navegador y evitar restricciones de CORS",
        },
        ProxyUrl: {
          Title: "Dirección del proxy",
          SubTitle: "Solo para el proxy CORS incluido en este proyecto",
        },

        WebDav: {
          Endpoint: "Dirección WebDAV",
          UserName: "Nombre de usuario",
          Password: "Contraseña",
        },

        UpStash: {
          Endpoint: "URL de REST de UpStash Redis",
          UserName: "Nombre de respaldo",
          Password: "Token de REST de UpStash Redis",
        },
      },

      LocalState: "Datos locales",
      Overview: (overview: any) => {
        return `${overview.chat} conversaciones, ${overview.message} mensajes, ${overview.prompt} prompts, ${overview.mask} máscaras`;
      },
      ImportFailed: "Importación fallida",
    },
    Mask: {
      ModelIcon: {
        Title: "Usar Icono del Modelo como Avatar de IA",
        SubTitle:
          "Cuando está habilitado, el avatar de IA en las conversaciones usará el icono del modelo actual en lugar de emojis",
      },
    },
    AccessCode: {
      Title: "Código de Acceso",
      SubTitle:
        "El control de acceso está habilitado, por favor ingresa el código de acceso",
      Placeholder: "Ingresa el código de acceso",
      Status: {
        Enabled: "Control de acceso habilitado",
        Valid: "Código de acceso válido",
        Invalid: "Código de acceso inválido",
      },
    },
    Prompt: {
      Disable: {
        Title: "Desactivar autocompletado de prompts",
        SubTitle:
          "Escribe / al principio del campo de entrada para activar el autocompletado",
      },
      List: "Lista de prompts personalizados",
      ListCount: (builtin: number, custom: number) =>
        `Integrados ${builtin}, definidos por el usuario ${custom}`,
      Edit: "Editar",
      Modal: {
        Title: "Lista de prompts",
        Add: "Nuevo",
        Search: "Buscar prompts",
      },
      EditModal: {
        Title: "Editar prompt",
      },
    },
    HistoryCount: {
      Title: "Número de mensajes históricos adjuntos",
      SubTitle: "Número de mensajes históricos enviados con cada solicitud",
    },
    CompressThreshold: {
      Title: "Umbral de compresión de mensajes históricos",
      SubTitle:
        "Cuando los mensajes históricos no comprimidos superan este valor, se realizará la compresión",
    },

    Access: {
      SaasStart: {
        Title: "",
        Label: "",
        SubTitle: "",
        ChatNow: "",
      },
      AccessCode: {
        Title: "Contraseña de acceso",
        SubTitle: "El administrador ha habilitado el acceso encriptado",
        Placeholder: "Introduce la contraseña de acceso",
      },
      CustomEndpoint: {
        Title: "Interfaz personalizada",
        SubTitle: "¿Usar servicios personalizados de Azure u OpenAI?",
      },
      Provider: {
        Title: "Proveedor de modelos",
        SubTitle: "Cambiar entre diferentes proveedores",
        Name: {
          ByteDance: "ByteDance",
          Alibaba: "Alibaba Cloud",
          Moonshot: "Moonshot",
        },
        Status: {
          Enabled: "Habilitado",
        },
        Models: {
          Title: "Modelos habilitados",
          SubTitle: "Lista de modelos habilitados en el proveedor actual",
          NoModels: "No hay modelos habilitados",
          Manage: "Gestionar",
        },
        Description: {
          OpenAI: "Modelos de la serie OpenAI GPT",
          Azure: "Servicio OpenAI de Microsoft Azure",
          Google: "Modelos de la serie Google Gemini",
          Anthropic: "Modelos de la serie Anthropic Claude",
          ByteDance: "Modelos de la serie ByteDance Doubao",
          Alibaba: "Modelos de la serie Alibaba Cloud Qwen",
          Moonshot: "Modelos de la serie Moonshot Kimi",
          DeepSeek: "Modelos de la serie DeepSeek",
          XAI: "Modelos de la serie xAI Grok",
          SiliconFlow: "SiliconFlow",
          Custom: "Personalizado",
        },
        Terms: {
          Provider: "Proveedor",
        },
      },
      OpenAI: {
        ApiKey: {
          Title: "Clave API de OpenAI",
          SubTitle: "Usa una clave API de OpenAI personalizada",
          Placeholder: "sk-xxx",
        },

        Endpoint: {
          Title: "Endpoint de OpenAI",
          SubTitle:
            "Debe comenzar con http(s):// o usar /api/openai como predeterminado",
        },
      },
      Azure: {
        ApiKey: {
          Title: "Clave API de Azure",
          SubTitle: "Verifica tu clave API desde la consola de Azure",
          Placeholder: "Clave API de Azure",
        },

        Endpoint: {
          Title: "Endpoint de Azure",
          SubTitle: "Ejemplo: ",
        },

        ApiVerion: {
          Title: "Versión de API de Azure",
          SubTitle: "Verifica tu versión de API desde la consola de Azure",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "Clave API de Anthropic",
          SubTitle:
            "Usa una clave Anthropic personalizada para omitir las restricciones de acceso por contraseña",
          Placeholder: "Clave API de Anthropic",
        },

        Endpoint: {
          Title: "Dirección del endpoint",
          SubTitle: "Ejemplo: ",
        },

        ApiVerion: {
          Title: "Versión de API (versión de API de Claude)",
          SubTitle: "Selecciona e ingresa una versión específica de la API",
        },
      },
      Google: {
        ApiKey: {
          Title: "Clave API",
          SubTitle: "Obtén tu clave API de Google AI",
          Placeholder: "Introduce tu clave API de Google AI Studio",
        },

        Endpoint: {
          Title: "Dirección del endpoint",
          SubTitle: "Ejemplo: ",
        },

        ApiVersion: {
          Title: "Versión de API (específica para gemini-pro)",
          SubTitle: "Selecciona una versión específica de la API",
        },
        GoogleSafetySettings: {
          Title: "Configuración de seguridad de Google",
          SubTitle: "Establece el nivel de filtrado de contenido",
        },
      },
      Baidu: {
        ApiKey: {
          Title: "Clave API",
          SubTitle: "Usa una clave API de Baidu personalizada",
          Placeholder: "Clave API de Baidu",
        },
        SecretKey: {
          Title: "Clave secreta",
          SubTitle: "Usa una clave secreta de Baidu personalizada",
          Placeholder: "Clave secreta de Baidu",
        },
        Endpoint: {
          Title: "Dirección del endpoint",
          SubTitle: "No admite personalización, ve a .env para configurarlo",
        },
      },
      Tencent: {
        ApiKey: {
          Title: "Clave API",
          SubTitle: "Usa una clave API de Tencent personalizada",
          Placeholder: "Clave API de Tencent",
        },
        SecretKey: {
          Title: "Clave secreta",
          SubTitle: "Usa una clave secreta de Tencent personalizada",
          Placeholder: "Clave secreta de Tencent",
        },
        Endpoint: {
          Title: "Dirección del endpoint",
          SubTitle: "No admite personalización, ve a .env para configurarlo",
        },
      },
      ByteDance: {
        ApiKey: {
          Title: "Clave de interfaz",
          SubTitle: "Usa una clave API de ByteDance personalizada",
          Placeholder: "Clave API de ByteDance",
        },
        Endpoint: {
          Title: "Dirección del endpoint",
          SubTitle: "Ejemplo: ",
        },
      },
      Alibaba: {
        ApiKey: {
          Title: "Clave de interfaz",
          SubTitle: "Usa una clave API de Alibaba Cloud personalizada",
          Placeholder: "Clave API de Alibaba Cloud",
        },
        Endpoint: {
          Title: "Dirección del endpoint",
          SubTitle: "Ejemplo: ",
        },
      },
      Moonshot: {
        ApiKey: {
          Title: "Clave de interfaz",
          SubTitle: "Usa una clave API de Moonshot personalizada",
          Placeholder: "Clave API de Moonshot",
        },
        Endpoint: {
          Title: "Dirección del endpoint",
          SubTitle: "Ejemplo: ",
        },
      },
      DeepSeek: {
        ApiKey: {
          Title: "Clave de interfaz",
          SubTitle: "Usa una clave API de DeepSeek personalizada",
          Placeholder: "Clave API de DeepSeek",
        },
        Endpoint: {
          Title: "Dirección del endpoint",
          SubTitle: "Ejemplo: ",
        },
      },
      XAI: {
        ApiKey: {
          Title: "Clave de interfaz",
          SubTitle: "Usa una clave API de XAI personalizada",
          Placeholder: "Clave API de XAI",
        },
        Endpoint: {
          Title: "Dirección del endpoint",
          SubTitle: "Ejemplo: ",
        },
      },
      SiliconFlow: {
        ApiKey: {
          Title: "Clave de interfaz",
          SubTitle: "Usa una clave API de SiliconFlow personalizada",
          Placeholder: "Clave API de SiliconFlow",
        },
        Endpoint: {
          Title: "Dirección del endpoint",
          SubTitle: "Ejemplo: ",
        },
      },
      ChatGLM: {
        ApiKey: {
          Title: "Clave API",
          SubTitle: "Usa una clave API de ChatGLM personalizada",
          Placeholder: "Clave API de ChatGLM",
        },
        Endpoint: {
          Title: "Dirección del endpoint",
          SubTitle: "Ejemplo: ",
        },
      },
      Iflytek: {
        ApiKey: {
          Title: "ApiKey",
          SubTitle: "Obtén ApiKey desde la consola de iFlytek Spark",
          Placeholder: "ApiKey",
        },
        ApiSecret: {
          Title: "ApiSecret",
          SubTitle: "Obtén ApiSecret desde la consola de iFlytek Spark",
          Placeholder: "ApiSecret",
        },
        Endpoint: {
          Title: "Dirección del endpoint",
          SubTitle: "Ejemplo: ",
        },
      },
      AI302: {
        ApiKey: {
          Title: "Clave de interfaz",
          SubTitle: "Usa una clave API de 302.AI personalizada",
          Placeholder: "Clave API de 302.AI",
        },
        Endpoint: {
          Title: "Dirección del endpoint",
          SubTitle: "Ejemplo: ",
        },
      },
      CustomProvider: {
        Add: {
          Title: "Agregar Proveedor Personalizado",
          Button: "Agregar Proveedor Personalizado",
          Description:
            "Agregar canal personalizado basado en tipos de proveedores existentes",
        },
        Modal: {
          Title: "Agregar Proveedor Personalizado",
          Name: {
            Title: "Nombre del Proveedor",
            Placeholder: "Ingresa el nombre del proveedor personalizado",
            Required: "Por favor ingresa el nombre del proveedor",
            Unique:
              "El nombre del proveedor ya existe, por favor usa otro nombre",
          },
          Type: {
            Title: "Tipo de Proveedor",
            OpenAI: "OpenAI - Servicios compatibles con API de OpenAI",
            Google: "Google - API de Google Gemini",
            Anthropic: "Anthropic - API de Anthropic Claude",
          },
          ApiKey: {
            Title: "Clave API",
            Placeholder: "Ingresa la clave API",
            Required: "Por favor ingresa la clave API",
          },
          Endpoint: {
            Title: "Endpoint Personalizado",
            Placeholder: "Deja vacío para usar el endpoint predeterminado",
            Optional: "(Opcional)",
          },
          Cancel: "Cancelar",
          Confirm: "Agregar",
        },
        Config: {
          Type: "Tipo de Proveedor",
          BasedOn: "Basado en",
          ApiKeyDescription: "Clave API del proveedor personalizado",
          EndpointDescription: "Dirección del endpoint de API personalizado",
          EndpointPlaceholder: "Dirección del endpoint de API",
          Delete: {
            Title: "Eliminar Proveedor",
            SubTitle:
              "Eliminar este proveedor personalizado y todas sus configuraciones",
            Button: "Eliminar",
            Confirm:
              "¿Estás seguro de que quieres eliminar el proveedor personalizado",
            ConfirmSuffix: "?",
          },
        },
      },
    },

    Model: "Modelo (model)",
    CompressModel: {
      Title: "Modelo de compresión",
      SubTitle: "Modelo utilizado para comprimir el historial",
    },
    Temperature: {
      Title: "Aleatoriedad (temperature)",
      SubTitle: "Cuanto mayor sea el valor, más aleatorio será el resultado",
    },
    TopP: {
      Title: "Muestreo por núcleo (top_p)",
      SubTitle: "Similar a la aleatoriedad, pero no cambies ambos a la vez",
    },
    MaxTokens: {
      Title: "Límite de tokens por respuesta (max_tokens)",
      SubTitle: "Número máximo de tokens utilizados en una sola interacción",
    },
    PresencePenalty: {
      Title: "Novedad de temas (presence_penalty)",
      SubTitle:
        "Cuanto mayor sea el valor, más probable es que se amplíen a nuevos temas",
    },
    FrequencyPenalty: {
      Title: "Penalización de frecuencia (frequency_penalty)",
      SubTitle:
        "Cuanto mayor sea el valor, más probable es que se reduzcan las palabras repetidas",
    },
    TTS: {
      Enable: {
        Title: "Habilitar TTS",
        SubTitle: "Habilitar servicio de texto a voz",
      },
      Autoplay: {
        Title: "Habilitar reproducción automática",
        SubTitle:
          "Generar automáticamente voz y reproducir, necesitas habilitar primero el interruptor de texto a voz",
      },
      Model: "Modelo",
      Engine: "Motor de conversión",
      EngineConfig: {
        Title: "Nota de configuración",
        SubTitle:
          "OpenAI-TTS usará la configuración del proveedor OpenAI en Servicios de Modelo. Por favor agrega la clave API correspondiente en el proveedor OpenAI antes de usar",
      },
      Voice: {
        Title: "Voz",
        SubTitle: "La voz a usar al generar el audio",
      },
      Speed: {
        Title: "Velocidad",
        SubTitle: "La velocidad del audio generado",
      },
    },
    Realtime: {
      Enable: {
        Title: "Chat en tiempo real",
        SubTitle: "Habilitar función de chat en tiempo real",
      },
      Provider: {
        Title: "Proveedor de modelos",
        SubTitle: "Cambiar entre diferentes proveedores",
      },
      Model: {
        Title: "Modelo",
        SubTitle: "Seleccionar un modelo",
      },
      ApiKey: {
        Title: "Clave API",
        SubTitle: "Clave API",
        Placeholder: "Clave API",
      },
      Azure: {
        Endpoint: {
          Title: "Endpoint",
          SubTitle: "Endpoint",
        },
        Deployment: {
          Title: "Nombre de implementación",
          SubTitle: "Nombre de implementación",
        },
      },
      Temperature: {
        Title: "Aleatoriedad (temperature)",
        SubTitle: "Valores más altos resultan en respuestas más aleatorias",
      },
    },
  },
  Store: {
    DefaultTopic: "Nuevo chat",
    BotHello: "¿En qué puedo ayudarte?",
    Error: "Hubo un error, inténtalo de nuevo más tarde",
    Prompt: {
      History: (content: string) =>
        "Este es un resumen del chat histórico como referencia: " + content,
      Topic:
        "Devuelve un tema breve de esta frase en cuatro a cinco palabras, sin explicación, sin puntuación, sin muletillas, sin texto adicional, sin negritas. Si no hay tema, devuelve 'charlas casuales'",
      Summarize:
        "Resume brevemente el contenido de la conversación para usar como un prompt de contexto, manteniéndolo dentro de 200 palabras",
    },
  },
  Copy: {
    Success: "Copiado al portapapeles",
    Failed: "Error al copiar, por favor otorga permisos al portapapeles",
  },
  Download: {
    Success: "Contenido descargado en tu directorio.",
    Failed: "Error al descargar.",
  },
  Context: {
    Toast: (x: any) => `Contiene ${x} prompts predefinidos`,
    Edit: "Configuración del chat actual",
    Add: "Agregar una conversación",
    Clear: "Contexto borrado",
    Revert: "Restaurar contexto",
  },

  ChatSettings: {
    Name: "Configuración de Conversación",
  },
  Mcp: {
    Name: "MCP",
  },
  FineTuned: {
    Sysmessage: "Eres un asistente",
  },
  SearchChat: {
    Name: "Buscar",
    Page: {
      Title: "Buscar en el historial de chat",
      Search: "Ingrese la palabra clave de búsqueda",
      NoResult: "No se encontraron resultados",
      NoData: "Sin datos",
      Loading: "Cargando",

      SubTitle: (count: number) => `Se encontraron ${count} resultados`,
    },
    Item: {
      View: "Ver",
    },
  },
  Mask: {
    Name: "Asistente",
    DefaultName: "Asistente Predeterminado",
    Management: "Gestión de Asistentes",
    NewMask: "Nuevo Asistente",
    DefaultModel: "Modelo Predeterminado",
    DefaultModelDesc: "Modelo predeterminado para nuevas conversaciones",
    UseGlobalModel: "Usar Modelo Global Predeterminado",
    ConversationCount: (count: number) =>
      `${count} conversación${count > 1 ? "es" : ""}`,
    Page: {
      Title: "Asistentes de Rol Predefinidos",
      SubTitle: (count: number) => `${count} definiciones de rol predefinidas`,
      Search: "Buscar asistentes de rol",
      Create: "Crear",
    },
    Item: {
      Info: (count: number) => `Contiene ${count} prompts`,
      Chat: "Chat",
      View: "Ver",
      Edit: "Editar",
      Delete: "Eliminar",
      DeleteConfirm: "¿Confirmar eliminación?",
    },
    EditModal: {
      Title: "Editar Asistente",
      Download: "Descargar predefinido",
      Clone: "Clonar predefinido",
    },
    Config: {
      Avatar: "Avatar del rol",
      Name: "Nombre del rol",
      Sync: {
        Title: "Usar configuración global",
        SubTitle:
          "¿Usar la configuración global del modelo para la conversación actual?",
        Confirm:
          "La configuración personalizada de la conversación actual se sobrescribirá automáticamente, ¿confirmar habilitar la configuración global?",
      },
      HideContext: {
        Title: "Ocultar conversaciones predefinidas",
        SubTitle:
          "Las conversaciones predefinidas ocultas no aparecerán en la interfaz de chat",
      },
      Artifacts: {
        Title: "Habilitar Artefactos",
        SubTitle:
          "Cuando está habilitado, se pueden renderizar páginas HTML directamente",
      },
      CodeFold: {
        Title: "Habilitar Plegado de Código",
        SubTitle:
          "Cuando está habilitado, se pueden plegar/desplegar bloques de código largos automáticamente",
      },
      Share: {
        Title: "Compartir este asistente",
        SubTitle: "Generar un enlace directo a este asistente",
        Action: "Copiar enlace",
      },
    },
  },
  NewChat: {
    Return: "Regresar",
    Skip: "Comenzar ahora",
    Title: "Seleccionar un asistente",
    SubTitle: "Comienza ahora, colisiona con la mente detrás del asistente",
    More: "Ver todo",
    Less: "Plegar código",
    ShowCode: "Mostrar código",
    Preview: "Vista previa",
    NotShow: "No mostrar más",
    ConfirmNoShow:
      "¿Confirmar desactivación? Puedes reactivar en la configuración en cualquier momento.",
    Searching: "Buscando...",
    Search: "Buscar",
    NoSearch: "Sin resultados de búsqueda",
    SearchFormat: (SearchTime?: number) =>
      SearchTime !== undefined
        ? `(Búsqueda tomó ${Math.round(SearchTime / 1000)} s)`
        : "",
    Thinking: "Pensando...",
    Think: "Contenido del pensamiento",
    NoThink: "Sin contenido de pensamiento",
    ThinkFormat: (thinkingTime?: number) =>
      thinkingTime !== undefined
        ? `(Pensamiento tomó ${Math.round(thinkingTime / 1000)} s)`
        : "",
  },

  URLCommand: {
    Code: "Detectado código de acceso desde URL, ¿confirmar aplicación?",
    Settings:
      "Detectada configuración predefinida desde URL, ¿confirmar aplicación?",
  },

  UI: {
    Confirm: "Confirmar",
    Cancel: "Cancelar",
    Close: "Cerrar",
    Create: "Crear",
    Edit: "Editar",
    Export: "Exportar",
    Import: "Importar",
    Sync: "Sincronizar",
    Config: "Configurar",
  },
  Exporter: {
    Description: {
      Title: "Solo se mostrarán los mensajes después de borrar el contexto",
    },
    Model: "Modelo",
    Messages: "Mensajes",
    Topic: "Tema",
    Time: "Hora",
  },
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type LocaleType = typeof es;
export type PartialLocaleType = DeepPartial<typeof es>;

export default es;
