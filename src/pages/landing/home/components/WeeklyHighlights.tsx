import { BookCard } from "@/components/card/BookCard";
import { Button } from "@/components/ui/button";

const highlights = [
  {
    title: "Extremely Loud And Incredibly Close",
    author: "Jonathan Safran",
    price: 34.98,
    image: "/placeholder.svg?height=400&width=300&text=Book+1",
  },
  {
    title: "The Brief Wondrous Life Of Oscar Wao",
    author: "T. Kingfisher",
    price: 45.2,
    image: "/placeholder.svg?height=400&width=300&text=Book+2",
  },
  {
    title: "A Prayer For Owen Meany",
    author: "Percival Everett",
    price: 11.36,
    image: "/placeholder.svg?height=400&width=300&text=Book+3",
  },
  {
    title: "Midnight In The Garden Of Good And Evil",
    author: "Emily Wilson",
    price: 19.64,
    image: "/placeholder.svg?height=400&width=300&text=Book+4",
  },
  {
    title: "The Old Man And The Sea",
    author: "Norman Aslam",
    price: 15.95,
    image: "/placeholder.svg?height=400&width=300&text=Book+5",
  },
  {
    title: "Harry Potter And The Sorcerer's Stone",
    author: "J.K. Rowling",
    price: 15.9,
    image: "/placeholder.svg?height=400&width=300&text=Book+6",
  },
];

export default function WeeklyHighlights() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">This week's highlights</h2>
        <Button variant="ghost" className="text-primary">
          Browse All
          <span className="sr-only">Browse all weekly highlights</span>
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {highlights.map((book, index) => (
          <BookCard key={index} {...book} />
        ))}
      </div>
    </section>
  );
}
