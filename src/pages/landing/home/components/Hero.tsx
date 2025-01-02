export default function Hero() {
  return (
    <div className="relative bg-gradient-to-r from-[#E8F3F3] to-[#FDF6E4]">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#0B3B2C] leading-tight mb-4">
              THE WORLD OF
              <br />
              YOUNG ADULT
              <br />
              BOOKS
            </h1>
            <p className="text-gray-600 mb-6">Save up to 15% on new releases</p>
            <button className="bg-[#0B3B2C] text-white px-6 py-3 rounded-full hover:bg-[#0B3B2C]/90 transition-colors">Discover Now</button>
          </div>
          <div className="relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="bg-[#FF6B00] text-white rounded-full w-20 h-20 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold">15%</div>
                  <div className="text-sm">OFF</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <img
                src="/placeholder.svg?height=400&width=300&text=Book+1"
                alt="Featured Book 1"
                className="w-full h-auto transform rotate-[-15deg]"
              />
              <img src="/placeholder.svg?height=400&width=300&text=Book+2" alt="Featured Book 2" className="w-full h-auto transform translate-y-8" />
              <img src="/placeholder.svg?height=400&width=300&text=Book+3" alt="Featured Book 3" className="w-full h-auto transform rotate-[15deg]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
