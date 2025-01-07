import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="py-4 px-6 bg-white shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-primary">
          Rebooked
        </Link>
        <nav className="hidden md:flex space-x-4">
          <Link to="#features" className="text-gray-600 hover:text-primary">
            Features
          </Link>
          <Link to="#how-it-works" className="text-gray-600 hover:text-primary">
            How It Works
          </Link>
          <Link to="#" className="text-gray-600 hover:text-primary">
            About
          </Link>
        </nav>
        <div className="flex space-x-2">
          <Button asChild variant="outline">
            <Link to="/auth/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link to="/auth/signup?role=seller">Sign Up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
