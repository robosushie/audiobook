import type { ReferenceLanguage } from "@/types/api";

export const REFERENCE_LANGUAGES: { value: ReferenceLanguage; label: string }[] = [
  { value: "english", label: "English" },
  { value: "assamese", label: "Assamese" },
  { value: "bengali", label: "Bengali" },
  { value: "gujarati", label: "Gujarati" },
  { value: "hindi", label: "Hindi" },
  { value: "arabic", label: "Arabic" },
  { value: "kannada", label: "Kannada" },
  { value: "malayalam", label: "Malayalam" },
  { value: "marathi", label: "Marathi" },
  { value: "odia", label: "Odia" },
  { value: "punjabi", label: "Punjabi" },
  { value: "tamil", label: "Tamil" },
  { value: "telugu", label: "Telugu" },
];

export function formatReferenceLanguage(language: string) {
  const match = REFERENCE_LANGUAGES.find((item) => item.value === language);
  return match?.label ?? language.charAt(0).toUpperCase() + language.slice(1);
}
