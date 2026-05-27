import { getAllProviders } from "../constant";
import type { CustomProvider } from "../store/access";

function findCustomProvider(
  providerName: string | undefined,
  access: any,
): CustomProvider | undefined {
  if (!providerName) return undefined;
  return access.customProviders?.find(
    (provider: CustomProvider) =>
      provider.id === providerName || provider.name === providerName,
  );
}

export function isResponseApiEnabled(
  providerName: string | undefined,
  access: any,
): boolean {
  if (!providerName) return false;

  const customProvider = findCustomProvider(providerName, access);
  if (customProvider?.type === "openai") {
    return (
      access[`${customProvider.id}ApiType`] === "response" ||
      customProvider.config?.useResponseApi === true
    );
  }

  const provider = getAllProviders().find(
    (item) => item.id === providerName || item.name === providerName,
  );
  const apiTypeKey = provider?.storeKeys?.apiType;
  return apiTypeKey ? access[apiTypeKey] === "response" : false;
}

export function isResponseStatefulEnabled(
  providerName: string | undefined,
  access: any,
): boolean {
  if (!isResponseApiEnabled(providerName, access)) {
    return false;
  }

  const customProvider = findCustomProvider(providerName, access);
  if (customProvider?.type === "openai") {
    return (
      customProvider.config?.useResponseStateful === true ||
      access[`${customProvider.id}ResponseStateful`] === true
    );
  }

  const provider = getAllProviders().find(
    (item) => item.id === providerName || item.name === providerName,
  );
  const statefulKey = provider?.storeKeys?.responseStateful;
  return statefulKey ? access[statefulKey] === true : false;
}

function isDeveloperOrSystemItem(item: any): boolean {
  return (
    !!item &&
    typeof item === "object" &&
    (item.role === "developer" || item.role === "system")
  );
}

function isUserItem(item: any): boolean {
  return !!item && typeof item === "object" && item.role === "user";
}

export function trimResponsesInputForStateful(
  input: any[],
  hasPreviousResponseId: boolean,
): any[] {
  if (!hasPreviousResponseId || !Array.isArray(input) || input.length === 0) {
    return input;
  }

  const prefix: any[] = [];
  let index = 0;
  while (index < input.length && isDeveloperOrSystemItem(input[index])) {
    prefix.push(input[index]);
    index += 1;
  }

  let lastUserIndex = -1;
  for (let i = input.length - 1; i >= index; i -= 1) {
    if (isUserItem(input[i])) {
      lastUserIndex = i;
      break;
    }
  }

  if (lastUserIndex === -1) {
    return prefix.length > 0 ? prefix : input;
  }

  return [...prefix, input[lastUserIndex]];
}

export function applyStatefulResponsesPayload(
  payload: any,
  options: {
    previousResponseId?: string;
    hasTools?: boolean;
  },
): any {
  if (options.hasTools) {
    return payload;
  }

  const previousResponseId = options.previousResponseId;
  const nextPayload = {
    ...payload,
    store: true,
  };

  if (!previousResponseId) {
    return nextPayload;
  }

  return {
    ...nextPayload,
    previous_response_id: previousResponseId,
    input: trimResponsesInputForStateful(payload.input ?? [], true),
  };
}
