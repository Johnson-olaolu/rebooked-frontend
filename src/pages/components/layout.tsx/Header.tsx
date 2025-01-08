"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="text-2xl font-bold text-[#0B3B2C]">
            Rebooked
          </Link>

          <div className="hidden md:flex items-center flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Input type="search" placeholder="Search products..." className="w-full pl-4 pr-10" />
              <Button size="icon" variant="ghost" className="absolute right-0 top-0">
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* <span className="hidden lg:inline text-sm text-gray-600">Need help? Call us: +1 234 567 8900</span> */}
            <Button variant="outline" asChild>
              <Link to="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/seller">Become a Seller</Link>
            </Button>
          </div>
        </div>

        <nav className="flex items-center space-x-6 py-4 border-t">
          <Link to="/" className="text-sm font-medium hover:text-primary">
            Home
          </Link>
          <Link to="/shop" className="text-sm font-medium hover:text-primary">
            Shop
          </Link>
          <Link to="/blog" className="text-sm font-medium hover:text-primary">
            Blog
          </Link>
          <Link to="/pages" className="text-sm font-medium hover:text-primary">
            Pages
          </Link>
          <Link to="/contact" className="text-sm font-medium hover:text-primary">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
