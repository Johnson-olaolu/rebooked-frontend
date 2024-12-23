import { Book, MapPin, DollarSign } from "lucide-react";

export default function Features() {
  const features = [
    { icon: Book, title: "Declutter Your Shelves", description: "Easily list and sell books you no longer need." },
    { icon: MapPin, title: "Local Connections", description: "Find buyers and sellers in your area for easy exchanges." },
    { icon: DollarSign, title: "Earn Extra Cash", description: "Turn your unused books into money in your pocket." },
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Rebooked?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
              <feature.icon className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
