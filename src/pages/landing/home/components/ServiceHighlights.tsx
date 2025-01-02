import { Package, Tags, Percent, Store } from "lucide-react";

const services = [
  {
    icon: Package,
    title: "FAST DELIVERY",
    description: "Free standard delivery",
  },
  {
    icon: Tags,
    title: "BEST PRICES & OFFERS",
    description: "Multiple gift options available",
  },
  {
    icon: Percent,
    title: "GREAT DAILY DEAL",
    description: "Orders $50 or more",
  },
  {
    icon: Store,
    title: "CLICK & COLLECT",
    description: "Check your local stores now",
  },
];

export default function ServiceHighlights() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <div key={index} className="flex flex-col items-center text-center">
              <Icon className="w-8 h-8 mb-3 text-primary" />
              <h3 className="font-semibold mb-1">{service.title}</h3>
              <p className="text-sm text-gray-600">{service.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
