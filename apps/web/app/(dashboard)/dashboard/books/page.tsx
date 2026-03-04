import { BooksPageClient } from "./books-page-client";
import { mockBooks } from "@/lib/mock-data";

export default function BooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Books</h1>
        <p className="text-muted-foreground">Manage books in the catalog</p>
      </div>
      <BooksPageClient initialBooks={mockBooks} />
    </div>
  );
}
