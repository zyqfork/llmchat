export interface GeneratedModelLimit {
  context?: number;
  output?: number;
}

export interface GeneratedModelModalities {
  input?: readonly string[] | string[];
  output?: readonly string[] | string[];
}

export interface GeneratedModelInterleaved {
  field?: string;
}

export interface GeneratedModelConfig {
  id?: string;
  name?: string;
  api?: string;
  input?: readonly string[] | string[];
  contextWindow?: number;
  maxTokens?: number;
  knowledge?: string;
  reasoning?: boolean;
  tool_call?: boolean;
  limit?: GeneratedModelLimit;
  modalities?: GeneratedModelModalities;
  interleaved?: GeneratedModelInterleaved;
}

export interface GeneratedProviderConfig {
  id?: string;
  name?: string;
  models?:
    | Readonly<Record<string, GeneratedModelConfig>>
    | Record<string, GeneratedModelConfig>;
}

export type ModelsDevConfigMap = Record<string, GeneratedProviderConfig>;
