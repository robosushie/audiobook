import type { UserName, UserRow } from "@/types/api";

export function formatUserName(name: UserName) {
  return [name.first, name.middle, name.last].filter(Boolean).join(" ");
}

export function formatGender(gender: UserRow["gender"]) {
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}
