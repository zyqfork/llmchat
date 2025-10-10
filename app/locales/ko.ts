import { getClientConfig } from "../config/client";
import { SubmitKey } from "../store/config";
import { SAAS_CHAT_UTM_URL } from "@/app/constant";

const isApp = !!getClientConfig()?.isApp;

const ko = {
  WIP: "곧 출시 예정...",
  Error: {
    Unauthorized: isApp
      ? `😆 대화 중 문제가 발생했습니다, 걱정하지 마세요:
    \\ 1️⃣ 제로 구성으로 시작하고 싶다면, [여기를 클릭하여 즉시 대화를 시작하세요 🚀](${SAAS_CHAT_UTM_URL})
    \\ 2️⃣ 자신의 OpenAI 리소스를 사용하고 싶다면, [여기를 클릭하여](/#/settings) 설정을 수정하세요 ⚙️`
      : `😆 대화 중 문제가 발생했습니다, 걱정하지 마세요:
    \ 1️⃣ 제로 구성으로 시작하고 싶다면, [여기를 클릭하여 즉시 대화를 시작하세요 🚀](${SAAS_CHAT_UTM_URL})
    \ 2️⃣ 개인 배포 버전을 사용하고 있다면, [여기를 클릭하여](/#/auth) 접근 키를 입력하세요 🔑
    \ 3️⃣ 자신의 OpenAI 리소스를 사용하고 싶다면, [여기를 클릭하여](/#/settings) 설정을 수정하세요 ⚙️
 `,
  },
  Auth: {
    Return: "돌아가기",
    Title: "비밀번호 필요",
    Tips: "관리자가 비밀번호 인증을 활성화했습니다. 아래에 접근 코드를 입력하십시오.",
    SubTips: "또는 OpenAI 또는 Google API 키를 입력하십시오.",
    Input: "여기에 접근 코드를 입력하십시오.",
    Confirm: "확인",
    Later: "나중에 하기",
    SaasTips: "",
    TopTips: "",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} 개의 대화`,
  },
  Chat: {
    MultiModel: {
      Title: "멀티모델 채팅 설정",
      Enabled: "멀티모델 (활성화)",
      Disabled: "멀티모델 (비활성화)",
      Count: (count: number) => `${count} 모델`,
      Description:
        "🎯 멀티모델 아레나 모드가 활성화되었습니다! 모델 선택기를 클릭하여 대화에 사용할 여러 모델을 선택하세요.",
      OpenSelector: "모델 선택기 열기",
      AlreadySelected: (count: number) => `(${count} 선택됨)`,
      Tips: "💡 팁: 멀티모델 모드에서는 여러 모델을 동시에 선택할 수 있으며, 각 모델이 독립적으로 메시지에 응답하여 서로 다른 모델의 응답을 비교할 수 있습니다.",
      EnableToast:
        "🎯 멀티모델 모드가 활성화되었습니다! 대화 아레나에 사용할 여러 모델을 선택하려면 모델 선택기를 클릭하세요",
      DisableToast: "멀티모델 모드가 비활성화되었습니다",
      MinimumModelsError:
        "멀티모델 대화를 활성화하려면 최소 2개의 모델을 선택하세요",
      ModelsSelectedToast: (count: number) =>
        `${count} 모델이 대화에 선택되었습니다`,
    },
    UI: {
      SidebarToggle: "사이드바 접기/펼치기",
      SearchModels: "모델 검색...",
      SelectModel: "모델 선택",
      ContextTooltip: {
        Current: (current: number, max: number) =>
          `현재 컨텍스트: ${current} / ${max}`,
        CurrentTokens: (current: number, max: number) =>
          `현재 토큰: ${current.toLocaleString()} / ${max.toLocaleString()}`,
        CurrentTokensUnknown: (current: number) =>
          `현재 토큰: ${current.toLocaleString()} / 알 수 없음`,
        EstimatedTokens: (estimated: number) =>
          `예상 토큰: ${estimated.toLocaleString()}`,
        ContextTokens: (tokens: string) => `컨텍스트: ${tokens} 토큰`,
      },
    },
    SubTitle: (count: number) => `총 ${count} 개의 대화`,
    EditMessage: {
      Title: "메시지 기록 편집",
      Topic: {
        Title: "채팅 주제",
        SubTitle: "현재 채팅 주제 변경",
      },
    },
    Actions: {
      ChatList: "메시지 목록 보기",
      CompressedHistory: "압축된 히스토리 프롬프트 보기",
      Export: "채팅 기록 내보내기",
      Copy: "복사",
      Stop: "정지",
      Retry: "다시 시도",
      Pin: "고정",
      PinToastContent: "1 개의 대화를 프롬프트에 고정했습니다.",
      PinToastAction: "보기",
      Delete: "삭제",
      Edit: "편집",
      FullScreen: "전체 화면",
      RefreshTitle: "제목 새로고침",
      RefreshToast: "제목 새로고침 요청이 전송되었습니다",
      Speech: "재생",
      StopSpeech: "정지",
      PreviousVersion: "이전 버전",
      NextVersion: "다음 버전",
      Debug: "디버그",
      CopyAsCurl: "cURL로 복사",
    },
    Commands: {
      new: "새 채팅",
      newm: "어시스턴트에서 새 채팅",
      next: "다음 채팅",
      prev: "이전 채팅",
      clear: "컨텍스트 지우기",
      fork: "채팅 복사",
      del: "채팅 삭제",
    },
    InputActions: {
      Stop: "응답 중지",
      ToBottom: "최신으로 스크롤",
      Theme: {
        auto: "자동 테마",
        light: "라이트 모드",
        dark: "다크 모드",
      },
      Prompt: "빠른 명령",
      Masks: "모든 어시스턴트",
      Clear: "채팅 지우기",
      Reset: "채팅 초기화",
      ResetConfirm: "현재 채팅 창의 전체 내용을 초기화하시겠습니까?",
      Settings: "채팅 설정",
      UploadImage: "이미지 업로드",
      Search: "검색",
      SearchOn: "검색 활성화",
      SearchOff: "검색 비활성화",
      SearchEnabledToast:
        "🔍 검색 기능이 활성화되었습니다! 이제 웹 검색을 할 수 있습니다",
      SearchDisabledToast: "❌ 검색 기능이 비활성화되었습니다",
    },
    MCP: {
      Title: "MCP 도구 제어",
      Enable: "MCP 기능 활성화",
      EnableDesc:
        "활성화되면 MCP 도구를 사용할 수 있습니다. 비활성화되면 MCP 관련 프롬프트가 전송되지 않습니다",
      NoTools: "사용 가능한 MCP 도구가 없습니다",
      Loading: "로딩 중...",
      ClientFailed: "MCP 클라이언트 로드 실패, 자동 처리",
      ToolsCount: (count: number) => `${count} 도구`,
    },
    Rename: "채팅 이름 변경",
    Typing: "입력 중…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} 전송`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "，Shift + Enter 줄 바꿈";
      }
      return inputHints + "，/ 자동 완성，: 명령어 트리거";
    },
    Send: "전송",
    TokenUsage: "사용량",
    TokenTooltip: {
      Context: "현재 컨텍스트",
      CurrentToken: "현재 토큰",
      EstimatedToken: "예상 토큰",
      Unknown: "알 수 없음",
    },
    StartSpeak: "말하기 시작",
    StopSpeak: "말하기 중지",
    Config: {
      Reset: "기본값으로 초기화",
      SaveAs: "어시스턴트로 저장",
    },
    IsContext: "컨텍스트 프롬프트",
    ShortcutKey: {
      Title: "키보드 단축키",
      newChat: "새 채팅 열기",
      focusInput: "입력 필드에 포커스",
      copyLastMessage: "마지막 응답 복사",
      copyLastCode: "마지막 코드 블록 복사",
      showShortcutKey: "단축키 표시",
      clearContext: "컨텍스트 지우기",
    },
    Thinking: {
      Title: "생각의 깊이",
      Dynamic: "동적 사고",
      DynamicDesc: "모델이 생각의 깊이를 자동으로 결정합니다",
      Off: "사고 비활성화",
      OffDesc: "사고 과정 없음",
      Light: "가벼운 사고",
      LightDesc: "1024 토큰",
      Medium: "중간 사고",
      MediumDesc: "4096 토큰",
      Deep: "깊은 사고",
      DeepDesc: "8192 토큰",
      VeryDeep: "매우 깊은 사고",
      VeryDeepDesc: "16384 토큰",
      Notice:
        "thinkingBudget을 지원하는 모델만 생각의 깊이를 조정할 수 있습니다",
      ClaudeNotice: "Claude 시리즈 모델만 생각의 깊이를 조정할 수 있습니다",
      GeminiNotice: "Gemini 시리즈 모델만 생각의 깊이를 조정할 수 있습니다",
      ClaudeLight: "생각",
      ClaudeLightDesc: "5000 토큰",
      ClaudeMedium: "진지하게 생각",
      ClaudeMediumDesc: "10000 토큰",
      ClaudeDeep: "더 진지하게 생각",
      ClaudeDeepDesc: "20000 토큰",
      ClaudeVeryDeep: "초사고",
      ClaudeVeryDeepDesc: "32000 토큰",
      ClaudeDynamicDesc: "생각의 깊이를 자동으로 조정 (기본값 10000 토큰)",
    },
  },
  Export: {
    Title: "채팅 기록 공유",
    Copy: "모두 복사",
    Download: "파일 다운로드",
    Share: "채팅 기록 공유",
    MessageFromYou: "사용자",
    MessageFromChatGPT: "ChatGPT",
    Format: {
      Title: "내보내기 형식",
      SubTitle: "Markdown 텍스트 또는 PNG 이미지로 내보낼 수 있습니다",
    },
    IncludeContext: {
      Title: "어시스턴트 컨텍스트 포함",
      SubTitle: "메시지에 어시스턴트 컨텍스트를 표시할지 여부",
    },
    Steps: {
      Select: "선택",
      Preview: "미리보기",
    },
    Image: {
      Toast: "스크린샷 생성 중",
      Modal: "길게 누르거나 오른쪽 클릭하여 이미지를 저장하십시오",
    },
    Artifacts: {
      Title: "페이지 인쇄",
      Error: "인쇄 오류",
    },
  },
  Select: {
    Search: "메시지 검색",
    All: "모두 선택",
    Latest: "최근 몇 개",
    Clear: "선택 지우기",
  },
  Memory: {
    Title: "기록 요약",
    EmptyContent: "대화 내용이 너무 짧아 요약할 필요 없음",
    Send: "자동으로 채팅 기록을 압축하여 컨텍스트로 전송",
    Copy: "요약 복사",
    Reset: "[사용되지 않음]",
    ResetConfirm: "기록 요약을 지우시겠습니까?",
  },
  Home: {
    NewChat: "새 채팅",
    DeleteChat: "선택한 대화를 삭제하시겠습니까?",
    DeleteToast: "대화가 삭제되었습니다.",
    Revert: "되돌리기",
  },
  Settings: {
    Title: "설정",
    SubTitle: "모든 설정 옵션",
    ShowPassword: "비밀번호 표시",

    Tab: {
      General: "일반 설정",
      Sync: "클라우드 동기화",
      Mask: "어시스턴트",
      Prompt: "프롬프트",
      ModelService: "모델 서비스",
      ModelConfig: "모델 설정",
      Voice: "음성",
    },

    Danger: {
      Reset: {
        Title: "모든 설정 초기화",
        SubTitle: "모든 설정 항목을 기본값으로 초기화",
        Action: "지금 초기화",
        Confirm: "모든 설정을 초기화하시겠습니까?",
      },
      Clear: {
        Title: "모든 데이터 지우기",
        SubTitle: "모든 채팅 및 설정 데이터 지우기",
        Action: "지금 지우기",
        Confirm: "모든 채팅 및 설정 데이터를 지우시겠습니까?",
      },
    },
    Lang: {
      Name: "Language", // 주의: 새 번역을 추가하려면 이 값을 번역하지 말고 그대로 유지하세요.
      All: "모든 언어",
    },
    Avatar: "아바타",
    FontSize: {
      Title: "글꼴 크기",
      SubTitle: "채팅 내용의 글꼴 크기",
    },
    FontFamily: {
      Title: "채팅 글꼴",
      SubTitle: "채팅 내용의 글꼴, 비워 두면 글로벌 기본 글꼴 적용",
      Placeholder: "글꼴 이름",
    },
    InjectSystemPrompts: {
      Title: "시스템 수준 프롬프트 삽입",
      SubTitle:
        "각 요청 메시지 목록의 시작 부분에 ChatGPT 시스템 프롬프트를 강제로 추가",
    },
    InputTemplate: {
      Title: "사용자 입력 전처리",
      SubTitle: "사용자의 최신 메시지가 이 템플릿에 채워집니다.",
    },

    Update: {
      Version: (x: string) => `현재 버전: ${x}`,
      IsLatest: "최신 버전입니다.",
      CheckUpdate: "업데이트 확인",
      IsChecking: "업데이트 확인 중...",
      FoundUpdate: (x: string) => `새 버전 발견: ${x}`,
      GoToUpdate: "업데이트로 이동",
      Success: "업데이트 성공!",
      Failed: "업데이트 실패",
    },
    SendKey: "전송 키",
    Theme: "테마",
    TightBorder: "테두리 없는 모드",
    SendPreviewBubble: {
      Title: "미리보기 버블",
      SubTitle: "미리보기 버블에서 Markdown 콘텐츠 미리보기",
    },
    AutoGenerateTitle: {
      Title: "제목 자동 생성",
      SubTitle: "대화 내용에 따라 적절한 제목 생성",
    },
    Sync: {
      CloudState: "클라우드 데이터",
      NotSyncYet: "아직 동기화되지 않았습니다.",
      Success: "동기화 성공",
      Fail: "동기화 실패",

      Config: {
        Modal: {
          Title: "클라우드 동기화 구성",
          Check: "가용성 확인",
        },
        SyncType: {
          Title: "동기화 유형",
          SubTitle: "선호하는 동기화 서버 선택",
        },
        Proxy: {
          Title: "프록시 활성화",
          SubTitle:
            "브라우저에서 동기화할 때 프록시를 활성화하여 교차 출처 제한을 피해야 함",
        },
        ProxyUrl: {
          Title: "프록시 주소",
          SubTitle: "이 프로젝트에서 제공하는 교차 출처 프록시만 해당",
        },

        WebDav: {
          Endpoint: "WebDAV 주소",
          UserName: "사용자 이름",
          Password: "비밀번호",
        },

        UpStash: {
          Endpoint: "UpStash Redis REST URL",
          UserName: "백업 이름",
          Password: "UpStash Redis REST Token",
        },
      },

      LocalState: "로컬 데이터",
      Overview: (overview: any) => {
        return `${overview.chat} 회의 대화, ${overview.message} 개의 메시지, ${overview.prompt} 개의 프롬프트, ${overview.mask} 개의 마스크`;
      },
      ImportFailed: "가져오기 실패",
    },
    Mask: {
      ModelIcon: {
        Title: "모델 아이콘을 AI 아바타로 사용",
        SubTitle:
          "활성화되면 대화의 AI 아바타가 현재 모델 아이콘을 사용하며 이모티콘 대신 사용됩니다",
      },
    },
    AccessCode: {
      Title: "접근 코드",
      SubTitle: "접근 제어가 활성화되었습니다, 접근 코드를 입력하세요",
      Placeholder: "접근 코드 입력",
      Status: {
        Enabled: "접근 제어 활성화됨",
        Valid: "접근 코드 유효함",
        Invalid: "접근 코드 무효함",
      },
    },
    Prompt: {
      Disable: {
        Title: "프롬프트 자동 완성 비활성화",
        SubTitle: "입력 상자 시작 부분에 / 를 입력하여 자동 완성 활성화",
      },
      List: "사용자 정의 프롬프트 목록",
      ListCount: (builtin: number, custom: number) =>
        `내장 ${builtin} 개, 사용자 정의 ${custom} 개`,
      Edit: "편집",
      Modal: {
        Title: "프롬프트 목록",
        Add: "새로 만들기",
        Search: "프롬프트 검색",
      },
      EditModal: {
        Title: "프롬프트 편집",
      },
    },
    HistoryCount: {
      Title: "히스토리 메시지 수",
      SubTitle: "각 요청에 포함된 히스토리 메시지 수",
    },
    CompressThreshold: {
      Title: "히스토리 메시지 길이 압축 임계값",
      SubTitle: "압축되지 않은 히스토리 메시지가 이 값을 초과하면 압축 수행",
    },

    Access: {
      SaasStart: {
        Title: "",
        Label: "",
        SubTitle: "",
        ChatNow: "",
      },
      AccessCode: {
        Title: "접근 비밀번호",
        SubTitle: "관리자가 암호화된 접근을 활성화했습니다.",
        Placeholder: "접근 비밀번호를 입력하십시오.",
      },
      CustomEndpoint: {
        Title: "커스텀 엔드포인트",
        SubTitle: "커스텀 Azure 또는 OpenAI 서비스를 사용할지 여부",
      },
      Provider: {
        Title: "모델 서비스 제공업체",
        SubTitle: "다른 서비스 제공업체로 전환",
        Name: {
          ByteDance: "ByteDance",
          Alibaba: "Alibaba Cloud",
          Moonshot: "Moonshot",
        },
        Status: {
          Enabled: "활성화됨",
        },
        Models: {
          Title: "활성화된 모델",
          SubTitle: "현재 제공업체에서 활성화된 모델 목록",
          NoModels: "활성화된 모델이 없습니다",
          Manage: "관리",
        },
        Description: {
          OpenAI: "OpenAI GPT 시리즈 모델",
          Azure: "Microsoft Azure OpenAI 서비스",
          Google: "Google Gemini 시리즈 모델",
          Anthropic: "Anthropic Claude 시리즈 모델",
          ByteDance: "ByteDance Doubao 시리즈 모델",
          Alibaba: "Alibaba Cloud Qwen 시리즈 모델",
          Moonshot: "Moonshot Kimi 시리즈 모델",
          DeepSeek: "DeepSeek 시리즈 모델",
          XAI: "xAI Grok 시리즈 모델",
          SiliconFlow: "SiliconFlow",
          Custom: "커스텀",
        },
        Terms: {
          Provider: "제공업체",
        },
      },
      OpenAI: {
        ApiKey: {
          Title: "OpenAI API 키",
          SubTitle: "커스텀 OpenAI 키 사용",
          Placeholder: "sk-xxx",
        },

        Endpoint: {
          Title: "OpenAI 엔드포인트",
          SubTitle: "http(s)://로 시작해야 하거나 기본값으로 /api/openai 사용",
        },
      },
      Azure: {
        ApiKey: {
          Title: "Azure API 키",
          SubTitle: "Azure 콘솔에서 API 키를 확인하세요",
          Placeholder: "Azure API 키",
        },

        Endpoint: {
          Title: "Azure 엔드포인트",
          SubTitle: "예: ",
        },

        ApiVerion: {
          Title: "Azure API 버전",
          SubTitle: "Azure 콘솔에서 API 버전을 확인하세요",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "Anthropic API 키",
          SubTitle: "커스텀 Anthropic 키를 사용하여 비밀번호 접근 제한 우회",
          Placeholder: "Anthropic API 키",
        },

        Endpoint: {
          Title: "엔드포인트 주소",
          SubTitle: "예: ",
        },

        ApiVerion: {
          Title: "API 버전 (Claude API 버전)",
          SubTitle: "특정 API 버전 선택 및 입력",
        },
      },
      Google: {
        ApiKey: {
          Title: "API 키",
          SubTitle: "Google AI에서 API 키를 가져오세요.",
          Placeholder: "Google AI Studio API 키 입력",
        },

        Endpoint: {
          Title: "엔드포인트 주소",
          SubTitle: "예: ",
        },

        ApiVersion: {
          Title: "API 버전 (gemini-pro 전용)",
          SubTitle: "특정 API 버전 선택",
        },
        GoogleSafetySettings: {
          Title: "Google 안전 필터링 수준",
          SubTitle: "콘텐츠 필터링 수준 설정",
        },
      },
      Baidu: {
        ApiKey: {
          Title: "API 키",
          SubTitle: "커스텀 Baidu API 키 사용",
          Placeholder: "Baidu API 키",
        },
        SecretKey: {
          Title: "비밀 키",
          SubTitle: "커스텀 Baidu 비밀 키 사용",
          Placeholder: "Baidu 비밀 키",
        },
        Endpoint: {
          Title: "엔드포인트 주소",
          SubTitle: "커스텀 주소는 .env에서 구성을 지원하지 않습니다",
        },
      },
      Tencent: {
        ApiKey: {
          Title: "API 키",
          SubTitle: "커스텀 Tencent API 키 사용",
          Placeholder: "Tencent API 키",
        },
        SecretKey: {
          Title: "비밀 키",
          SubTitle: "커스텀 Tencent 비밀 키 사용",
          Placeholder: "Tencent 비밀 키",
        },
        Endpoint: {
          Title: "엔드포인트 주소",
          SubTitle: "커스텀 주소는 .env에서 구성을 지원하지 않습니다",
        },
      },
      ByteDance: {
        ApiKey: {
          Title: "인터페이스 키",
          SubTitle: "커스텀 ByteDance API 키 사용",
          Placeholder: "ByteDance API 키",
        },
        Endpoint: {
          Title: "엔드포인트 주소",
          SubTitle: "예: ",
        },
      },
      Alibaba: {
        ApiKey: {
          Title: "인터페이스 키",
          SubTitle: "커스텀 Alibaba Cloud API 키 사용",
          Placeholder: "Alibaba Cloud API 키",
        },
        Endpoint: {
          Title: "엔드포인트 주소",
          SubTitle: "예: ",
        },
      },
      Moonshot: {
        ApiKey: {
          Title: "인터페이스 키",
          SubTitle: "커스텀 Moonshot API 키 사용",
          Placeholder: "Moonshot API 키",
        },
        Endpoint: {
          Title: "엔드포인트 주소",
          SubTitle: "예: ",
        },
      },
      DeepSeek: {
        ApiKey: {
          Title: "인터페이스 키",
          SubTitle: "커스텀 DeepSeek API 키 사용",
          Placeholder: "DeepSeek API 키",
        },
        Endpoint: {
          Title: "엔드포인트 주소",
          SubTitle: "예: ",
        },
      },
      XAI: {
        ApiKey: {
          Title: "인터페이스 키",
          SubTitle: "커스텀 XAI API 키 사용",
          Placeholder: "XAI API 키",
        },
        Endpoint: {
          Title: "엔드포인트 주소",
          SubTitle: "예: ",
        },
      },
      SiliconFlow: {
        ApiKey: {
          Title: "인터페이스 키",
          SubTitle: "커스텀 SiliconFlow API 키 사용",
          Placeholder: "SiliconFlow API 키",
        },
        Endpoint: {
          Title: "엔드포인트 주소",
          SubTitle: "예: ",
        },
      },
      ChatGLM: {
        ApiKey: {
          Title: "API 키",
          SubTitle: "커스텀 ChatGLM API 키 사용",
          Placeholder: "ChatGLM API 키",
        },
        Endpoint: {
          Title: "엔드포인트 주소",
          SubTitle: "예: ",
        },
      },
      Iflytek: {
        ApiKey: {
          Title: "ApiKey",
          SubTitle: "iFlytek Spark 콘솔에서 ApiKey 가져오기",
          Placeholder: "ApiKey",
        },
        ApiSecret: {
          Title: "ApiSecret",
          SubTitle: "iFlytek Spark 콘솔에서 ApiSecret 가져오기",
          Placeholder: "ApiSecret",
        },
        Endpoint: {
          Title: "엔드포인트 주소",
          SubTitle: "예: ",
        },
      },
      AI302: {
        ApiKey: {
          Title: "인터페이스 키",
          SubTitle: "커스텀 302.AI API 키 사용",
          Placeholder: "302.AI API 키",
        },
        Endpoint: {
          Title: "엔드포인트 주소",
          SubTitle: "예: ",
        },
      },
      CustomProvider: {
        Add: {
          Title: "커스텀 제공업체 추가",
          Button: "커스텀 제공업체 추가",
          Description: "기존 제공업체 유형을 기반으로 커스텀 채널 추가",
        },
        Modal: {
          Title: "커스텀 제공업체 추가",
          Name: {
            Title: "제공업체 이름",
            Placeholder: "커스텀 제공업체 이름 입력",
            Required: "제공업체 이름을 입력하세요",
            Unique: "제공업체 이름이 이미 존재합니다, 다른 이름을 사용하세요",
          },
          Type: {
            Title: "제공업체 유형",
            OpenAI: "OpenAI - OpenAI API 호환 서비스",
            Google: "Google - Google Gemini API",
            Anthropic: "Anthropic - Anthropic Claude API",
          },
          ApiKey: {
            Title: "API 키",
            Placeholder: "API 키 입력",
            Required: "API 키를 입력하세요",
          },
          Endpoint: {
            Title: "커스텀 엔드포인트",
            Placeholder: "기본 엔드포인트를 사용하려면 비워 두세요",
            Optional: "(선택사항)",
          },
          Cancel: "취소",
          Confirm: "추가",
        },
        Config: {
          Type: "제공업체 유형",
          BasedOn: "기반",
          ApiKeyDescription: "커스텀 제공업체의 API 키",
          EndpointDescription: "커스텀 API 엔드포인트 주소",
          EndpointPlaceholder: "API 엔드포인트 주소",
          Delete: {
            Title: "제공업체 삭제",
            SubTitle: "이 커스텀 제공업체와 모든 설정 삭제",
            Button: "삭제",
            Confirm: "커스텀 제공업체를 삭제하시겠습니까",
            ConfirmSuffix: "?",
          },
        },
      },
    },

    Model: "모델 (model)",
    CompressModel: {
      Title: "압축 모델",
      SubTitle: "기록을 압축하는 데 사용되는 모델",
    },
    Temperature: {
      Title: "무작위성 (temperature)",
      SubTitle: "값이 클수록 응답이 더 무작위적",
    },
    TopP: {
      Title: "탑 P 샘플링 (top_p)",
      SubTitle: "무작위성과 유사하지만, 무작위성과 함께 변경하지 마십시오.",
    },
    MaxTokens: {
      Title: "단일 응답 제한 (max_tokens)",
      SubTitle: "단일 상호작용에 사용되는 최대 토큰 수",
    },
    PresencePenalty: {
      Title: "주제 신선도 (presence_penalty)",
      SubTitle: "값이 클수록 새로운 주제로 확장할 가능성이 높음",
    },
    FrequencyPenalty: {
      Title: "빈도 벌점 (frequency_penalty)",
      SubTitle: "값이 클수록 중복 단어 감소 가능성 높음",
    },
    TTS: {
      Enable: {
        Title: "TTS 활성화",
        SubTitle: "텍스트 음성 변환 서비스 활성화",
      },
      Autoplay: {
        Title: "자동 재생 활성화",
        SubTitle:
          "자동으로 음성을 생성하고 재생하려면 먼저 텍스트 음성 변환 스위치를 활성화해야 합니다",
      },
      Model: "모델",
      Engine: "변환 엔진",
      EngineConfig: {
        Title: "구성 메모",
        SubTitle:
          "OpenAI-TTS는 모델 서비스의 OpenAI 제공업체 구성을 사용합니다. 사용하기 전에 OpenAI 제공업체에 해당 API 키를 추가하세요",
      },
      Voice: {
        Title: "음성",
        SubTitle: "음성 생성 시 사용할 음성",
      },
      Speed: {
        Title: "속도",
        SubTitle: "생성된 음성의 속도",
      },
    },
    Realtime: {
      Enable: {
        Title: "실시간 채팅",
        SubTitle: "실시간 채팅 기능 활성화",
      },
      Provider: {
        Title: "모델 제공업체",
        SubTitle: "다른 제공업체 간 전환",
      },
      Model: {
        Title: "모델",
        SubTitle: "모델 선택",
      },
      ApiKey: {
        Title: "API 키",
        SubTitle: "API 키",
        Placeholder: "API 키",
      },
      Azure: {
        Endpoint: {
          Title: "엔드포인트",
          SubTitle: "엔드포인트",
        },
        Deployment: {
          Title: "배포 이름",
          SubTitle: "배포 이름",
        },
      },
      Temperature: {
        Title: "무작위성 (temperature)",
        SubTitle: "높은 값은 더 무작위한 응답을 생성합니다",
      },
    },
  },
  Store: {
    DefaultTopic: "새 채팅",
    BotHello: "무엇을 도와드릴까요?",
    Error: "오류가 발생했습니다. 나중에 다시 시도해 주세요.",
    Prompt: {
      History: (content: string) => "이것은 이전 채팅 요약입니다: " + content,
      Topic:
        "네 글자에서 다섯 글자로 이 문장의 간략한 주제를 반환하세요. 설명이나 문장 부호, 어미, 불필요한 텍스트, 굵은 글씨는 필요 없습니다. 주제가 없다면 '잡담'이라고만 반환하세요.",
      Summarize:
        "대화 내용을 간략히 요약하여 후속 컨텍스트 프롬프트로 사용하세요. 200자 이내로 작성하세요.",
    },
  },
  Copy: {
    Success: "클립보드에 복사되었습니다.",
    Failed: "복사 실패, 클립보드 권한을 부여해주세요.",
  },
  Download: {
    Success: "내용이 디렉토리에 다운로드되었습니다.",
    Failed: "다운로드 실패.",
  },
  Context: {
    Toast: (x: any) => ` ${x} 개의 프리셋 프롬프트 포함됨`,
    Edit: "현재 대화 설정",
    Add: "대화 추가",
    Clear: "컨텍스트가 지워졌습니다.",
    Revert: "컨텍스트 복원",
  },

  ChatSettings: {
    Name: "채팅 설정",
  },
  Mcp: {
    Name: "MCP",
  },
  FineTuned: {
    Sysmessage: "당신은 보조자입니다.",
  },
  SearchChat: {
    Name: "검색",
    Page: {
      Title: "채팅 기록 검색",
      Search: "검색어 입력",
      NoResult: "결과를 찾을 수 없습니다",
      NoData: "데이터가 없습니다",
      Loading: "로딩 중",

      SubTitle: (count: number) => `${count}개의 결과를 찾았습니다`,
    },
    Item: {
      View: "보기",
    },
  },
  Mask: {
    Name: "어시스턴트",
    DefaultName: "기본 어시스턴트",
    Management: "어시스턴트 관리",
    NewMask: "새 어시스턴트",
    DefaultModel: "기본 모델",
    DefaultModelDesc: "새 대화용 기본 모델",
    UseGlobalModel: "글로벌 기본 모델 사용",
    ConversationCount: (count: number) => `${count} 대화`,
    Page: {
      Title: "프리셋 캐릭터 어시스턴트",
      SubTitle: (count: number) => `${count} 개의 프리셋 캐릭터 정의`,
      Search: "캐릭터 어시스턴트 검색",
      Create: "새로 만들기",
    },
    Item: {
      Info: (count: number) => ` ${count} 개의 프리셋 대화 포함`,
      Chat: "대화",
      View: "보기",
      Edit: "편집",
      Delete: "삭제",
      DeleteConfirm: "삭제를 확인하시겠습니까?",
    },
    EditModal: {
      Title: "프리셋 어시스턴트 편집",
      Download: "프리셋 다운로드",
      Clone: "프리셋 복제",
    },
    Config: {
      Avatar: "캐릭터 아바타",
      Name: "캐릭터 이름",
      Sync: {
        Title: "전역 설정 사용",
        SubTitle: "현재 대화가 전역 모델 설정을 사용하는지 여부",
        Confirm:
          "현재 대화의 사용자 정의 설정이 자동으로 덮어쓰여질 것입니다. 전역 설정을 활성화하시겠습니까?",
      },
      HideContext: {
        Title: "프리셋 대화 숨기기",
        SubTitle: "숨기면 프리셋 대화가 채팅 화면에 나타나지 않습니다.",
      },
      Artifacts: {
        Title: "아티팩트 활성화",
        SubTitle: "활성화되면 HTML 페이지를 직접 렌더링할 수 있습니다",
      },
      CodeFold: {
        Title: "코드 접기 활성화",
        SubTitle: "활성화되면 긴 코드 블록을 자동으로 접기/펼칠 수 있습니다",
      },
      Share: {
        Title: "이 어시스턴트 공유하기",
        SubTitle: "이 어시스턴트의 직접 링크 생성",
        Action: "링크 복사",
      },
    },
  },
  NewChat: {
    Return: "돌아가기",
    Skip: "바로 시작",
    Title: "어시스턴트 선택",
    SubTitle: "지금 시작하여 어시스턴트 뒤의 사고와 교류해보세요.",
    More: "모두 보기",
    Less: "코드 접기",
    ShowCode: "코드 표시",
    Preview: "미리보기",
    NotShow: "다시 보지 않기",
    ConfirmNoShow:
      "비활성화하시겠습니까? 비활성화 후 언제든지 설정에서 다시 활성화할 수 있습니다.",
    Searching: "검색 중...",
    Search: "검색",
    NoSearch: "검색 결과가 없습니다",
    SearchFormat: (SearchTime?: number) =>
      SearchTime !== undefined
        ? `(검색에 ${Math.round(SearchTime / 1000)}초 걸렸습니다)`
        : "",
    Thinking: "생각 중...",
    Think: "생각 내용",
    NoThink: "생각 내용이 없습니다",
    ThinkFormat: (thinkingTime?: number) =>
      thinkingTime !== undefined
        ? `(생각에 ${Math.round(thinkingTime / 1000)}초 걸렸습니다)`
        : "",
  },

  URLCommand: {
    Code: "링크에 액세스 코드가 포함되어 있습니다. 자동으로 입력하시겠습니까?",
    Settings:
      "링크에 프리셋 설정이 포함되어 있습니다. 자동으로 입력하시겠습니까?",
  },

  UI: {
    Confirm: "확인",
    Cancel: "취소",
    Close: "닫기",
    Create: "새로 만들기",
    Edit: "편집",
    Export: "내보내기",
    Import: "가져오기",
    Sync: "동기화",
    Config: "구성",
  },
  Exporter: {
    Description: {
      Title: "컨텍스트가 지워진 후의 메시지만 표시됩니다.",
    },
    Model: "모델",
    Messages: "메시지",
    Topic: "주제",
    Time: "시간",
  },
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type LocaleType = typeof ko;
export type PartialLocaleType = DeepPartial<typeof ko>;

export default ko;
