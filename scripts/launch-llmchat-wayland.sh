#!/bin/bash
# LLMChat Wayland 启动脚本
# 适用于麒麟 V10 等旧版 VAAPI 系统

# 设置环境变量
export ELECTRON_OZONE_PLATFORM_HINT=wayland

# 启动参数
ARGS=(
    --ozone-platform=wayland
    --enable-features=UseOzonePlatform,WaylandWindowDecorations
    --disable-features=VaapiVideoDecoder,Vulkan
    --enable-gpu-rasterization
    --ignore-gpu-blocklist
    --use-gl=egl
    --enable-accelerated-video-decode
)

# 检测 VAAPI 版本
VAAPI_VERSION=$(pkg-config --modversion libva 2>/dev/null || echo "0.0.0")
VAAPI_MAJOR=$(echo $VAAPI_VERSION | cut -d. -f1)
VAAPI_MINOR=$(echo $VAAPI_VERSION | cut -d. -f2)

if [ "$VAAPI_MAJOR" -lt 2 ] || ([ "$VAAPI_MAJOR" -eq 2 ] && [ "$VAAPI_MINOR" -lt 17 ]); then
    echo "检测到旧版 VAAPI ($VAAPI_VERSION)，已禁用 VAAPI 视频解码"
    echo "GPU 加速仍然启用（通过 OpenGL/EGL）"
else
    echo "VAAPI 版本: $VAAPI_VERSION (支持硬件视频解码)"
    # 移除 VaapiVideoDecoder 禁用
    ARGS=("${ARGS[@]/--disable-features=VaapiVideoDecoder,Vulkan/--disable-features=Vulkan}")
fi

# 启动应用
exec "$(dirname "$0")/../llmchat" "${ARGS[@]}" "$@"
