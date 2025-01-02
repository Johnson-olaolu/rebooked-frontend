import { Book, Users, Wand2, Skull, Home, FileText, Heart, Baby } from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  { name: "History", icon: Book },
  { name: "Biography", icon: Users },
  { name: "Fantasy", icon: Wand2 },
  { name: "Horror", icon: Skull },
  { name: "Family", icon: Home },
  { name: "Fiction", icon: FileText },
  { name: "Romance", icon: Heart },
  { name: "Kids", icon: Baby },
];

export default function TopCategories() {
  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-8">Top categories</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
        {categories.map((category, index) => {
          const Icon = category.icon;
          return (
            <Link
              key={index}
              to={`/category/${category.name.toLowerCase()}`}
              className="flex flex-col items-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm mb-3">
                <Icon className="w-6 h-6 text-[#0B3B2C]" />
              </div>
              <span className="text-sm font-medium">{category.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
