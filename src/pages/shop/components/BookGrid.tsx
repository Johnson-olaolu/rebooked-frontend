import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book } from "..";

interface BookGridProps {
  books: Book[];
}

export default function BookGrid({ books }: BookGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 flex-1">
      {books.map((book) => (
        <Card key={book.id} className="flex flex-col">
          <CardContent className="p-4">
            <img src={book.coverImage} alt={`Cover of ${book.title}`} className="w-full h-48 object-cover mb-4 rounded" />
            <h3 className="font-semibold text-lg mb-1">{book.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{book.author}</p>
            <p className="font-bold">${book.price.toFixed(2)}</p>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button className="w-full">Add to Cart</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
