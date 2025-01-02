import { Button } from "@/components/ui/button";

export default function FeaturedBook() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="relative overflow-hidden rounded-lg bg-[#1C2A39] text-white">
        <div className="absolute inset-0">
          <img
            src="/placeholder.svg?height=400&width=1200&text=Thriller+Books+Background"
            alt="Thriller books background"
            // layout="fill"
            // objectFit="cover"
            className="opacity-50 object-cover"
          />
        </div>
        <div className="relative. z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-12">
          <div className="mb-6 md:mb-0 md:mr-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">TOP FAVOURITE THRILLER STORIES</h2>
            <p className="text-lg mb-6">Find our take on the best books of all time.</p>
            <Button variant="secondary">Discover Now</Button>
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-md">
            {[1, 2, 3, 4, 5, 6].map((book) => (
              <div
                key={book}
                className="relative aspect-[2/3] rounded-md overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-200"
              >
                <img
                  src={`/placeholder.svg?height=300&width=200&text=Thriller+${book}`}
                  alt={`Thriller book ${book}`}
                  //   layout="fill"
                  //   objectFit="cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
