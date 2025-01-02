import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const authors = [
  { name: "Diana Chambers", image: "/placeholder.svg?height=100&width=100&text=DC" },
  { name: "Enrique Wallace", image: "/placeholder.svg?height=100&width=100&text=EW" },
  { name: "Ernesto Wade", image: "/placeholder.svg?height=100&width=100&text=EW" },
  { name: "Gilberto Mills", image: "/placeholder.svg?height=100&width=100&text=GM" },
  { name: "Jeannette Walls", image: "/placeholder.svg?height=100&width=100&text=JW" },
  { name: "Jessica Munoz", image: "/placeholder.svg?height=100&width=100&text=JM" },
  { name: "Julian Sanford", image: "/placeholder.svg?height=100&width=100&text=JS" },
  { name: "Jon Krakauer", image: "/placeholder.svg?height=100&width=100&text=JK" },
];

export default function FeaturedAuthors() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = scrollRef.current.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount);
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      setCanScrollLeft(scrollRef.current.scrollLeft > 0);
      setCanScrollRight(scrollRef.current.scrollLeft < scrollRef.current.scrollWidth - scrollRef.current.clientWidth);
    }
  };

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-8">Featured authors</h2>
      <div className="relative">
        <div className="flex overflow-x-hidden gap-8 scroll-smooth" ref={scrollRef} onScroll={handleScroll}>
          {authors.map((author, index) => (
            <div key={index} className="flex flex-col items-center flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
                <img src={author.image} alt={author.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-medium text-center">{author.name}</span>
            </div>
          ))}
        </div>
        {canScrollLeft && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-lg"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {canScrollRight && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-lg"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </section>
  );
}
