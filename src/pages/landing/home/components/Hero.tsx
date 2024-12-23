import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary to-primary-foreground text-white">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Give Your Books a New Home</h1>
        <p className="text-xl mb-8">Sell your unused books to people in your area and discover great deals on pre-loved reads.</p>
        <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
          Get Started
        </Button>
      </div>
    </section>
  );
}
