import type { ReferenceLanguage } from "@/types/api";

const LANGUAGE_LABELS: Record<string, string> = {
  english: "English",
  hindi: "Hindi",
  arabic: "Arabic",
  malayalam: "Malayalam",
  tamil: "Tamil",
  odia: "Odia",
};

export const REFERENCE_LANGUAGES: { value: ReferenceLanguage; label: string }[] = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "arabic", label: "Arabic" },
];

export function formatReferenceLanguage(language: string) {
  return LANGUAGE_LABELS[language] ?? language.charAt(0).toUpperCase() + language.slice(1);
}
