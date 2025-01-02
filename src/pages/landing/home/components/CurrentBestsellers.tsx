import { BookCard } from "@/components/card/BookCard";
import { Button } from "@/components/ui/button";

const bestsellers = [
  {
    title: "Voyage Of The Damned",
    author: "Emily Wilson",
    price: 14.13,
    oldPrice: 17.29,
    rating: 4,
    image: "/placeholder.svg?height=400&width=300&text=Book+1",
  },
  {
    title: "Table For Two",
    author: "Amor Towles",
    price: 17.29,
    rating: 5,
    image: "/placeholder.svg?height=400&width=300&text=Book+2",
  },
  {
    title: "Throne Of Glass",
    author: "Don DeLillo",
    price: 14.13,
    rating: 4,
    image: "/placeholder.svg?height=400&width=300&text=Book+3",
  },
  {
    title: "Extremely Loud And Incredibly Close",
    author: "Jonathan Safran",
    price: 34.08,
    rating: 5,
    image: "/placeholder.svg?height=400&width=300&text=Book+4",
  },
  {
    title: "The Secret Life Of Bees",
    author: "Sue Monk Kidd",
    price: 15.89,
    oldPrice: 18.99,
    rating: 4,
    image: "/placeholder.svg?height=400&width=300&text=Book+5",
  },
  {
    title: "A Prayer For Owen Meany",
    author: "Percival Everett",
    price: 11.36,
    rating: 5,
    image: "/placeholder.svg?height=400&width=300&text=Book+6",
  },
];

export default function CurrentBestsellers() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Current bestselling books</h2>
        <Button variant="ghost" className="text-primary">
          Browse All
          <span className="sr-only">Browse all bestsellers</span>
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {bestsellers.map((book, index) => (
          <BookCard key={index} {...book} />
        ))}
      </div>
    </section>
  );
}
