"use client";

import { useState } from "react";
import SearchBar from "./components/SearchBar";
import FilterSidebar from "./components/FilterSidebar";
import BookGrid from "./components/BookGrid";

export type Book = {
  id: string;
  title: string;
  author: string;
  price: number;
  category: string;
  coverImage: string;
};

const mockBooks: Book[] = [
  {
    id: "1",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    price: 15.99,
    category: "Classic",
    coverImage: "/placeholder.svg?height=200&width=150&text=Gatsby",
  },
  {
    id: "2",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    price: 12.99,
    category: "Classic",
    coverImage: "/placeholder.svg?height=200&width=150&text=Mockingbird",
  },
  {
    id: "3",
    title: "1984",
    author: "George Orwell",
    price: 10.99,
    category: "Science Fiction",
    coverImage: "/placeholder.svg?height=200&width=150&text=1984",
  },
  {
    id: "4",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    price: 9.99,
    category: "Romance",
    coverImage: "/placeholder.svg?height=200&width=150&text=Pride",
  },
  {
    id: "5",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    price: 14.99,
    category: "Fantasy",
    coverImage: "/placeholder.svg?height=200&width=150&text=Hobbit",
  },
  {
    id: "6",
    title: "Dune",
    author: "Frank Herbert",
    price: 13.99,
    category: "Science Fiction",
    coverImage: "/placeholder.svg?height=200&width=150&text=Dune",
  },
  {
    id: "7",
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    price: 11.99,
    category: "Classic",
    coverImage: "/placeholder.svg?height=200&width=150&text=Catcher",
  },
  {
    id: "8",
    title: "Jane Eyre",
    author: "Charlotte Brontë",
    price: 10.99,
    category: "Classic",
    coverImage: "/placeholder.svg?height=200&width=150&text=Jane+Eyre",
  },
  {
    id: "9",
    title: "The Lord of the Rings",
    author: "J.R.R. Tolkien",
    price: 29.99,
    category: "Fantasy",
    coverImage: "/placeholder.svg?height=200&width=150&text=LOTR",
  },
  {
    id: "10",
    title: "Brave New World",
    author: "Aldous Huxley",
    price: 12.99,
    category: "Science Fiction",
    coverImage: "/placeholder.svg?height=200&width=150&text=Brave+New+World",
  },
];

export default function ShopPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [books, setBooks] = useState<Book[]>(mockBooks);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50]);
  const [searchQuery, setSearchQuery] = useState("");

  const filterBooks = () => {
    return books.filter((book) => {
      const matchesCategory = !selectedCategory || book.category === selectedCategory;
      const matchesPriceRange = book.price >= priceRange[0] && book.price <= priceRange[1];
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) || book.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesPriceRange && matchesSearch;
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredBooks = filterBooks();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Book Shop</h1>
      <div className="mb-6">
        <SearchBar onSearch={handleSearch} />
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <FilterSidebar
          categories={Array.from(new Set(books.map((book) => book.category)))}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
        />
        <BookGrid books={filteredBooks} />
      </div>
    </main>
  );
}
