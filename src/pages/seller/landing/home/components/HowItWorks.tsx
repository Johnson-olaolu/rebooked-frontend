export default function HowItWorks() {
  const steps = [
    { title: "List Your Books", description: "Take a photo and add details about your book." },
    { title: "Connect with Buyers", description: "Chat with interested buyers in your area." },
    { title: "Make the Exchange", description: "Meet up and complete the sale safely." },
  ];

  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">How Rebooked Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="mb-4 relative">
                <img
                  src={`/placeholder.svg?height=200&width=200&text=Step ${index + 1}`}
                  alt={`Step ${index + 1}`}
                  width={200}
                  height={200}
                  className="mx-auto rounded-full"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
