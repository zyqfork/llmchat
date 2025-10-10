import cn from "./cn";
import en from "./en";
import tw from "./tw";
import pt from "./pt";
import fr from "./fr";
import es from "./es";
import it from "./it";
import jp from "./jp";
import de from "./de";
import ru from "./ru";
import ko from "./ko";
import ar from "./ar";
import tr from "./tr";
import vi from "./vi";
import bn from "./bn";
import cs from "./cs";
import da from "./da";
import { merge } from "../utils/merge";
import { safeLocalStorage } from "@/app/utils";

import type { LocaleType } from "./cn";
export type { LocaleType, PartialLocaleType } from "./cn";

const localStorage = safeLocalStorage();

const ALL_LANGS = {
  cn,
  en,
  tw,
  pt,
  fr,
  es,
  it,
  jp,
  de,
  ru,
  ko,
  ar,
  tr,
  vi,
  bn,
  cs,
  da,
};

export type Lang = keyof typeof ALL_LANGS;

export const AllLangs = Object.keys(ALL_LANGS) as Lang[];

export const ALL_LANG_OPTIONS: Record<Lang, string> = {
  cn: "简体中文",
  en: "English",
  tw: "繁體中文",
  pt: "Português",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  jp: "日本語",
  de: "Deutsch",
  ru: "Русский",
  ko: "한국어",
  ar: "العربية",
  tr: "Türkçe",
  vi: "Tiếng Việt",
  bn: "বাংলা",
  cs: "Čeština",
  da: "Dansk",
};

const LANG_KEY = "lang";
const DEFAULT_LANG = "en";

const fallbackLang = en;
const targetLang = ALL_LANGS[getLang()] as LocaleType;

// if target lang missing some fields, it will use fallback lang string
merge(fallbackLang, targetLang);

export default fallbackLang as LocaleType;

function getItem(key: string) {
  return localStorage.getItem(key);
}

function setItem(key: string, value: string) {
  localStorage.setItem(key, value);
}

function getLanguage() {
  try {
    const locale = new Intl.Locale(navigator.language).maximize();
    const region = locale?.region?.toLowerCase();
    // 1. check region code in ALL_LANGS
    if (AllLangs.includes(region as Lang)) {
      return region as Lang;
    }
    // 2. check language code in ALL_LANGS
    if (AllLangs.includes(locale.language as Lang)) {
      return locale.language as Lang;
    }
    return DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

export function getLang(): Lang {
  const savedLang = getItem(LANG_KEY);

  if (AllLangs.includes((savedLang ?? "") as Lang)) {
    return savedLang as Lang;
  }

  return getLanguage();
}

export function changeLang(lang: Lang) {
  setItem(LANG_KEY, lang);
  location.reload();
}

export function getISOLang() {
  const isoLangString: Record<string, string> = {
    cn: "zh-Hans",
    tw: "zh-Hant",
  };

  const lang = getLang();
  return isoLangString[lang] ?? lang;
}

const DEFAULT_STT_LANG = "zh-CN";
export const STT_LANG_MAP: Record<Lang, string> = {
  cn: "zh-CN",
  en: "en-US",
  tw: "zh-TW",
  pt: "pt-BR",
  fr: "fr-FR",
  es: "es-ES",
  it: "it-IT",
  jp: "ja-JP",
  de: "de-DE",
  ru: "ru-RU",
  ko: "ko-KR",
  ar: "ar-SA",
  tr: "tr-TR",
  vi: "vi-VN",
  bn: "bn-BD",
  cs: "cs-CZ",
  da: "da-DK",
};

export function getSTTLang(): string {
  try {
    return STT_LANG_MAP[getLang()];
  } catch {
    return DEFAULT_STT_LANG;
  }
}
