import { Facebook, Twitter, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  { name: "Action Books", href: "#" },
  { name: "Comedy", href: "#" },
  { name: "Drama", href: "#" },
  { name: "Horror", href: "#" },
  { name: "Kids Books", href: "#" },
  { name: "Top 50 Books", href: "#" },
];

const usefulLinks = [
  { name: "Secure Shopping", href: "#" },
  { name: "Privacy Policy", href: "#" },
  { name: "Terms of Use", href: "#" },
  { name: "Shipping Policy", href: "#" },
  { name: "Return Policy", href: "#" },
  { name: "Payment Option", href: "#" },
];

const explore = [
  { name: "About us", href: "#" },
  { name: "Store Locator", href: "#" },
  { name: "FAQs", href: "#" },
  { name: "Blogs", href: "#" },
  { name: "Careers", href: "#" },
  { name: "Contact Us", href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Link to="/" className="text-2xl font-bold text-[#0B3B2C] mb-4 inline-block">
              Rebooked
            </Link>
            <p className="text-gray-600 mb-4">
              Bokila green book lovers of all ages into a community, engage with booklovers and meet their favourite literary personalities.
            </p>
            <div className="mb-4">
              <p className="font-semibold mb-1">+(84) - 1800 - 4635</p>
              <p className="text-gray-600">contact@example.com</p>
            </div>
            <div className="flex gap-4">
              <Link to="#" className="text-gray-600 hover:text-primary">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link to="#" className="text-gray-600 hover:text-primary">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link to="#" className="text-gray-600 hover:text-primary">
                <Instagram className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Category</h3>
            <ul className="space-y-2">
              {categories.map((item, index) => (
                <li key={index}>
                  <Link to={item.href} className="text-gray-600 hover:text-primary">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Useful links</h3>
            <ul className="space-y-2">
              {usefulLinks.map((item, index) => (
                <li key={index}>
                  <Link to={item.href} className="text-gray-600 hover:text-primary">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Explore</h3>
            <ul className="space-y-2">
              {explore.map((item, index) => (
                <li key={index}>
                  <Link to={item.href} className="text-gray-600 hover:text-primary">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">Copyright © 2024 Bokila. All rights reserved</p>
            <div className="flex gap-2">
              <img src="/placeholder.svg?height=30&width=40&text=Visa" alt="Visa" className="h-8" />
              <img src="/placeholder.svg?height=30&width=40&text=MC" alt="Mastercard" className="h-8" />
              <img src="/placeholder.svg?height=30&width=40&text=Amex" alt="American Express" className="h-8" />
              <img src="/placeholder.svg?height=30&width=40&text=PayPal" alt="PayPal" className="h-8" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
