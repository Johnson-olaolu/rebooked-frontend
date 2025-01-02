import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";

interface FilterSidebarProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
}

export default function FilterSidebar({ categories, selectedCategory, onSelectCategory, priceRange, onPriceRangeChange }: FilterSidebarProps) {
  return (
    <div className="w-full md:w-64 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Categories</h2>
        <RadioGroup value={selectedCategory || ""} onValueChange={(value) => onSelectCategory(value || null)}>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="" id="all-categories" />
              <Label htmlFor="all-categories">All Categories</Label>
            </div>
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <RadioGroupItem value={category} id={category} />
                <Label htmlFor={category}>{category}</Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Price Range</h2>
        <Slider min={0} max={50} step={1} value={priceRange} onValueChange={onPriceRangeChange} className="mb-2" />
        <div className="flex justify-between text-sm text-gray-600">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}</span>
        </div>
      </div>
    </div>
  );
}
