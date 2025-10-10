import { getClientConfig } from "../config/client";
import { SubmitKey } from "../store/config";
import { SAAS_CHAT_UTM_URL } from "@/app/constant";

const isApp = !!getClientConfig()?.isApp;

const vi = {
  WIP: "Sắp ra mắt...",
  Error: {
    Unauthorized: isApp
      ? `😆 Cuộc trò chuyện gặp một số vấn đề, đừng lo lắng:
    \\ 1️⃣ Nếu bạn muốn bắt đầu mà không cần cấu hình, [nhấp vào đây để bắt đầu trò chuyện ngay lập tức 🚀](${SAAS_CHAT_UTM_URL})
    \\ 2️⃣ Nếu bạn muốn sử dụng tài nguyên OpenAI của riêng mình, hãy nhấp [vào đây](/#/settings) để thay đổi cài đặt ⚙️`
      : `😆 Cuộc trò chuyện gặp một số vấn đề, đừng lo lắng:
    \ 1️⃣ Nếu bạn muốn bắt đầu mà không cần cấu hình, [nhấp vào đây để bắt đầu trò chuyện ngay lập tức 🚀](${SAAS_CHAT_UTM_URL})
    \ 2️⃣ Nếu bạn đang sử dụng phiên bản triển khai riêng, hãy nhấp [vào đây](/#/auth) để nhập khóa truy cập 🔑
    \ 3️⃣ Nếu bạn muốn sử dụng tài nguyên OpenAI của riêng mình, hãy nhấp [vào đây](/#/settings) để thay đổi cài đặt ⚙️
 `,
  },
  Auth: {
    Title: "Cần mật khẩu",
    Tips: "Quản trị viên đã bật xác thực mật khẩu, vui lòng nhập mã truy cập ở dưới",
    SubTips: "Hoặc nhập khóa API OpenAI hoặc Google của bạn",
    Input: "Nhập mã truy cập tại đây",
    Confirm: "Xác nhận",
    Later: "Để sau",
    Return: "Trở lại",
    SaasTips: "Cấu hình quá phức tạp, tôi muốn sử dụng ngay lập tức",
    TopTips:
      "🥳 Ưu đãi ra mắt NextChat AI, mở khóa OpenAI o1, GPT-4o, Claude-3.5 và các mô hình lớn mới nhất ngay bây giờ",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} cuộc trò chuyện`,
  },
  Chat: {
    MultiModel: {
      Title: "Cài đặt Trò chuyện Đa Mô hình",
      Enabled: "Đa Mô hình (Đã bật)",
      Disabled: "Đa Mô hình (Đã tắt)",
      Count: (count: number) => `${count} mô hình`,
      Description:
        "🎯 Đã bật chế độ Đấu trường Đa Mô hình! Nhấp vào bộ chọn mô hình để chọn nhiều mô hình cho cuộc trò chuyện.",
      OpenSelector: "Mở Bộ chọn Mô hình",
      AlreadySelected: (count: number) => `(${count} đã chọn)`,
      Tips: "💡 Mẹo: Trong chế độ đa mô hình, bạn có thể chọn nhiều mô hình cùng lúc và mỗi mô hình sẽ trả lời tin nhắn của bạn một cách độc lập, cho phép bạn so sánh các phản hồi của các mô hình khác nhau.",
      EnableToast:
        "🎯 Đã bật chế độ Đấu trường Đa Mô hình! Nhấp vào bộ chọn mô hình để chọn nhiều mô hình cho đấu trường trò chuyện",
      DisableToast: "Đã tắt chế độ đa mô hình",
      MinimumModelsError:
        "Vui lòng chọn ít nhất hai mô hình để bật trò chuyện đa mô hình",
      ModelsSelectedToast: (count: number) =>
        `${count} mô hình đã được chọn cho cuộc trò chuyện`,
    },
    UI: {
      SidebarToggle: "Thu gọn/mở rộng thanh bên",
      SearchModels: "Tìm kiếm mô hình...",
      SelectModel: "Chọn mô hình",
      ContextTooltip: {
        Current: (current: number, max: number) =>
          `Ngữ cảnh hiện tại: ${current} / ${max}`,
        CurrentTokens: (current: number, max: number) =>
          `Token hiện tại: ${current.toLocaleString()} / ${max.toLocaleString()}`,
        CurrentTokensUnknown: (current: number) =>
          `Token hiện tại: ${current.toLocaleString()} / không xác định`,
        EstimatedTokens: (estimated: number) =>
          `Token ước tính: ${estimated.toLocaleString()}`,
        ContextTokens: (tokens: string) => `Ngữ cảnh: ${tokens} token`,
      },
    },
    SubTitle: (count: number) => `Tổng cộng ${count} cuộc trò chuyện`,
    EditMessage: {
      Title: "Chỉnh sửa ghi chép tin nhắn",
      Topic: {
        Title: "Chủ đề trò chuyện",
        SubTitle: "Thay đổi chủ đề trò chuyện hiện tại",
      },
    },
    Actions: {
      ChatList: "Xem danh sách tin nhắn",
      CompressedHistory: "Xem lịch sử Prompt đã nén",
      Export: "Xuất khẩu ghi chép trò chuyện",
      Copy: "Sao chép",
      Stop: "Dừng lại",
      Retry: "Thử lại",
      Pin: "Ghim",
      PinToastContent: "Đã ghim 1 cuộc trò chuyện vào lời nhắc đã đặt sẵn",
      PinToastAction: "Xem",
      Delete: "Xóa",
      Edit: "Chỉnh sửa",
      FullScreen: "Toàn màn hình",
      RefreshTitle: "Làm mới tiêu đề",
      RefreshToast: "Đã gửi yêu cầu làm mới tiêu đề",
      Speech: "Phát",
      StopSpeech: "Dừng",
      PreviousVersion: "Phiên bản trước",
      NextVersion: "Phiên bản tiếp theo",
      Debug: "Gỡ lỗi",
      CopyAsCurl: "Sao chép dưới dạng cURL",
    },
    Commands: {
      new: "Tạo cuộc trò chuyện mới",
      newm: "Tạo cuộc trò chuyện từ mặt nạ",
      next: "Cuộc trò chuyện tiếp theo",
      prev: "Cuộc trò chuyện trước đó",
      clear: "Xóa ngữ cảnh",
      fork: "Nhân bản cuộc trò chuyện",
      del: "Xóa cuộc trò chuyện",
    },
    InputActions: {
      Stop: "Dừng phản hồi",
      ToBottom: "Cuộn đến tin nhắn mới nhất",
      Theme: {
        auto: "Chủ đề tự động",
        light: "Chế độ sáng",
        dark: "Chế độ tối",
      },
      Prompt: "Lệnh tắt",
      Masks: "Tất cả mặt nạ",
      Clear: "Xóa cuộc trò chuyện",
      Reset: "Đặt lại cuộc trò chuyện",
      ResetConfirm:
        "Bạn có chắc chắn muốn đặt lại toàn bộ nội dung của cửa sổ trò chuyện hiện tại không?",
      Settings: "Cài đặt trò chuyện",
      UploadImage: "Tải lên hình ảnh",
      Search: "Tìm kiếm",
      SearchOn: "Tìm kiếm đã bật",
      SearchOff: "Tìm kiếm đã tắt",
      SearchEnabledToast:
        "🔍 Đã bật tính năng tìm kiếm! Bây giờ bạn có thể tìm kiếm trên web",
      SearchDisabledToast: "❌ Đã tắt tính năng tìm kiếm",
    },
    MCP: {
      Title: "Quản lý Công cụ MCP",
      Enable: "Bật các tính năng MCP",
      EnableDesc:
        "Khi được bật, các công cụ MCP sẽ có sẵn. Khi bị tắt, các yêu cầu liên quan đến MCP sẽ không được gửi",
      NoTools: "Không có công cụ MCP nào có sẵn",
      Loading: "Đang tải...",
      ClientFailed: "Không thể tải máy khách MCP, đang xử lý im lặng",
      ToolsCount: (count: number) => `${count} công cụ`,
    },
    Rename: "Đổi tên cuộc trò chuyện",
    Typing: "Đang nhập…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} gửi`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "，Shift + Enter xuống dòng";
      }
      return inputHints + "，/ để kích hoạt hoàn thành, : để kích hoạt lệnh";
    },
    Send: "Gửi",
    TokenUsage: "Sử dụng",
    TokenTooltip: {
      Context: "Ngữ cảnh hiện tại",
      CurrentToken: "Token hiện tại",
      EstimatedToken: "Token ước tính",
      Unknown: "Không xác định",
    },
    StartSpeak: "Bắt đầu nói",
    StopSpeak: "Dừng nói",
    Config: {
      Reset: "Xóa bộ nhớ",
      SaveAs: "Lưu dưới dạng mặt nạ",
    },
    IsContext: "Lời nhắc đã đặt sẵn",
    ShortcutKey: {
      Title: "Phím tắt",
      newChat: "Mở cuộc trò chuyện mới",
      focusInput: "Tập trung vào trường nhập",
      copyLastMessage: "Sao chép tin nhắn cuối cùng",
      copyLastCode: "Sao chép mã cuối cùng",
      showShortcutKey: "Hiển thị phím tắt",
      clearContext: "Xóa ngữ cảnh",
    },
    Thinking: {
      Title: "Độ sây suy nghĩ",
      Dynamic: "Suy nghĩ động",
      DynamicDesc: "Mô hình tự động điều chỉnh độ sâu suy nghĩ",
      Off: "Tắt suy nghĩ",
      OffDesc: "Không có quá trình suy nghĩ",
      Light: "Suy nghĩ nhẹ",
      LightDesc: "1024 token",
      Medium: "Suy nghĩ trung bình",
      MediumDesc: "4096 token",
      Deep: "Suy nghĩ sâu",
      DeepDesc: "8192 token",
      VeryDeep: "Suy nghĩ rất sâu",
      VeryDeepDesc: "16384 token",
      Notice:
        "Chỉ các mô hình hỗ trợ thinkingBudget mới có thể điều chỉnh độ sâu suy nghĩ",
      ClaudeNotice:
        "Chỉ các mô hình dòng Claude mới có thể điều chỉnh độ sâu suy nghĩ",
      GeminiNotice:
        "Chỉ các mô hình dòng Gemini mới có thể điều chỉnh độ sâu suy nghĩ",
      ClaudeLight: "Suy nghĩ",
      ClaudeLightDesc: "5000 token",
      ClaudeMedium: "Suy nghĩ nghiêm túc",
      ClaudeMediumDesc: "10000 token",
      ClaudeDeep: "Suy nghĩ nghiêm túc hơn",
      ClaudeDeepDesc: "20000 token",
      ClaudeVeryDeep: "Suy nghĩ cực độ",
      ClaudeVeryDeepDesc: "32000 token",
      ClaudeDynamicDesc:
        "Tự động điều chỉnh độ sâu suy nghĩ (mặc định 10000 token)",
    },
  },
  Export: {
    Title: "Chia sẻ ghi chép trò chuyện",
    Copy: "Sao chép tất cả",
    Download: "Tải xuống tệp",
    Share: "Chia sẻ lên ShareGPT",
    MessageFromYou: "Người dùng",
    MessageFromChatGPT: "ChatGPT",
    Format: {
      Title: "Định dạng xuất khẩu",
      SubTitle: "Có thể xuất khẩu dưới dạng văn bản Markdown hoặc hình ảnh PNG",
    },
    IncludeContext: {
      Title: "Bao gồm ngữ cảnh mặt nạ",
      SubTitle: "Có hiển thị ngữ cảnh mặt nạ trong tin nhắn không",
    },
    Steps: {
      Select: "Chọn",
      Preview: "Xem trước",
    },
    Image: {
      Toast: "Đang tạo ảnh chụp màn hình",
      Modal: "Nhấn giữ hoặc nhấp chuột phải để lưu hình ảnh",
    },
    Artifacts: {
      Title: "In trang",
      Error: "Lỗi in",
    },
  },
  Select: {
    Search: "Tìm kiếm tin nhắn",
    All: "Chọn tất cả",
    Latest: "Một vài tin nhắn gần đây",
    Clear: "Xóa lựa chọn",
  },
  Memory: {
    Title: "Tóm tắt lịch sử",
    EmptyContent: "Nội dung trò chuyện quá ngắn, không cần tóm tắt",
    Send: "Tự động nén ghi chép trò chuyện và gửi dưới dạng ngữ cảnh",
    Copy: "Sao chép tóm tắt",
    Reset: "[không sử dụng]",
    ResetConfirm: "Xác nhận xóa tóm tắt lịch sử?",
  },
  Home: {
    NewChat: "Cuộc trò chuyện mới",
    DeleteChat: "Xác nhận xóa cuộc trò chuyện đã chọn?",
    DeleteToast: "Đã xóa cuộc trò chuyện",
    Revert: "Hoàn tác",
  },
  Settings: {
    Title: "Cài đặt",
    SubTitle: "Tất cả các tùy chọn cài đặt",
    ShowPassword: "Hiển thị mật khẩu",

    Tab: {
      General: "Cài đặt Chung",
      Sync: "Đồng bộ Đám mây",
      Mask: "Mặt nạ",
      Prompt: "Lệnh",
      ModelService: "Dịch vụ Mô hình",
      ModelConfig: "Cấu hình Mô hình",
      Voice: "Giọng nói",
    },

    Danger: {
      Reset: {
        Title: "Đặt lại tất cả cài đặt",
        SubTitle: "Đặt lại tất cả các mục cài đặt về giá trị mặc định",
        Action: "Đặt lại ngay",
        Confirm: "Xác nhận đặt lại tất cả cài đặt?",
      },
      Clear: {
        Title: "Xóa tất cả dữ liệu",
        SubTitle: "Xóa tất cả các cuộc trò chuyện và dữ liệu cài đặt",
        Action: "Xóa ngay",
        Confirm: "Xác nhận xóa tất cả cuộc trò chuyện và dữ liệu cài đặt?",
      },
    },
    Lang: {
      Name: "Language", // CHÚ Ý: nếu bạn muốn thêm một bản dịch mới, vui lòng không dịch giá trị này, để nó là `Language`
      All: "Tất cả ngôn ngữ",
    },
    Avatar: "Hình đại diện",
    FontSize: {
      Title: "Kích thước chữ",
      SubTitle: "Kích thước chữ của nội dung trò chuyện",
    },
    FontFamily: {
      Title: "Phông Chữ Trò Chuyện",
      SubTitle:
        "Phông chữ của nội dung trò chuyện, để trống để áp dụng phông chữ mặc định toàn cầu",
      Placeholder: "Tên Phông Chữ",
    },
    InjectSystemPrompts: {
      Title: "Tiêm thông báo hệ thống",
      SubTitle:
        "Buộc thêm một thông báo hệ thống giả ChatGPT vào đầu danh sách tin nhắn mỗi lần yêu cầu",
    },
    InputTemplate: {
      Title: "Xử lý đầu vào của người dùng",
      SubTitle: "Tin nhắn mới nhất của người dùng sẽ được điền vào mẫu này",
    },

    Update: {
      Version: (x: string) => `Phiên bản hiện tại: ${x}`,
      IsLatest: "Đã là phiên bản mới nhất",
      CheckUpdate: "Kiểm tra cập nhật",
      IsChecking: "Đang kiểm tra cập nhật...",
      FoundUpdate: (x: string) => `Tìm thấy phiên bản mới: ${x}`,
      GoToUpdate: "Đi đến cập nhật",
      Success: "Cập nhật thành công!",
      Failed: "Cập nhật thất bại",
    },
    SendKey: "Phím gửi",
    Theme: "Giao diện",
    TightBorder: "Chế độ không viền",
    SendPreviewBubble: {
      Title: "Bong bóng xem trước",
      SubTitle: "Xem nội dung Markdown trong bong bóng xem trước",
    },
    AutoGenerateTitle: {
      Title: "Tự động tạo tiêu đề",
      SubTitle: "Tạo tiêu đề phù hợp dựa trên nội dung cuộc trò chuyện",
    },
    Sync: {
      CloudState: "Dữ liệu đám mây",
      NotSyncYet: "Chưa thực hiện đồng bộ",
      Success: "Đồng bộ thành công",
      Fail: "Đồng bộ thất bại",

      Config: {
        Modal: {
          Title: "Cấu hình đồng bộ đám mây",
          Check: "Kiểm tra khả dụng",
        },
        SyncType: {
          Title: "Loại đồng bộ",
          SubTitle: "Chọn máy chủ đồng bộ ưa thích",
        },
        Proxy: {
          Title: "Kích hoạt proxy",
          SubTitle:
            "Khi đồng bộ qua trình duyệt, cần kích hoạt proxy để tránh hạn chế ngang miền",
        },
        ProxyUrl: {
          Title: "Địa chỉ proxy",
          SubTitle: "Chỉ áp dụng cho proxy ngang miền của dự án này",
        },

        WebDav: {
          Endpoint: "Địa chỉ WebDAV",
          UserName: "Tên người dùng",
          Password: "Mật khẩu",
        },

        UpStash: {
          Endpoint: "URL UpStash Redis REST",
          UserName: "Tên sao lưu",
          Password: "Token UpStash Redis REST",
        },
      },

      LocalState: "Dữ liệu cục bộ",
      Overview: (overview: any) => {
        return `${overview.chat} cuộc trò chuyện, ${overview.message} tin nhắn, ${overview.prompt} lệnh, ${overview.mask} mặt nạ`;
      },
      ImportFailed: "Nhập không thành công",
    },
    Mask: {
      ModelIcon: {
        Title: "Sử dụng biểu tượng mô hình làm hình đại diện AI",
        SubTitle:
          "Khi được bật, hình đại diện AI trong cuộc trò chuyện sẽ sử dụng biểu tượng của mô hình hiện tại thay vì biểu tượng cảm xúc",
      },
    },
    AccessCode: {
      Title: "Mã truy cập",
      SubTitle: "Đã bật kiểm soát truy cập, vui lòng nhập mã truy cập",
      Placeholder: "Nhập mã truy cập",
      Status: {
        Enabled: "Đã bật kiểm soát truy cập",
        Valid: "Mã truy cập hợp lệ",
        Invalid: "Mã truy cập không hợp lệ",
      },
    },
    Prompt: {
      Disable: {
        Title: "Vô hiệu hóa tự động hoàn thành lệnh",
        SubTitle: "Nhập / ở đầu ô nhập để kích hoạt tự động hoàn thành",
      },
      List: "Danh sách lệnh tùy chỉnh",
      ListCount: (builtin: number, custom: number) =>
        `Tích hợp ${builtin} mục, người dùng định nghĩa ${custom} mục`,
      Edit: "Chỉnh sửa",
      Modal: {
        Title: "Danh sách lệnh",
        Add: "Tạo mới",
        Search: "Tìm kiếm lệnh",
      },
      EditModal: {
        Title: "Chỉnh sửa lệnh",
      },
    },
    HistoryCount: {
      Title: "Số tin nhắn lịch sử kèm theo",
      SubTitle: "Số tin nhắn lịch sử kèm theo mỗi yêu cầu",
    },
    CompressThreshold: {
      Title: "Ngưỡng nén tin nhắn lịch sử",
      SubTitle:
        "Khi tin nhắn lịch sử chưa nén vượt quá giá trị này, sẽ thực hiện nén",
    },

    Access: {
      SaasStart: {
        Title: "Sử dụng NextChat AI",
        Label: "(Giải pháp tiết kiệm chi phí nhất)",
        SubTitle:
          "Được NextChat chính thức duy trì, sẵn sàng sử dụng mà không cần cấu hình, hỗ trợ các mô hình lớn mới nhất như OpenAI o1, GPT-4o và Claude-3.5",
        ChatNow: "Chat ngay",
      },
      AccessCode: {
        Title: "Mật khẩu truy cập",
        SubTitle: "Quản trị viên đã bật truy cập mã hóa",
        Placeholder: "Nhập mật khẩu truy cập",
      },
      CustomEndpoint: {
        Title: "Giao diện tùy chỉnh",
        SubTitle: "Có sử dụng dịch vụ Azure hoặc OpenAI tùy chỉnh không",
      },
      Provider: {
        Title: "Nhà cung cấp dịch vụ mô hình",
        SubTitle: "Chuyển đổi giữa các nhà cung cấp khác nhau",
        Name: {
          ByteDance: "ByteDance",
          Alibaba: "Alibaba Cloud",
          Moonshot: "Moonshot",
        },
        Status: {
          Enabled: "Đã bật",
        },
        Models: {
          Title: "Các mô hình đã bật",
          SubTitle: "Danh sách các mô hình đã bật cho nhà cung cấp hiện tại",
          NoModels: "Không có mô hình nào được bật",
          Manage: "Quản lý",
        },
        Description: {
          OpenAI: "Các mô hình dòng OpenAI GPT",
          Azure: "Dịch vụ Microsoft Azure OpenAI",
          Google: "Các mô hình dòng Google Gemini",
          Anthropic: "Các mô hình dòng Anthropic Claude",
          ByteDance: "Các mô hình dòng ByteDance Doubao",
          Alibaba: "Các mô hình dòng Alibaba Cloud Qwen",
          Moonshot: "Các mô hình dòng Moonshot Kimi",
          DeepSeek: "Các mô hình dòng DeepSeek",
          XAI: "Các mô hình dòng xAI Grok",
          SiliconFlow: "SiliconFlow",
          Custom: "Tùy chỉnh",
        },
        Terms: {
          Provider: "Nhà cung cấp",
        },
      },
      OpenAI: {
        ApiKey: {
          Title: "Khóa API",
          SubTitle:
            "Sử dụng khóa OpenAI tùy chỉnh để vượt qua giới hạn truy cập mật khẩu",
          Placeholder: "Khóa API OpenAI",
        },

        Endpoint: {
          Title: "Địa chỉ giao diện",
          SubTitle: "Ngoài địa chỉ mặc định, phải bao gồm http(s)://",
        },
      },
      Azure: {
        ApiKey: {
          Title: "Khóa giao diện",
          SubTitle:
            "Sử dụng khóa Azure tùy chỉnh để vượt qua giới hạn truy cập mật khẩu",
          Placeholder: "Khóa API Azure",
        },

        Endpoint: {
          Title: "Địa chỉ giao diện",
          SubTitle: "Ví dụ:",
        },

        ApiVerion: {
          Title: "Phiên bản giao diện (phiên bản API azure)",
          SubTitle: "Chọn phiên bản phần cụ thể",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "Khóa giao diện",
          SubTitle:
            "Sử dụng khóa Anthropic tùy chỉnh để vượt qua giới hạn truy cập mật khẩu",
          Placeholder: "Khóa API Anthropic",
        },

        Endpoint: {
          Title: "Địa chỉ giao diện",
          SubTitle: "Ví dụ:",
        },

        ApiVerion: {
          Title: "Phiên bản giao diện (phiên bản API claude)",
          SubTitle: "Chọn một phiên bản API cụ thể để nhập",
        },
      },
      Google: {
        ApiKey: {
          Title: "Khóa API",
          SubTitle: "Lấy khóa API từ Google AI",
          Placeholder: "Nhập khóa API Google AI Studio của bạn",
        },

        Endpoint: {
          Title: "Địa chỉ cuối",
          SubTitle: "Ví dụ:",
        },

        ApiVersion: {
          Title: "Phiên bản API (chỉ áp dụng cho gemini-pro)",
          SubTitle: "Chọn một phiên bản API cụ thể",
        },
        GoogleSafetySettings: {
          Title: "Mức độ lọc an toàn Google",
          SubTitle: "Cài đặt mức độ lọc nội dung",
        },
      },
      Baidu: {
        ApiKey: {
          Title: "Khóa API",
          SubTitle: "Sử dụng khóa Baidu API tùy chỉnh",
          Placeholder: "Khóa API Baidu",
        },
        SecretKey: {
          Title: "Khóa bí mật",
          SubTitle: "Sử dụng khóa Baidu Secret tùy chỉnh",
          Placeholder: "Khóa Baidu Secret",
        },
        Endpoint: {
          Title: "Địa chỉ giao diện",
          SubTitle: "Không hỗ trợ tùy chỉnh, chuyển đến .env để cấu hình",
        },
      },
      ByteDance: {
        ApiKey: {
          Title: "Khóa giao diện",
          SubTitle: "Sử dụng khóa ByteDance API tùy chỉnh",
          Placeholder: "Khóa API ByteDance",
        },
        Endpoint: {
          Title: "Địa chỉ giao diện",
          SubTitle: "Ví dụ:",
        },
      },
      Alibaba: {
        ApiKey: {
          Title: "Khóa giao diện",
          SubTitle: "Sử dụng khóa Alibaba Cloud API tùy chỉnh",
          Placeholder: "Khóa API Alibaba Cloud",
        },
        Endpoint: {
          Title: "Địa chỉ giao diện",
          SubTitle: "Ví dụ:",
        },
      },
      Moonshot: {
        ApiKey: {
          Title: "Khóa giao diện",
          SubTitle: "Sử dụng khóa Moonshot API tùy chỉnh",
          Placeholder: "Khóa API Moonshot",
        },
        Endpoint: {
          Title: "Địa chỉ giao diện",
          SubTitle: "Ví dụ:",
        },
      },
      DeepSeek: {
        ApiKey: {
          Title: "Khóa giao diện",
          SubTitle: "Sử dụng khóa DeepSeek API tùy chỉnh",
          Placeholder: "Khóa API DeepSeek",
        },
        Endpoint: {
          Title: "Địa chỉ giao diện",
          SubTitle: "Ví dụ:",
        },
      },
      XAI: {
        ApiKey: {
          Title: "Khóa giao diện",
          SubTitle: "Sử dụng khóa XAI API tùy chỉnh",
          Placeholder: "Khóa API XAI",
        },
        Endpoint: {
          Title: "Địa chỉ giao diện",
          SubTitle: "Ví dụ:",
        },
      },
      SiliconFlow: {
        ApiKey: {
          Title: "Khóa giao diện",
          SubTitle: "Sử dụng khóa SiliconFlow API tùy chỉnh",
          Placeholder: "Khóa API SiliconFlow",
        },
        Endpoint: {
          Title: "Địa chỉ giao diện",
          SubTitle: "Ví dụ:",
        },
      },
      ChatGLM: {
        ApiKey: {
          Title: "Khóa API",
          SubTitle: "Sử dụng khóa ChatGLM API tùy chỉnh",
          Placeholder: "Khóa API ChatGLM",
        },
        Endpoint: {
          Title: "Địa chỉ giao diện",
          SubTitle: "Ví dụ:",
        },
      },
      Iflytek: {
        ApiKey: {
          Title: "ApiKey",
          SubTitle: "Lấy ApiKey từ bảng điều khiển iFlytek Spark",
          Placeholder: "ApiKey",
        },
        ApiSecret: {
          Title: "ApiSecret",
          SubTitle: "Lấy ApiSecret từ bảng điều khiển iFlytek Spark",
          Placeholder: "ApiSecret",
        },
        Endpoint: {
          Title: "Địa chỉ giao diện",
          SubTitle: "Ví dụ:",
        },
      },
      AI302: {
        ApiKey: {
          Title: "Khóa giao diện",
          SubTitle: "Sử dụng khóa 302.AI API tùy chỉnh",
          Placeholder: "Khóa API 302.AI",
        },
        Endpoint: {
          Title: "Địa chỉ giao diện",
          SubTitle: "Ví dụ:",
        },
      },
      CustomProvider: {
        Add: {
          Title: "Thêm Nhà cung cấp Tùy chỉnh",
          Button: "Thêm Nhà cung cấp Tùy chỉnh",
          Description:
            "Thêm kênh tùy chỉnh dựa trên các loại nhà cung cấp hiện có",
        },
        Modal: {
          Title: "Thêm Nhà cung cấp Tùy chỉnh",
          Name: {
            Title: "Tên Nhà cung cấp",
            Placeholder: "Nhập tên nhà cung cấp tùy chỉnh",
            Required: "Vui lòng nhập tên nhà cung cấp",
            Unique: "Tên nhà cung cấp đã tồn tại, vui lòng sử dụng tên khác",
          },
          Type: {
            Title: "Loại Nhà cung cấp",
            OpenAI: "OpenAI - Dịch vụ tương thích với API OpenAI",
            Google: "Google - API Google Gemini",
            Anthropic: "Anthropic - API Anthropic Claude",
          },
          ApiKey: {
            Title: "Khóa API",
            Placeholder: "Nhập khóa API",
            Required: "Vui lòng nhập khóa API",
          },
          Endpoint: {
            Title: "Điểm cuối Tùy chỉnh",
            Placeholder: "Để trống để sử dụng điểm cuối mặc định",
            Optional: "(Tùy chọn)",
          },
          Cancel: "Hủy",
          Confirm: "Thêm",
        },
        Config: {
          Type: "Loại Nhà cung cấp",
          BasedOn: "Dựa trên",
          ApiKeyDescription: "Khóa API cho nhà cung cấp tùy chỉnh",
          EndpointDescription: "Địa chỉ điểm cuối API tùy chỉnh",
          EndpointPlaceholder: "Địa chỉ điểm cuối API",
          Delete: {
            Title: "Xóa Nhà cung cấp",
            SubTitle: "Xóa nhà cung cấp tùy chỉnh này và tất cả cài đặt của nó",
            Button: "Xóa",
            Confirm: "Bạn có chắc chắn muốn xóa nhà cung cấp tùy chỉnh",
            ConfirmSuffix: "?",
          },
        },
      },
    },

    Model: "Mô hình (model)",
    CompressModel: {
      Title: "Mô hình Nén",
      SubTitle: "Mô hình được sử dụng để nén lịch sử",
    },
    Temperature: {
      Title: "Ngẫu nhiên (temperature)",
      SubTitle: "Giá trị càng lớn, câu trả lời càng ngẫu nhiên",
    },
    TopP: {
      Title: "Lấy mẫu hạt nhân (top_p)",
      SubTitle:
        "Tương tự như ngẫu nhiên, nhưng không thay đổi cùng với ngẫu nhiên",
    },
    MaxTokens: {
      Title: "Giới hạn phản hồi (max_tokens)",
      SubTitle: "Số Token tối đa cho mỗi tương tác",
    },
    PresencePenalty: {
      Title: "Độ mới của chủ đề (presence_penalty)",
      SubTitle:
        "Giá trị càng lớn, khả năng mở rộng đến các chủ đề mới càng cao",
    },
    FrequencyPenalty: {
      Title: "Hình phạt tần suất (frequency_penalty)",
      SubTitle: "Giá trị càng lớn, khả năng giảm từ ngữ lặp lại càng cao",
    },
    TTS: {
      Enable: {
        Title: "Bật TTS",
        SubTitle: "Bật dịch vụ chuyển văn bản thành giọng nói",
      },
      Autoplay: {
        Title: "Bật phát tự động",
        SubTitle:
          "Tự động tạo và phát giọng nói, cần bật công tắc chuyển văn bản thành giọng nói trước",
      },
      Model: "Mô hình",
      Engine: "Công cụ chuyển đổi",
      EngineConfig: {
        Title: "Ghi chú cấu hình",
        SubTitle:
          "OpenAI-TTS sẽ sử dụng cấu hình nhà cung cấp OpenAI trong dịch vụ mô hình. Vui lòng thêm khóa API tương ứng vào nhà cung cấp OpenAI trước khi sử dụng",
      },
      Voice: {
        Title: "Giọng nói",
        SubTitle: "Giọng nói được sử dụng khi tạo giọng nói",
      },
      Speed: {
        Title: "Tốc độ",
        SubTitle: "Tốc độ của giọng nói được tạo",
      },
    },
    Realtime: {
      Enable: {
        Title: "Trò chuyện thời gian thực",
        SubTitle: "Bật tính năng trò chuyện thời gian thực",
      },
      Provider: {
        Title: "Nhà cung cấp mô hình",
        SubTitle: "Chuyển đổi giữa các nhà cung cấp khác nhau",
      },
      Model: {
        Title: "Mô hình",
        SubTitle: "Chọn một mô hình",
      },
      ApiKey: {
        Title: "Khóa API",
        SubTitle: "Khóa API",
        Placeholder: "Khóa API",
      },
      Azure: {
        Endpoint: {
          Title: "Điểm cuối",
          SubTitle: "Điểm cuối",
        },
        Deployment: {
          Title: "Tên triển khai",
          SubTitle: "Tên triển khai",
        },
      },
      Temperature: {
        Title: "Ngẫu nhiên (temperature)",
        SubTitle: "Giá trị cao hơn tạo ra phản hồi ngẫu nhiên hơn",
      },
    },
  },
  Store: {
    DefaultTopic: "Chủ đề mặc định",
    BotHello: "Xin chào! Tôi có thể giúp gì cho bạn?",
    Error: "Có lỗi xảy ra, vui lòng thử lại sau",
    Prompt: {
      History: (content: string) =>
        "Đây là tóm tắt lịch sử trò chuyện như một lời nhắc: " + content,
      Topic:
        "Vui lòng tạo một tiêu đề ngắn gọn gồm 4-5 từ cho câu này, không cần giải thích, không dấu câu, không từ cảm thán, không văn bản thừa, không in đậm. Nếu không có chủ đề, vui lòng trả về 'Trò chuyện'",
      Summarize:
        "Tóm tắt ngắn gọn nội dung cuộc trò chuyện để làm lời nhắc ngữ cảnh cho các lần sau, giữ trong vòng 200 từ",
    },
  },
  Copy: {
    Success: "Đã sao chép vào clipboard",
    Failed: "Sao chép thất bại, vui lòng cấp quyền clipboard",
  },
  Download: {
    Success: "Nội dung đã được tải xuống thư mục của bạn.",
    Failed: "Tải xuống thất bại.",
  },
  Context: {
    Toast: (x: any) => `Bao gồm ${x} lời nhắc định sẵn`,
    Edit: "Cài đặt cuộc trò chuyện hiện tại",
    Add: "Thêm một cuộc trò chuyện",
    Clear: "Đã xóa ngữ cảnh",
    Revert: "Khôi phục ngữ cảnh",
  },

  ChatSettings: {
    Name: "Cài đặt Trò chuyện",
  },
  Mcp: {
    Name: "MCP",
  },
  FineTuned: {
    Sysmessage: "Bạn là một trợ lý",
  },
  SearchChat: {
    Name: "Tìm kiếm",
    Page: {
      Title: "Tìm kiếm lịch sử trò chuyện",
      Search: "Nhập từ khóa tìm kiếm",
      NoResult: "Không tìm thấy kết quả",
      NoData: "Không có dữ liệu",
      Loading: "Đang tải",

      SubTitle: (count: number) => `Tìm thấy ${count} kết quả`,
    },
    Item: {
      View: "Xem",
    },
  },
  Mask: {
    Name: "Mặt nạ",
    DefaultName: "Mặt nạ mặc định",
    Management: "Quản lý mặt nạ",
    NewMask: "Mặt nạ mới",
    DefaultModel: "Mô hình mặc định",
    DefaultModelDesc: "Mô hình mặc định cho các cuộc trò chuyện mới",
    UseGlobalModel: "Sử dụng mô hình mặc định toàn cầu",
    ConversationCount: (count: number) =>
      `${count} cuộc trò chuyện${count !== 1 ? "" : ""}`,
    Page: {
      Title: "Mặt nạ vai trò định sẵn",
      SubTitle: (count: number) => `${count} định nghĩa vai trò định sẵn`,
      Search: "Tìm kiếm mặt nạ vai trò",
      Create: "Tạo mới",
    },
    Item: {
      Info: (count: number) => `Bao gồm ${count} cuộc trò chuyện định sẵn`,
      Chat: "Trò chuyện",
      View: "Xem",
      Edit: "Chỉnh sửa",
      Delete: "Xóa",
      DeleteConfirm: "Xác nhận xóa?",
    },
    EditModal: {
      Title: "Chỉnh sửa trợ lý",
      Download: "Tải xuống định sẵn",
      Clone: "Nhân bản định sẵn",
    },
    Config: {
      Avatar: "Hình đại diện vai trò",
      Name: "Tên vai trò",
      Sync: {
        Title: "Sử dụng cài đặt toàn cầu",
        SubTitle:
          "Cuộc trò chuyện hiện tại có sử dụng cài đặt mô hình toàn cầu không",
        Confirm:
          "Các cài đặt tùy chỉnh của cuộc trò chuyện hiện tại sẽ tự động bị ghi đè, bạn có chắc chắn muốn bật cài đặt toàn cầu không?",
      },
      HideContext: {
        Title: "Ẩn lời nhắc ngữ cảnh",
        SubTitle: "Không hiển thị lời nhắc ngữ cảnh trong cuộc trò chuyện",
      },
      Artifacts: {
        Title: "Bật các tác phẩm",
        SubTitle: "Khi được bật, cho phép hiển thị trực tiếp các trang HTML",
      },
      CodeFold: {
        Title: "Bật gấp mã",
        SubTitle: "Khi được bật, các khối mã dài có thể tự động được gấp/mở",
      },
      Share: {
        Title: "Chia sẻ mặt nạ này",
        SubTitle: "Tạo liên kết trực tiếp cho mặt nạ này",
        Action: "Sao chép liên kết",
      },
    },
  },
  NewChat: {
    Return: "Quay lại",
    Skip: "Bắt đầu ngay",
    Title: "Chọn một mặt nạ",
    SubTitle: "Bắt đầu ngay và tương tác với tư duy đằng sau mặt nạ",
    More: "Xem tất cả",
    Less: "Gấp mã",
    ShowCode: "Hiển thị mã",
    Preview: "Xem trước",
    NotShow: "Không hiển thị lại",
    ConfirmNoShow:
      "Bạn có chắc chắn muốn tắt không? Sau khi tắt, bạn có thể bật lại bất cứ lúc nào trong cài đặt.",
    Searching: "Đang tìm kiếm...",
    Search: "Tìm kiếm",
    NoSearch: "Không có kết quả tìm kiếm",
    SearchFormat: (SearchTime?: number) =>
      SearchTime !== undefined
        ? `(Tìm kiếm mất ${Math.round(SearchTime / 1000)} giây)`
        : "",
    Thinking: "Đang suy nghĩ...",
    Think: "Nội dung suy nghĩ",
    NoThink: "Không có nội dung suy nghĩ",
    ThinkFormat: (thinkingTime?: number) =>
      thinkingTime !== undefined
        ? `(Suy nghĩ mất ${Math.round(thinkingTime / 1000)} giây)`
        : "",
  },

  URLCommand: {
    Code: "Phát hiện mã truy cập trong liên kết, có tự động điền không?",
    Settings:
      "Phát hiện cài đặt định sẵn trong liên kết, có tự động điền không?",
  },

  UI: {
    Confirm: "Xác nhận",
    Cancel: "Hủy",
    Close: "Đóng",
    Create: "Tạo mới",
    Edit: "Chỉnh sửa",
    Export: "Xuất",
    Import: "Nhập",
    Sync: "Đồng bộ",
    Config: "Cấu hình",
  },
  Exporter: {
    Description: {
      Title: "Chỉ tin nhắn sau khi xóa ngữ cảnh mới được hiển thị",
    },
    Model: "Mô hình",
    Messages: "Tin nhắn",
    Topic: "Chủ đề",
    Time: "Thời gian",
  },
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type LocaleType = typeof vi;
export type PartialLocaleType = DeepPartial<typeof vi>;

export default vi;
