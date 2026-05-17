import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchReferences } from "@/api/references";
import { PageHeader } from "@/components/layout/PageHeader";
import { AddReferenceDialog } from "@/components/references/AddReferenceDialog";
import { ReferenceTable } from "@/components/references/ReferenceTable";
import { Input } from "@/components/ui/input";
import { formatReferenceLanguage } from "@/constants/languages";
import { useApi } from "@/hooks/useApi";
import type { ReferenceRow } from "@/types/api";

export function ReferencePage() {
  const { request } = useApi();
  const [references, setReferences] = useState<ReferenceRow[]>([]);
  const [query, setQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReferences(await fetchReferences(request));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load references");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void load();
  }, [load]);

  const languages = useMemo(() => {
    const set = new Set(references.map((row) => row.language));
    return Array.from(set).sort();
  }, [references]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return references.filter((row) => {
      if (languageFilter !== "all" && row.language !== languageFilter) return false;
      if (!q) return true;
      return (
        row.text.toLowerCase().includes(q) ||
        formatReferenceLanguage(row.language).toLowerCase().includes(q)
      );
    });
  }, [references, query, languageFilter]);

  return (
    <div>
      <PageHeader
        title="Reference"
        subtitle="Shared reading passages for voice profiles and cloning"
        action={<AddReferenceDialog onSuccess={load} />}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xl flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 bg-card pl-10"
            placeholder="Search by text or language…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm sm:w-48"
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
        >
          <option value="all">All languages</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {formatReferenceLanguage(lang)}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <ReferenceTable references={filtered} loading={loading} onRefresh={load} />
    </div>
  );
}
