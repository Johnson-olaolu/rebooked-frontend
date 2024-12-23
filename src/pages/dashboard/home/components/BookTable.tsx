import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";

type Book = {
  id: string;
  title: string;
  author: string;
  price: number;
  status: string;
  coverImage: string;
  category: string;
};

const initialBooks: Book[] = [
  {
    id: "1",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    price: 15.99,
    status: "active",
    coverImage: "/placeholder.svg?height=50&width=40&text=Gatsby",
    category: "Fiction",
  },
  {
    id: "2",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    price: 12.99,
    status: "sold",
    coverImage: "/placeholder.svg?height=50&width=40&text=Mockingbird",
    category: "Fiction",
  },
  {
    id: "3",
    title: "1984",
    author: "George Orwell",
    price: 10.99,
    status: "active",
    coverImage: "/placeholder.svg?height=50&width=40&text=1984",
    category: "Science Fiction",
  },
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `${i + 4}`,
    title: `Book ${i + 4}`,
    author: `Author ${i + 4}`,
    price: 9.99 + i,
    status: i % 2 === 0 ? "active" : "sold",
    coverImage: `/placeholder.svg?height=50&width=40&text=Book${i + 4}`,
    category: i % 3 === 0 ? "Non-fiction" : i % 3 === 1 ? "Fiction" : "Science Fiction",
  })),
];

export default function BookTable() {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage, setBooksPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const handleDeleteBook = (id: string) => {
    setBooks(books.filter((book) => book.id !== id));
  };

  const filteredBooks = books.filter(
    (book) =>
      (book.title.toLowerCase().includes(searchTerm.toLowerCase()) || book.author.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedCategory === "All" || book.category === selectedCategory)
  );

  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook);

  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, booksPerPage]);

  const categories = ["All", ...new Set(books.map((book) => book.category))];

  if (books.length === 0) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Your Books</CardTitle>
          <CardDescription>You haven't uploaded any books yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/upload-book">Upload Your First Book</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Your Books</h2>
      <div className="flex flex-col md:flex-row gap-4 mb-4 justify-between">
        <Input placeholder="Search books..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="md:w-1/3" />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="md:w-1/4">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cover</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentBooks.map((book) => (
            <TableRow key={book.id}>
              <TableCell>
                <img src={book.coverImage} alt={`Cover of ${book.title}`} className="w-10 h-[50px] object-cover rounded" />
              </TableCell>
              <TableCell>{book.title}</TableCell>
              <TableCell>{book.author}</TableCell>
              <TableCell>{book.category}</TableCell>
              <TableCell>${book.price.toFixed(2)}</TableCell>
              <TableCell>{book.status}</TableCell>
              <TableCell>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/books/${book.id}`}>View</Link>
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteBook(book.id)}>
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filteredBooks.length > 0 ? (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Select value={booksPerPage.toString()} onValueChange={(value) => setBooksPerPage(Number(value))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Books per page" />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((number) => (
                  <SelectItem key={number} value={number.toString()}>
                    {number} per page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Pagination className=" mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink href="#" onClick={() => setCurrentPage(i + 1)} isActive={currentPage === i + 1}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : (
        <p className="text-center mt-4">No books found matching your search criteria.</p>
      )}
    </div>
  );
}
