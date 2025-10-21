import { getClientConfig } from "../config/client";
import { SubmitKey } from "../store/config";
import { SAAS_CHAT_UTM_URL } from "@/app/constant";

const isApp = !!getClientConfig()?.isApp;

const ru = {
  WIP: "Скоро...",
  Error: {
    Unauthorized: isApp
      ? `😆 В разговоре возникли некоторые проблемы, не переживайте:
    \\ 1️⃣ Если вы хотите начать без настройки, [нажмите здесь, чтобы немедленно начать разговор 🚀](${SAAS_CHAT_UTM_URL})
    \\ 2️⃣ Если вы хотите использовать свои ресурсы OpenAI, нажмите [здесь](/#/settings), чтобы изменить настройки ⚙️`
      : `😆 В разговоре возникли некоторые проблемы, не переживайте:
    \ 1️⃣ Если вы хотите начать без настройки, [нажмите здесь, чтобы немедленно начать разговор 🚀](${SAAS_CHAT_UTM_URL})
    \ 2️⃣ Если вы используете частную версию развертывания, нажмите [здесь](/#/auth), чтобы ввести ключ доступа 🔑
    \ 3️⃣ Если вы хотите использовать свои ресурсы OpenAI, нажмите [здесь](/#/settings), чтобы изменить настройки ⚙️
 `,
  },
  Auth: {
    Title: "Требуется пароль",
    Tips: "Администратор включил проверку пароля. Пожалуйста, введите код доступа ниже",
    SubTips: "Или введите ваш API-ключ OpenAI или Google",
    Input: "Введите код доступа здесь",
    Confirm: "Подтвердить",
    Later: "Позже",
    Return: "Назад",
    SaasTips: "",
    TopTips: "",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} бесед`,
  },
  Chat: {
    MultiModel: {
      Title: "Настройки Мульти-Модельного Чата",
      Enabled: "Мульти-Модельный (Включен)",
      Disabled: "Мульти-Модельный (Отключен)",
      Count: (count: number) => `${count} моделей`,
      Description:
        "🎯 Активирован режим Мульти-Модельной Арены! Нажмите на селектор моделей, чтобы выбрать несколько моделей для разговора.",
      OpenSelector: "Открыть Селектор Моделей",
      AlreadySelected: (count: number) => `(${count} выбрано)`,
      Tips: "💡 Совет: В мульти-модельном режиме вы можете выбрать несколько моделей одновременно, и каждая модель будет независимо отвечать на ваши сообщения, позволяя вам сравнивать ответы разных моделей.",
      EnableToast:
        "🎯 Мульти-Модельный режим активирован! Нажмите на селектор моделей, чтобы выбрать несколько моделей для арены разговора",
      DisableToast: "Мульти-Модельный режим отключен",
      MinimumModelsError:
        "Пожалуйста, выберите минимум 2 модели для активации мульти-модельных разговоров",
      ModelsSelectedToast: (count: number) =>
        `${count} моделей выбрано для разговора`,
    },
    UI: {
      SidebarToggle: "Свернуть/Развернуть Боковую Панель",
      SearchModels: "Поиск моделей...",
      SelectModel: "Выбрать модель",
      ContextTooltip: {
        Current: (current: number, max: number) =>
          `Текущий контекст: ${current} / ${max}`,
        CurrentTokens: (current: number, max: number) =>
          `Текущие токены: ${current.toLocaleString()} / ${max.toLocaleString()}`,
        CurrentTokensUnknown: (current: number) =>
          `Текущие токены: ${current.toLocaleString()} / Неизвестно`,
        EstimatedTokens: (estimated: number) =>
          `Оценочные токены: ${estimated.toLocaleString()}`,
        ContextTokens: (tokens: string) => `Контекст: ${tokens} токенов`,
      },
    },
    SubTitle: (count: number) => `Всего ${count} бесед`,
    EditMessage: {
      Title: "Редактировать сообщение",
      Topic: {
        Title: "Тема чата",
        SubTitle: "Изменить текущую тему чата",
      },
    },
    Actions: {
      ChatList: "Просмотреть список сообщений",
      CompressedHistory: "Просмотреть сжатую историю подсказок",
      Export: "Экспортировать чат",
      Copy: "Копировать",
      Stop: "Остановить",
      Retry: "Повторить",
      Pin: "Закрепить",
      PinToastContent: "1 беседа закреплена в предустановленных подсказках",
      PinToastAction: "Просмотреть",
      Delete: "Удалить",
      Edit: "Редактировать",
      FullScreen: "Полный Экран",
      RefreshTitle: "Обновить заголовок",
      RefreshToast: "Запрос на обновление заголовка отправлен",
      Speech: "Воспроизвести",
      StopSpeech: "Остановить",
      PreviousVersion: "Предыдущая Версия",
      NextVersion: "Следующая Версия",
      Debug: "Отладка",
      CopyAsCurl: "Копировать как cURL",
    },
    Commands: {
      new: "Новый чат",
      newm: "Создать чат из маски",
      next: "Следующий чат",
      prev: "Предыдущий чат",
      clear: "Очистить контекст",
      fork: "Копировать Разговор",
      del: "Удалить чат",
    },
    InputActions: {
      Stop: "Остановить ответ",
      ToBottom: "Перейти к последнему",
      Theme: {
        auto: "Автоматическая тема",
        light: "Светлая тема",
        dark: "Темная тема",
      },
      Prompt: "Быстрая команда",
      Masks: "Все маски",
      Clear: "Очистить чат",
      Reset: "Сбросить Разговор",
      ResetConfirm:
        "Вы уверены, что хотите сбросить весь контент текущего окна чата?",
      Settings: "Настройки чата",
      UploadImage: "Загрузить изображение",
      Search: "Поиск",
      SearchOn: "Поиск Включен",
      SearchOff: "Поиск Отключен",
      SearchEnabledToast:
        "🔍 Функция поиска активирована! Теперь вы можете искать в Интернете",
      SearchDisabledToast: "❌ Функция поиска отключена",
    },
    MCP: {
      Title: "Управление Инструментами MCP",
      Enable: "Включить Функции MCP",
      EnableDesc:
        "При включении доступны инструменты MCP. При отключении связанные с MCP подсказки не будут отправляться",
      NoTools: "Нет доступных инструментов MCP",
      Loading: "Загрузка...",
      ClientFailed: "Не удалось загрузить клиент MCP, тихая обработка",
      ToolsCount: (count: number) => `${count} инструментов`,
    },
    Rename: "Переименовать чат",
    Typing: "Печатает…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} Отправить`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "，Shift + Enter для новой строки";
      }
      return inputHints + "，/ для автозаполнения，: для команд";
    },
    Send: "Отправить",
    TokenUsage: "Использование",
    TokenTooltip: {
      Context: "Текущий контекст",
      CurrentToken: "Текущие токены",
      EstimatedToken: "Оценочные токены",
      Unknown: "Неизвестно",
    },
    StartSpeak: "Начать Говорить",
    StopSpeak: "Остановить Говорить",
    Config: {
      Reset: "Очистить память",
      SaveAs: "Сохранить как маску",
    },
    IsContext: "Предустановленные подсказки",
    ShortcutKey: {
      Title: "Горячие Клавиши",
      newChat: "Открыть новый чат",
      focusInput: "Фокус на поле ввода",
      copyLastMessage: "Копировать последний ответ",
      copyLastCode: "Копировать последний блок кода",
      showShortcutKey: "Показать горячие клавиши",
      clearContext: "Очистить контекст",
    },
    Thinking: {
      Title: "Глубина Мышления",
      Dynamic: "Динамическое Мышление",
      DynamicDesc: "Модель автоматически определяет глубину мышления",
      Off: "Мышление Отключено",
      OffDesc: "Нет процесса мышления",
      Light: "Легкое Мышление",
      LightDesc: "1024 токена",
      Medium: "Среднее Мышление",
      MediumDesc: "4096 токенов",
      Deep: "Глубокое Мышление",
      DeepDesc: "8192 токенов",
      VeryDeep: "Очень Глубокое Мышление",
      VeryDeepDesc: "16384 токенов",
      Notice:
        "Только модели, поддерживающие thinkingBudget, могут регулировать глубину мышления",
      ClaudeNotice:
        "Только модели серии Claude могут регулировать глубину мышления",
      GeminiNotice:
        "Только модели серии Gemini могут регулировать глубину мышления",
      ClaudeLight: "Думать",
      ClaudeLightDesc: "5000 токенов",
      ClaudeMedium: "Думать Серьезно",
      ClaudeMediumDesc: "10000 токенов",
      ClaudeDeep: "Думать Более Серьезно",
      ClaudeDeepDesc: "20000 токенов",
      ClaudeVeryDeep: "Ультра Мышление",
      ClaudeVeryDeepDesc: "32000 токенов",
      ClaudeDynamicDesc:
        "Автоматически регулировать глубину мышления (по умолчанию 10000 токенов)",
    },
  },
  Export: {
    Title: "Поделиться историей чата",
    Copy: "Копировать все",
    Download: "Скачать файл",
    Share: "Поделиться в ShareGPT",
    MessageFromYou: "Пользователь",
    MessageFromChatGPT: "ChatGPT",
    Format: {
      Title: "Формат экспорта",
      SubTitle: "Можно экспортировать как Markdown текст или PNG изображение",
    },
    IncludeContext: {
      Title: "Включить контекст маски",
      SubTitle: "Показывать ли контекст маски в сообщениях",
    },
    Steps: {
      Select: "Выбрать",
      Preview: "Предпросмотр",
    },
    Image: {
      Toast: "Создание скриншота",
      Modal: "Длительное нажатие или правый клик для сохранения изображения",
    },
    Artifacts: {
      Title: "Печать Страницы",
      Error: "Ошибка Печати",
    },
  },
  Select: {
    Search: "Поиск сообщений",
    All: "Выбрать все",
    Latest: "Последние сообщения",
    Clear: "Очистить выбор",
  },
  Memory: {
    Title: "Историческое резюме",
    EmptyContent: "Содержимое чата слишком короткое, чтобы суммировать",
    Send: "Автоматически сжать историю чата и отправить как контекст",
    Copy: "Копировать резюме",
    Reset: "[не используется]",
    ResetConfirm: "Подтвердить очистку исторического резюме?",
  },
  Home: {
    NewChat: "Новый чат",
    DeleteChat: "Подтвердить удаление выбранного чата?",
    DeleteToast: "Беседа удалена",
    Revert: "Отменить",
  },
  Settings: {
    Title: "Настройки",
    SubTitle: "Все параметры настроек",
    ShowPassword: "Показать Пароль",

    Tab: {
      General: "Общие Настройки",
      Sync: "Облачная Синхронизация",
      Mask: "Маска",
      Prompt: "Подсказка",
      ModelService: "Сервис Модели",
      ModelConfig: "Конфигурация Модели",
      Voice: "Голос",
    },

    Danger: {
      Reset: {
        Title: "Сброс всех настроек",
        SubTitle: "Сброс всех параметров до значений по умолчанию",
        Action: "Сбросить сейчас",
        Confirm: "Подтвердить сброс всех настроек?",
      },
      Clear: {
        Title: "Очистить все данные",
        SubTitle: "Очистить все чаты и данные настроек",
        Action: "Очистить сейчас",
        Confirm: "Подтвердить очистку всех чатов и данных настроек?",
      },
    },
    Lang: {
      Name: "Language", // ВНИМАНИЕ: если вы хотите добавить новый перевод, не переводите это значение, оставьте его как `Language`
      All: "Все языки",
    },
    Avatar: "Аватар",
    FontSize: {
      Title: "Размер шрифта",
      SubTitle: "Размер шрифта в чате",
    },
    FontFamily: {
      Title: "Шрифт чата",
      SubTitle:
        "Шрифт содержимого чата, оставьте пустым для применения глобального шрифта по умолчанию",
      Placeholder: "Название шрифта",
    },
    InjectSystemPrompts: {
      Title: "Вставить системные подсказки",
      SubTitle:
        "Принудительно добавлять системную подсказку, имитирующую ChatGPT, в начале каждого запроса",
    },
    InputTemplate: {
      Title: "Предварительная обработка пользовательского ввода",
      SubTitle:
        "Последнее сообщение пользователя будет подставлено в этот шаблон",
    },

    Update: {
      Version: (x: string) => `Текущая версия: ${x}`,
      IsLatest: "Установлена последняя версия",
      CheckUpdate: "Проверить обновления",
      IsChecking: "Проверка обновлений...",
      FoundUpdate: (x: string) => `Найдено новое обновление: ${x}`,
      GoToUpdate: "Перейти к обновлению",
      Success: "Обновление успешно!",
      Failed: "Обновление не удалось",
    },
    SendKey: "Кнопка отправки",
    Theme: "Тема",
    ColorScheme: {
      Title: "Цветовая схема",
      Options: {
        default: "Синий по умолчанию",
        ocean: "Океанский синий",
        forest: "Лесной зеленый",
        sunset: "Закатный оранжевый",
        purple: "Фиолетовая мечта",
        rose: "Розовый",
      },
    },
    TightBorder: "Режим без границ",
    SendPreviewBubble: {
      Title: "Предварительный просмотр пузырьков",
      SubTitle:
        "Просмотр содержимого Markdown в пузырьках предварительного просмотра",
    },
    AutoGenerateTitle: {
      Title: "Автоматическое создание заголовка",
      SubTitle: "Создание подходящего заголовка на основе содержания беседы",
    },
    Sync: {
      CloudState: "Облачные данные",
      NotSyncYet: "Синхронизация еще не проводилась",
      Success: "Синхронизация успешна",
      Fail: "Не удалось синхронизировать",

      Config: {
        Modal: {
          Title: "Настройки облачной синхронизации",
          Check: "Проверить доступность",
        },
        SyncType: {
          Title: "Тип синхронизации",
          SubTitle: "Выберите предпочитаемый сервер синхронизации",
        },
        Proxy: {
          Title: "Включить прокси",
          SubTitle:
            "При синхронизации в браузере необходимо включить прокси для предотвращения ограничений кросс-домена",
        },
        ProxyUrl: {
          Title: "Адрес прокси",
          SubTitle: "Только для встроенного прокси в проекте",
        },

        WebDav: {
          Endpoint: "WebDAV адрес",
          UserName: "Имя пользователя",
          Password: "Пароль",
        },

        UpStash: {
          Endpoint: "UpStash Redis REST Url",
          UserName: "Имя резервной копии",
          Password: "UpStash Redis REST Token",
        },
      },

      LocalState: "Локальные данные",
      Overview: (overview: any) => {
        return `${overview.chat} бесед, ${overview.message} сообщений, ${overview.prompt} подсказок, ${overview.mask} масок`;
      },
      ImportFailed: "Не удалось импортировать",
    },
    Mask: {
      ModelIcon: {
        Title: "Использовать Иконку Модели как Аватар ИИ",
        SubTitle:
          "Когда включено, аватар ИИ в чатах будет использовать иконку текущей модели вместо эмодзи",
      },
    },
    AccessCode: {
      Title: "Код Доступа",
      SubTitle: "Контроль доступа включен, пожалуйста, введите код доступа",
      Placeholder: "Введите код доступа",
      Status: {
        Enabled: "Контроль доступа включен",
        Valid: "Код доступа действителен",
        Invalid: "Код доступа недействителен",
      },
    },
    Prompt: {
      Disable: {
        Title: "Отключить автозаполнение подсказок",
        SubTitle: "Введите / в начале строки для активации автозаполнения",
      },
      List: "Список пользовательских подсказок",
      ListCount: (builtin: number, custom: number) =>
        `Встроенные ${builtin}, пользовательские ${custom}`,
      Edit: "Редактировать",
      Modal: {
        Title: "Список подсказок",
        Add: "Создать",
        Search: "Поиск подсказок",
      },
      EditModal: {
        Title: "Редактировать подсказки",
      },
    },
    HistoryCount: {
      Title: "Количество истории сообщений",
      SubTitle: "Количество историй сообщений, отправляемых с каждым запросом",
    },
    CompressThreshold: {
      Title: "Порог сжатия длины истории сообщений",
      SubTitle:
        "Когда не сжатая история сообщений превышает это значение, происходит сжатие",
    },

    Access: {
      SaasStart: {
        Title: "",
        Label: "",
        SubTitle: "",
        ChatNow: "",
      },
      AccessCode: {
        Title: "Пароль доступа",
        SubTitle: "Администратор включил защиту паролем",
        Placeholder: "Введите пароль доступа",
      },
      CustomEndpoint: {
        Title: "Пользовательский интерфейс",
        SubTitle: "Использовать ли пользовательский Azure или OpenAI сервис",
      },
      Provider: {
        Title: "Провайдер модели",
        SubTitle: "Переключиться на другого провайдера",
        Name: {
          ByteDance: "ByteDance",
          Alibaba: "Alibaba Cloud",
          Moonshot: "Moonshot",
        },
        Status: {
          Enabled: "Включено",
        },
        Models: {
          Title: "Активированные Модели",
          SubTitle: "Список активированных моделей у текущего провайдера",
          NoModels: "Нет активированных моделей",
          Manage: "Управлять",
        },
        Description: {
          OpenAI: "Модели серии OpenAI GPT",
          Azure: "Сервис Microsoft Azure OpenAI",
          Google: "Модели серии Google Gemini",
          Anthropic: "Модели серии Anthropic Claude",
          ByteDance: "Модели серии ByteDance Doubao",
          Alibaba: "Модели серии Alibaba Cloud Qwen",
          Moonshot: "Модели серии Moonshot Kimi",
          DeepSeek: "Модели серии DeepSeek",
          XAI: "Модели серии xAI Grok",
          SiliconFlow: "SiliconFlow",
          Custom: "Пользовательский",
        },
        Terms: {
          Provider: "Провайдер",
        },
      },
      OpenAI: {
        ApiKey: {
          Title: "API-ключ OpenAI",
          SubTitle: "Использовать пользовательский OpenAI-ключ",
          Placeholder: "sk-xxx",
        },

        Endpoint: {
          Title: "Endpoint OpenAI",
          SubTitle:
            "Должен начинаться с http(s):// или использовать /api/openAI как по умолчанию",
        },
      },
      Azure: {
        ApiKey: {
          Title: "API-ключ Azure",
          SubTitle: "Проверьте ваш API-ключ в консоли Azure",
          Placeholder: "API-ключ Azure",
        },

        Endpoint: {
          Title: "Endpoint Azure",
          SubTitle: "Пример: ",
        },

        ApiVerion: {
          Title: "Версия API Azure",
          SubTitle: "Проверьте вашу версию API в консоли Azure",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "API-ключ Anthropic",
          SubTitle:
            "Использовать пользовательский Anthropic-ключ для обхода ограничений доступа",
          Placeholder: "API-ключ Anthropic",
        },

        Endpoint: {
          Title: "Адрес интерфейса",
          SubTitle: "Пример: ",
        },

        ApiVerion: {
          Title: "Версия API (версия API Claude)",
          SubTitle: "Выберите и введите конкретную версию API",
        },
      },
      Google: {
        ApiKey: {
          Title: "API-ключ",
          SubTitle: "Получите ваш API-ключ Google AI",
          Placeholder: "Введите ваш API-ключ Google AI Studio",
        },

        Endpoint: {
          Title: "Адрес интерфейса",
          SubTitle: "Пример: ",
        },

        ApiVersion: {
          Title: "Версия API (только для gemini-pro)",
          SubTitle: "Выберите конкретную версию API",
        },
        GoogleSafetySettings: {
          Title: "Уровень фильтрации Google",
          SubTitle: "Настроить уровень фильтрации контента",
        },
      },
      Baidu: {
        ApiKey: {
          Title: "API-ключ",
          SubTitle: "Использовать пользовательский API-ключ Baidu",
          Placeholder: "API-ключ Baidu",
        },
        SecretKey: {
          Title: "Секретный ключ",
          SubTitle: "Использовать пользовательский секретный ключ Baidu",
          Placeholder: "Секретный ключ Baidu",
        },
        Endpoint: {
          Title: "Адрес интерфейса",
          SubTitle:
            "Пользовательские адреса не поддерживаются, настройте в .env",
        },
      },
      Tencent: {
        ApiKey: {
          Title: "API-ключ",
          SubTitle: "Использовать пользовательский API-ключ Tencent",
          Placeholder: "API-ключ Tencent",
        },
        SecretKey: {
          Title: "Секретный ключ",
          SubTitle: "Использовать пользовательский секретный ключ Tencent",
          Placeholder: "Секретный ключ Tencent",
        },
        Endpoint: {
          Title: "Адрес интерфейса",
          SubTitle:
            "Пользовательские адреса не поддерживаются, настройте в .env",
        },
      },
      ByteDance: {
        ApiKey: {
          Title: "Ключ интерфейса",
          SubTitle: "Использовать пользовательский API-ключ ByteDance",
          Placeholder: "API-ключ ByteDance",
        },
        Endpoint: {
          Title: "Адрес интерфейса",
          SubTitle: "Пример: ",
        },
      },
      Alibaba: {
        ApiKey: {
          Title: "Ключ интерфейса",
          SubTitle: "Использовать пользовательский API-ключ Alibaba Cloud",
          Placeholder: "API-ключ Alibaba Cloud",
        },
        Endpoint: {
          Title: "Адрес интерфейса",
          SubTitle: "Пример: ",
        },
      },
      Moonshot: {
        ApiKey: {
          Title: "Ключ интерфейса",
          SubTitle: "Использовать пользовательский API-ключ Moonshot",
          Placeholder: "API-ключ Moonshot",
        },
        Endpoint: {
          Title: "Адрес интерфейса",
          SubTitle: "Пример: ",
        },
      },
      DeepSeek: {
        ApiKey: {
          Title: "Ключ интерфейса",
          SubTitle: "Использовать пользовательский API-ключ DeepSeek",
          Placeholder: "API-ключ DeepSeek",
        },
        Endpoint: {
          Title: "Адрес интерфейса",
          SubTitle: "Пример: ",
        },
      },
      XAI: {
        ApiKey: {
          Title: "Ключ интерфейса",
          SubTitle: "Использовать пользовательский API-ключ XAI",
          Placeholder: "API-ключ XAI",
        },
        Endpoint: {
          Title: "Адрес интерфейса",
          SubTitle: "Пример: ",
        },
      },
      SiliconFlow: {
        ApiKey: {
          Title: "Ключ интерфейса",
          SubTitle: "Использовать пользовательский API-ключ SiliconFlow",
          Placeholder: "API-ключ SiliconFlow",
        },
        Endpoint: {
          Title: "Адрес интерфейса",
          SubTitle: "Пример: ",
        },
      },
      ChatGLM: {
        ApiKey: {
          Title: "API-ключ",
          SubTitle: "Использовать пользовательский API-ключ ChatGLM",
          Placeholder: "API-ключ ChatGLM",
        },
        Endpoint: {
          Title: "Адрес интерфейса",
          SubTitle: "Пример: ",
        },
      },
      Iflytek: {
        ApiKey: {
          Title: "ApiKey",
          SubTitle: "Получите ApiKey из консоли iFlytek Spark",
          Placeholder: "ApiKey",
        },
        ApiSecret: {
          Title: "ApiSecret",
          SubTitle: "Получите ApiSecret из консоли iFlytek Spark",
          Placeholder: "ApiSecret",
        },
        Endpoint: {
          Title: "Адрес интерфейса",
          SubTitle: "Пример: ",
        },
      },
      AI302: {
        ApiKey: {
          Title: "Ключ интерфейса",
          SubTitle: "Использовать пользовательский API-ключ 302.AI",
          Placeholder: "API-ключ 302.AI",
        },
        Endpoint: {
          Title: "Адрес интерфейса",
          SubTitle: "Пример: ",
        },
      },
      CustomProvider: {
        Add: {
          Title: "Добавить Пользовательского Провайдера",
          Button: "Добавить Пользовательского Провайдера",
          Description:
            "Добавить пользовательский канал на основе существующих типов провайдеров",
        },
        Modal: {
          Title: "Добавить Пользовательского Провайдера",
          Name: {
            Title: "Название Провайдера",
            Placeholder: "Введите название пользовательского провайдера",
            Required: "Пожалуйста, введите название провайдера",
            Unique:
              "Название провайдера уже существует, пожалуйста, используйте другое название",
          },
          Type: {
            Title: "Тип Провайдера",
            OpenAI: "OpenAI - Сервисы совместимые с API OpenAI",
            Google: "Google - API Google Gemini",
            Anthropic: "Anthropic - API Anthropic Claude",
          },
          ApiKey: {
            Title: "API-ключ",
            Placeholder: "Введите API-ключ",
            Required: "Пожалуйста, введите API-ключ",
          },
          Endpoint: {
            Title: "Пользовательский Endpoint",
            Placeholder:
              "Оставьте пустым для использования endpoint по умолчанию",
            Optional: "(Опционально)",
          },
          Cancel: "Отмена",
          Confirm: "Добавить",
        },
        Config: {
          Type: "Тип Провайдера",
          BasedOn: "На основе",
          ApiKeyDescription: "API-ключ пользовательского провайдера",
          EndpointDescription:
            "Адрес endpoint API пользовательского провайдера",
          EndpointPlaceholder: "Адрес endpoint API",
          Delete: {
            Title: "Удалить Провайдера",
            SubTitle:
              "Удалить этого пользовательского провайдера и все его настройки",
            Button: "Удалить",
            Confirm:
              "Вы уверены, что хотите удалить пользовательского провайдера",
            ConfirmSuffix: "?",
          },
        },
      },
    },

    Model: "Модель",
    CompressModel: {
      Title: "Модель сжатия",
      SubTitle: "Модель, используемая для сжатия истории",
    },
    Temperature: {
      Title: "Случайность (temperature)",
      SubTitle: "Чем больше значение, тем более случайные ответы",
    },
    TopP: {
      Title: "Ядро выборки (top_p)",
      SubTitle: "Похожие на случайность, но не изменяйте вместе с случайностью",
    },
    MaxTokens: {
      Title: "Ограничение на количество токенов за один раз (max_tokens)",
      SubTitle: "Максимальное количество токенов на одно взаимодействие",
    },
    PresencePenalty: {
      Title: "Наказание за новизну тем (presence_penalty)",
      SubTitle:
        "Чем больше значение, тем выше вероятность расширения на новые темы",
    },
    FrequencyPenalty: {
      Title: "Наказание за частоту (frequency_penalty)",
      SubTitle:
        "Чем больше значение, тем выше вероятность уменьшения повторяющихся слов",
    },
    TTS: {
      Enable: {
        Title: "Включить TTS",
        SubTitle: "Включить службу преобразования текста в речь",
      },
      Autoplay: {
        Title: "Включить Автовоспроизведение",
        SubTitle:
          "Автоматически генерировать и воспроизводить речь, сначала нужно включить переключатель преобразования текста в речь",
      },
      Model: "Модель",
      Engine: "Движок Преобразования",
      EngineConfig: {
        Title: "Примечание о Настройке",
        SubTitle:
          "OpenAI-TTS будет использовать конфигурацию провайдера OpenAI в сервисах модели. Пожалуйста, добавьте соответствующий API-ключ в провайдере OpenAI перед использованием",
      },
      Voice: {
        Title: "Голос",
        SubTitle: "Голос, который будет использоваться при генерации аудио",
      },
      Speed: {
        Title: "Скорость",
        SubTitle: "Скорость сгенерированного аудио",
      },
    },
    Realtime: {
      Enable: {
        Title: "Чат в Реальном Времени",
        SubTitle: "Включить функцию чата в реальном времени",
      },
      Provider: {
        Title: "Провайдер Модели",
        SubTitle: "Переключаться между различными провайдерами",
      },
      Model: {
        Title: "Модель",
        SubTitle: "Выберите модель",
      },
      ApiKey: {
        Title: "API-ключ",
        SubTitle: "API-ключ",
        Placeholder: "API-ключ",
      },
      Azure: {
        Endpoint: {
          Title: "Endpoint",
          SubTitle: "Endpoint",
        },
        Deployment: {
          Title: "Имя Развертывания",
          SubTitle: "Имя Развертывания",
        },
      },
      Temperature: {
        Title: "Случайность (temperature)",
        SubTitle: "Более высокие значения приводят к более случайным ответам",
      },
    },
  },
  Store: {
    DefaultTopic: "Новый чат",
    BotHello: "Чем могу помочь?",
    Error: "Произошла ошибка, попробуйте позже",
    Prompt: {
      History: (content: string) =>
        "Это резюме истории чата как предыстория: " + content,
      Topic:
        "Укажите краткую тему этого сообщения в четырех-пяти словах, без объяснений, знаков препинания, междометий, лишнего текста или выделения. Если темы нет, просто напишите 'Болтовня'",
      Summarize:
        "Кратко подведите итоги содержимого беседы для использования в качестве последующего контекстного запроса, не более 200 слов",
    },
  },
  Copy: {
    Success: "Скопировано в буфер обмена",
    Failed: "Не удалось скопировать, предоставьте доступ к буферу обмена",
  },
  Download: {
    Success: "Содержимое успешно загружено в вашу директорию.",
    Failed: "Не удалось загрузить.",
  },
  Context: {
    Toast: (x: any) => `Содержит ${x} предустановленных подсказок`,
    Edit: "Текущие настройки чата",
    Add: "Добавить новый чат",
    Clear: "Контекст очищен",
    Revert: "Восстановить контекст",
  },

  ChatSettings: {
    Name: "Настройки Чата",
  },
  Mcp: {
    Name: "MCP",
  },
  FineTuned: {
    Sysmessage: "Вы - помощник",
  },
  SearchChat: {
    Name: "Поиск",
    Page: {
      Title: "Поиск в истории чатов",
      Search: "Введите ключевые слова для поиска",
      NoResult: "Результатов не найдено",
      NoData: "Нет данных",
      Loading: "Загрузка",

      SubTitle: (count: number) => `Найдено ${count} результатов`,
    },
    Item: {
      View: "Просмотр",
    },
  },
  Mask: {
    Name: "Маска",
    DefaultName: "Маска по умолчанию",
    Management: "Управление Масками",
    NewMask: "Новая Маска",
    DefaultModel: "Модель по умолчанию",
    DefaultModelDesc: "Модель по умолчанию для новых разговоров",
    UseGlobalModel: "Использовать глобальную модель по умолчанию",
    ConversationCount: (count: number) =>
      `${count} разговор${count !== 1 ? "ов" : ""}`,
    Page: {
      Title: "Предустановленные ролевые маски",
      SubTitle: (count: number) =>
        `${count} предустановленных ролевых определений`,
      Search: "Поиск ролевых масок",
      Create: "Создать",
    },
    Item: {
      Info: (count: number) => `${count} предустановленных подсказок включено`,
      Chat: "Чат",
      View: "Просмотреть",
      Edit: "Редактировать",
      Delete: "Удалить",
      DeleteConfirm: "Подтвердить удаление?",
    },
    EditModal: {
      Title: "Редактировать предустановленную маску",
      Download: "Скачать предустановку",
      Clone: "Клонировать предустановку",
    },
    Config: {
      Avatar: "Аватар роли",
      Name: "Название роли",
      Sync: {
        Title: "Использовать глобальные настройки",
        SubTitle: "Использовать глобальные настройки в этом чате",
        Confirm: "Подтвердить замену пользовательских настроек глобальными?",
      },
      HideContext: {
        Title: "Скрыть контекстные подсказки",
        SubTitle: "Не показывать контекстные подсказки в чате",
      },
      Artifacts: {
        Title: "Включить артефакты",
        SubTitle: "При включении позволяет напрямую отображать HTML-страницы",
      },
      CodeFold: {
        Title: "Включить сворачивание кода",
        SubTitle:
          "При включении длинные блоки кода могут автоматически сворачиваться/разворачиваться",
      },
      Share: {
        Title: "Поделиться этой маской",
        SubTitle: "Создать ссылку на эту маску",
        Action: "Копировать ссылку",
      },
    },
  },
  NewChat: {
    Return: "Вернуться",
    Skip: "Начать сразу",
    Title: "Выберите маску",
    SubTitle: "Поговорите с душой за маской",
    More: "Найти больше",
    Less: "Свернуть код",
    ShowCode: "Показать код",
    Preview: "Предпросмотр",
    NotShow: "Больше не показывать",
    ConfirmNoShow:
      "Подтвердить отключение? После отключения вы всегда сможете включить его снова в настройках.",
    Searching: "Поиск...",
    Search: "Поиск",
    NoSearch: "Результатов поиска нет",
    SearchFormat: (SearchTime?: number) =>
      SearchTime !== undefined
        ? `(Поиск занял ${Math.round(SearchTime / 1000)} секунд)`
        : "",
    Thinking: "Размышление...",
    Think: "Содержание размышления",
    NoThink: "Нет содержания размышления",
    ThinkFormat: (thinkingTime?: number) =>
      thinkingTime !== undefined
        ? `(Размышление заняло ${Math.round(thinkingTime / 1000)} секунд)`
        : "",
  },

  URLCommand: {
    Code: "Обнаружен код доступа в ссылке, автоматически заполнить?",
    Settings:
      "Обнаружены предустановленные настройки в ссылке, автоматически заполнить?",
  },

  UI: {
    Confirm: "Подтвердить",
    Cancel: "Отмена",
    Close: "Закрыть",
    Create: "Создать",
    Edit: "Редактировать",
    Export: "Экспортировать",
    Import: "Импортировать",
    Sync: "Синхронизировать",
    Config: "Настройки",
  },
  Exporter: {
    Description: {
      Title: "Только сообщения после очистки контекста будут отображаться",
    },
    Model: "Модель",
    Messages: "Сообщения",
    Topic: "Тема",
    Time: "Время",
  },
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type LocaleType = typeof ru;
export type PartialLocaleType = DeepPartial<typeof ru>;

export default ru;
