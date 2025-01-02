import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

const blogPosts = [
  {
    title: "Delivering The Best Global Logistics Services",
    image: "/placeholder.svg?height=200&width=300&text=Logistics",
    date: "October 15, 2023",
  },
  {
    title: "Top 5 Tarot Decks For The Tarot World Summit",
    image: "/placeholder.svg?height=200&width=300&text=Tarot",
    date: "October 12, 2023",
  },
  {
    title: "Activities Of The Frankfurt Book Fair International",
    image: "/placeholder.svg?height=200&width=300&text=Book+Fair",
    date: "October 10, 2023",
  },
];

export default function BlogSection() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">News & events</h2>
        <Button variant="ghost" className="text-primary">
          View All Post
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {blogPosts.map((post, index) => (
          <Card key={index} className="group cursor-pointer">
            <CardContent className="p-0">
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-2">{post.date}</p>
                <h3 className="font-semibold group-hover:text-primary transition-colors">{post.title}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
