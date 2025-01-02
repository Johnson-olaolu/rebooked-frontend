import { Button } from "@/components/ui/button";

export default function CallToAction() {
  return (
    <section className="py-20 bg-primary text-white">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Selling?</h2>
        <p className="text-xl mb-8">Join Rebooked today and turn your unused books into cash!</p>
        <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
          Sign Up Now
        </Button>
      </div>
    </section>
  );
}
