import { cn } from "@/lib/utils";

interface BookCardProps {
  title: string;
  author: string;
  price: number;
  image: string;
  className?: string;
  rating?: number;
  oldPrice?: number;
}

export function BookCard({ title, author, price, image, className, rating, oldPrice }: BookCardProps) {
  return (
    <div className={cn("group cursor-pointer", className)}>
      <div className="relative aspect-[2/3] mb-4 overflow-hidden rounded-lg">
        <img src={image} alt={title} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
      </div>
      {rating && (
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className={`w-4 h-4 ${i < rating ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      )}
      <h3 className="font-medium text-sm mb-1 line-clamp-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-2">{author}</p>
      <div className="flex items-center gap-2">
        <span className="font-bold">${price.toFixed(2)}</span>
        {oldPrice && <span className="text-sm text-gray-500 line-through">${oldPrice.toFixed(2)}</span>}
      </div>
    </div>
  );
}
