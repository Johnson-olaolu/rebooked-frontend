"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Victor M.",
    rating: 5,
    date: "Oct 12, 2023",
    comment:
      "Quick and easy. Constantly new there's always promotions or discounts, the website is easy to navigate, and knowing that like myself, you're helping make the world less rm by buying something good!",
  },
  {
    name: "Claire R.",
    rating: 5,
    date: "Oct 5, 2023",
    comment:
      "Excellent service. The books were wrapped securely and arrived in pristine condition. I sent an email to ask about the author, and received a prompt reply!",
  },
  {
    name: "Margaret C.",
    rating: 5,
    date: "Oct 1, 2023",
    comment:
      "Best Bookshop ever! I am so happy to find a site where I can finally purchase items. The packaging was phenomenal and my book arrived on time in perfect condition.",
  },
  {
    name: "Pam Rush",
    rating: 5,
    date: "Oct 15, 2023",
    comment: "Great Books, Excellent Service. Not only diverse books but also excellent service! staff! A memorable book shopping experience!",
  },
];

export default function Testimonials() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row items-start gap-8">
        <div className="md:w-1/3">
          <h2 className="text-2xl font-bold mb-4">What client says</h2>
          <div className="bg-[#0B3B2C] text-white rounded-lg p-6 text-center">
            <div className="text-4xl font-bold mb-2">4.8</div>
            <div className="flex justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
            <div className="text-sm">2,938 Ratings</div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6 flex-1">
          {testimonials.map((testimonial, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 mb-4">{testimonial.comment}</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{testimonial.name}</span>
                  <span className="text-sm text-gray-500">{testimonial.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
