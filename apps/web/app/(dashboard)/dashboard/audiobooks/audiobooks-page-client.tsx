"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowLeft, CheckCircle, Loader2, ListTodo, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { MockAudiobook } from "@/lib/mock-data";

const STATUS_LABELS: Record<MockAudiobook["status"], string> = {
  success: "Success",
  in_progress: "In progress",
  queued: "Queued",
  failed: "Failed",
};

function StatusIcon({ status }: { status: MockAudiobook["status"] }) {
  switch (status) {
    case "success":
      return <CheckCircle className="size-4 text-green-600" />;
    case "in_progress":
      return <Loader2 className="size-4 text-amber-600 animate-spin" />;
    case "queued":
      return <ListTodo className="size-4 text-blue-600" />;
    case "failed":
      return <XCircle className="size-4 text-destructive" />;
  }
}

export function AudiobooksPageClient({
  initialAudiobooks,
}: {
  initialAudiobooks: MockAudiobook[];
}) {
  const [audiobooks] = useState<MockAudiobook[]>(initialAudiobooks);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return audiobooks.filter((a) => {
      const matchSearch =
        search === "" ||
        a.bookTitle.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [audiobooks, search, statusFilter]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>All audiobooks</CardTitle>
          <CardDescription>
            Search and filter; audiobooks are created by users and workflows
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="size-4 mr-1" />
            Dashboard
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by book title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ab) => (
                <TableRow key={ab.id}>
                  <TableCell className="font-medium">{ab.bookTitle}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <StatusIcon status={ab.status} />
                      <Badge variant="secondary">
                        {STATUS_LABELS[ab.status]}
                      </Badge>
                    </span>
                  </TableCell>
                  <TableCell>{ab.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
