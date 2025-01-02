"use client";

import { BookCard } from "@/components/card/BookCard";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const featuredBook = {
  title: "So Thirsty",
  author: "Rachel Harrison",
  price: 15.99,
  oldPrice: 18.99,
  rating: 5,
  description:
    "Embodying the raw, wayward spirit of rock 'n' roll, this Edicion portable stereo speaker takes the unmistakable look and sound of Marshall, giving th...",
  image: "/placeholder.svg?height=600&width=400&text=So+Thirsty",
};

const recommendedBooks = [
  {
    title: "Don Quixote",
    author: "Miguel de Cervantes",
    price: 14.13,
    rating: 5,
    image: "/placeholder.svg?height=200&width=150&text=Book+1",
  },
  {
    title: "Harry Potter And The Sorcerer's Stone",
    author: "J.K. Rowling",
    price: 11.35,
    rating: 4,
    image: "/placeholder.svg?height=200&width=150&text=Book+2",
  },
  {
    title: "The Shadow Of The Wind",
    author: "Carlos Ruiz Zafón",
    price: 11.99,
    rating: 5,
    image: "/placeholder.svg?height=200&width=150&text=Book+3",
  },
  {
    title: "Memoirs Of A Geisha",
    author: "Arthur Golden",
    price: 18.65,
    rating: 4,
    image: "/placeholder.svg?height=200&width=150&text=Book+4",
  },
  {
    title: "The Old Man And The Sea",
    author: "Ernest Hemingway",
    price: 15.95,
    rating: 5,
    image: "/placeholder.svg?height=200&width=150&text=Book+5",
  },
];

export default function TopPicks() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Picks for you</h2>
        <Button variant="ghost" className="text-primary">
          Browse All
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative group cursor-pointer">
          <div className="aspect-[3/4] mb-4 overflow-hidden rounded-lg">
            <img
              src={featuredBook.image}
              alt={featuredBook.title}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="flex items-center gap-1 mb-2">
            {[...Array(featuredBook.rating)].map((_, i) => (
              <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <h3 className="text-xl font-bold mb-2">{featuredBook.title}</h3>
          <p className="text-gray-600 mb-4">{featuredBook.description}</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">${featuredBook.price}</span>
            {featuredBook.oldPrice && <span className="text-gray-500 line-through">${featuredBook.oldPrice}</span>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {recommendedBooks.map((book, index) => (
            <BookCard key={index} {...book} />
          ))}
        </div>
      </div>
    </section>
  );
}
