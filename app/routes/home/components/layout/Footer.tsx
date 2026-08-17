import { Link } from "react-router";

const footerLinks = [
    { label: "About us", to: "/about-us" },
    { label: "Privacy policy", to: "/privacy-policy" },
    { label: "Terms of service", to: "/terms-of-service" },
    { label: "Contact us", to: "/contact-us" },
];

const Footer = () => {
    return (
        <footer className="bg-[#4a2d18] text-[#f6efe1]/70">
            <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 py-10 text-center md:flex-row md:justify-between md:px-12 md:text-left">
                <img
                    src="/brand/rebooked-logo-cream.png"
                    alt="Rebooked"
                    className="h-8 w-auto object-contain opacity-85"
                />
                <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
                    {footerLinks.map((link) => (
                        <Link key={link.to} to={link.to} className="transition-colors hover:text-[#f6efe1]">
                            {link.label}
                        </Link>
                    ))}
                </nav>
                <p className="text-sm text-[#f6efe1]/50">© {new Date().getFullYear()} Rebooked. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
