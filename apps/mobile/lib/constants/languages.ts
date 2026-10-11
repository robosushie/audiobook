import type { ReferenceLanguage } from '@/types/api';

export const REFERENCE_LANGUAGES: { value: ReferenceLanguage; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'malayalam', label: 'Malayalam' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'odia', label: 'Odia' },
  { value: 'arabic', label: 'Arabic' },
];

export function formatReferenceLanguage(language: string) {
  const match = REFERENCE_LANGUAGES.find((item) => item.value === language);
  return match?.label ?? language.charAt(0).toUpperCase() + language.slice(1);
}
