import { NextResponse } from "next/server";

// 纯前端应用的默认配置
const DANGER_CONFIG = {
  needCode: false,
  hideUserApiKey: false,
  disableGPT4: false,
  hideBalanceQuery: false,
  disableFastLink: false,
  customModels: "",
  defaultModel: "",
  visionModels: "",
};

declare global {
  type DangerConfig = typeof DANGER_CONFIG;
}

async function handle() {
  return NextResponse.json(DANGER_CONFIG);
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
