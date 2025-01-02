import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Rebooked</h3>
            <p className="text-sm">Connecting book lovers in your community.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-sm hover:text-gray-300">
                  Home
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm hover:text-gray-300">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm hover:text-gray-300">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm hover:text-gray-300">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-sm hover:text-gray-300">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm hover:text-gray-300">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Connect</h4>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-sm hover:text-gray-300">
                  Facebook
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm hover:text-gray-300">
                  Twitter
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm hover:text-gray-300">
                  Instagram
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm">© {new Date().getFullYear()} Rebooked. All rights reserved.</div>
      </div>
    </footer>
  );
}
