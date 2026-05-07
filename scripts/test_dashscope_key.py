#!/usr/bin/env python3
"""
测试通义千问实时语音识别（WebSocket）是否可用。

依赖：
  pip install websocket-client

最小校验（仅握手 + session.update）：
  python scripts/test_dashscope_key.py --api-key sk-xxx --region beijing

完整校验（推流本地 PCM 并接收实时转写）：
  python scripts/test_dashscope_key.py --api-key sk-xxx --audio-file your_audio_file.pcm

说明：
  - 音频文件需为 PCM16 LE、16kHz、单声道原始流（.pcm）。
  - 如果你只想校验 key + 实时接口可连通，不传 --audio-file 即可。
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import time
from typing import Optional

WS_URLS = {
    "beijing": "wss://dashscope.aliyuncs.com/api-ws/v1/realtime",
    "singapore": "wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime",
}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="测试 DashScope 实时语音 WebSocket 链路")
    parser.add_argument(
        "--api-key",
        default=os.getenv("DASHSCOPE_API_KEY", "").strip(),
        help="DashScope API Key；不传则读取环境变量 DASHSCOPE_API_KEY",
    )
    parser.add_argument(
        "--region",
        choices=("beijing", "singapore"),
        default="beijing",
        help="API Key 所属地域（默认 beijing）",
    )
    parser.add_argument(
        "--model",
        default="qwen3-asr-flash-realtime",
        help="实时 ASR 模型，默认 qwen3-asr-flash-realtime",
    )
    parser.add_argument(
        "--language",
        default="zh",
        help="识别语言（默认 zh）",
    )
    parser.add_argument(
        "--audio-file",
        default="",
        help="可选，本地 PCM 文件路径；不传则仅做握手/会话更新测试",
    )
    parser.add_argument(
        "--use-vad",
        action="store_true",
        default=True,
        help="启用 server_vad（默认开启）",
    )
    parser.add_argument(
        "--no-vad",
        action="store_true",
        help="关闭 VAD，改为手动 commit",
    )
    parser.add_argument(
        "--chunk-bytes",
        type=int,
        default=3200,
        help="单次发送音频字节数，默认 3200（约 100ms@16kHz pcm16）",
    )
    parser.add_argument(
        "--chunk-interval",
        type=float,
        default=0.1,
        help="发送间隔秒数，默认 0.1",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=12.0,
        help="接收超时秒数，默认 12",
    )
    return parser


def _event_id() -> str:
    return f"event_{int(time.time() * 1000)}"


def _send_json(ws, payload: dict) -> None:
    payload["event_id"] = payload.get("event_id") or _event_id()
    ws.send(json.dumps(payload, ensure_ascii=False))


def _recv_until(ws, timeout_sec: float, expected_types: set[str]) -> tuple[bool, Optional[dict]]:
    end_time = time.time() + timeout_sec
    while time.time() < end_time:
        try:
            message = ws.recv()
        except Exception:
            continue
        if not message:
            continue
        try:
            data = json.loads(message)
        except Exception:
            print(f"[WS] 非 JSON 消息: {message!r}")
            continue
        event_type = data.get("type")
        if event_type == "error":
            print("❌ 服务端返回 error:")
            print(json.dumps(data, ensure_ascii=False, indent=2))
            return False, data
        if event_type in expected_types:
            return True, data
        # 打印关键事件便于观察链路
        if event_type in {
            "session.created",
            "conversation.item.input_audio_transcription.text",
            "conversation.item.input_audio_transcription.completed",
            "input_audio_buffer.speech_started",
            "input_audio_buffer.speech_stopped",
        }:
            print(f"[WS] {event_type}: {json.dumps(data, ensure_ascii=False)}")
    return False, None


def test_realtime_asr(args: argparse.Namespace) -> int:
    if not args.api_key:
        print("❌ 未提供 API Key。请传 --api-key 或设置 DASHSCOPE_API_KEY。")
        return 2

    if args.no_vad:
        args.use_vad = False

    try:
        import websocket  # type: ignore
    except Exception:
        print("❌ 缺少依赖 websocket-client，请先安装：")
        print("   pip install websocket-client")
        return 3

    base_ws = WS_URLS[args.region]
    ws_url = f"{base_ws}?model={args.model}"
    print(f"[INFO] 连接: {ws_url}")

    headers = [
        f"Authorization: Bearer {args.api_key}",
        "OpenAI-Beta: realtime=v1",
    ]

    try:
        ws = websocket.create_connection(ws_url, header=headers, timeout=args.timeout)
    except Exception as e:
        print(f"❌ WebSocket 连接失败: {type(e).__name__}: {e}")
        print("提示：请检查 key、region、网络，以及模型是否在该地域可用。")
        return 1

    try:
        # 1) session.update
        turn_detection = (
            {
                "type": "server_vad",
                "threshold": 0.0,
                "silence_duration_ms": 400,
            }
            if args.use_vad
            else None
        )
        session_update = {
            "type": "session.update",
            "session": {
                "modalities": ["text"],
                "input_audio_format": "pcm",
                "sample_rate": 16000,
                "input_audio_transcription": {"language": args.language},
                "turn_detection": turn_detection,
            },
        }
        _send_json(ws, session_update)
        print("[INFO] 已发送 session.update")

        ok, data = _recv_until(ws, args.timeout, {"session.updated"})
        if not ok:
            print("❌ 未收到 session.updated，实时会话初始化失败。")
            return 1
        print("✅ 实时会话初始化成功（收到 session.updated）。")

        # 2) 无音频时，到这里就足够验证 key + 实时链路
        if not args.audio_file:
            _send_json(ws, {"type": "session.finish"})
            print("✅ 测试通过：WebSocket 实时语音服务可用。")
            return 0

        if not os.path.exists(args.audio_file):
            print(f"❌ 音频文件不存在: {args.audio_file}")
            return 4

        # 3) 推流音频
        print(f"[INFO] 开始推流音频: {args.audio_file}")
        with open(args.audio_file, "rb") as f:
            while True:
                chunk = f.read(args.chunk_bytes)
                if not chunk:
                    break
                append_event = {
                    "type": "input_audio_buffer.append",
                    "audio": base64.b64encode(chunk).decode("utf-8"),
                }
                _send_json(ws, append_event)
                time.sleep(args.chunk_interval)

        if not args.use_vad:
            _send_json(ws, {"type": "input_audio_buffer.commit"})
            print("[INFO] 已发送 input_audio_buffer.commit")

        _send_json(ws, {"type": "session.finish"})
        print("[INFO] 已发送 session.finish，等待识别结果...")

        # 4) 等待识别结果（至少命中一次 completed 即通过）
        got_completed = False
        end_time = time.time() + max(8.0, args.timeout)
        while time.time() < end_time:
            try:
                msg = ws.recv()
            except Exception:
                continue
            if not msg:
                continue
            try:
                event = json.loads(msg)
            except Exception:
                continue
            t = event.get("type")
            if t == "error":
                print("❌ 服务端返回 error:")
                print(json.dumps(event, ensure_ascii=False, indent=2))
                return 1
            if t == "conversation.item.input_audio_transcription.text":
                text = (event.get("text", "") + event.get("stash", "")).strip()
                if text:
                    print(f"[partial] {text}")
            elif t == "conversation.item.input_audio_transcription.completed":
                transcript = event.get("transcript", "").strip()
                print(f"[final] {transcript}")
                got_completed = True
            elif t == "session.finished":
                break

        if got_completed:
            print("✅ 测试通过：实时语音识别可用（收到 completed 转写）。")
            return 0

        print("⚠️ 会话已结束，但未收到 completed 转写。")
        print("请确认音频格式为 PCM16/16kHz/单声道，或改用 --no-vad 再试。")
        return 5
    finally:
        try:
            ws.close()
        except Exception:
            pass


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return test_realtime_asr(args)


if __name__ == "__main__":
    raise SystemExit(main())
