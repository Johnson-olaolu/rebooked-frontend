import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const announcements = ["All books at least 50% off till prices every day", "Free shipping on orders over $35", "New releases available now"];

export default function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  return (
    <div className="bg-[#0B3B2C] text-white py-1.5 relative">
      <div className="container mx-auto px-4 flex items-center justify-center">
        <button onClick={handlePrevious} className="absolute left-4 p-1 hover:bg-white/10 rounded-full" aria-label="Previous announcement">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm text-center">{announcements[currentIndex]}</p>
        <button onClick={handleNext} className="absolute right-4 p-1 hover:bg-white/10 rounded-full" aria-label="Next announcement">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
