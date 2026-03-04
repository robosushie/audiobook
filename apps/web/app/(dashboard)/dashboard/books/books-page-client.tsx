"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, ArrowLeft } from "lucide-react";
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
import type { MockBook } from "@/lib/mock-data";
import { BookModal } from "./book-modal";
import { DeleteBookDialog } from "./delete-book-dialog";

const GENRES = ["Fiction", "Education", "Biography", "Science", "Other"];
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
];

export function BooksPageClient({
  initialBooks,
}: {
  initialBooks: MockBook[];
}) {
  const [books, setBooks] = useState<MockBook[]>(initialBooks);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<MockBook | null>(null);
  const [deleteBook, setDeleteBook] = useState<MockBook | null>(null);

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        search === "" ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.genre.toLowerCase().includes(search.toLowerCase());
      const matchGenre =
        genreFilter === "all" || b.genre === genreFilter;
      const matchLang =
        languageFilter === "all" || b.language === languageFilter;
      return matchSearch && matchGenre && matchLang;
    });
  }, [books, search, genreFilter, languageFilter]);

  const handleSaveBook = (data: {
    title: string;
    genre: string;
    language: string;
    coverUrl: string | null;
    content: string;
  }) => {
    if (editingBook) {
      setBooks((prev) =>
        prev.map((b) =>
          b.id === editingBook.id
            ? {
                ...b,
                title: data.title,
                genre: data.genre,
                language: data.language,
                coverUrl: data.coverUrl || null,
                contentPreview: data.content.slice(0, 100) + "...",
              }
            : b
        )
      );
      setEditingBook(null);
    } else {
      setBooks((prev) => [
        ...prev,
        {
          id: String(prev.length + 1),
          title: data.title,
          genre: data.genre,
          language: data.language,
          coverUrl: data.coverUrl || null,
          contentPreview: data.content.slice(0, 100) + "...",
          createdAt: new Date().toISOString().slice(0, 10),
        },
      ]);
    }
    setModalOpen(false);
  };

  const handleDeleteBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setDeleteBook(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>All books</CardTitle>
            <CardDescription>Search and filter books</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="size-4 mr-1" />
                Dashboard
              </Link>
            </Button>
            <Button
              onClick={() => {
                setEditingBook(null);
                setModalOpen(true);
              }}
            >
              <Plus className="size-4 mr-2" />
              Add book
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or genre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All genres</SelectItem>
                {GENRES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All languages</SelectItem>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell>{book.genre}</TableCell>
                    <TableCell>
                      {LANGUAGES.find((l) => l.value === book.language)?.label ??
                        book.language}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingBook(book);
                            setModalOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteBook(book)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <BookModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        book={editingBook}
        onSave={handleSaveBook}
      />
      <DeleteBookDialog
        book={deleteBook}
        onClose={() => setDeleteBook(null)}
        onConfirm={() => deleteBook && handleDeleteBook(deleteBook.id)}
      />
    </>
  );
}
