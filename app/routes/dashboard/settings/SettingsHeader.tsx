import { NavLink } from "react-router";
import { cn } from "~/lib/utils";

const TABS = [
    { label: "Profile", to: "/dashboard/settings", end: true },
    { label: "Notifications", to: "/dashboard/settings/notifications" },
    { label: "Security", to: "/dashboard/settings/security" },
];

/** Title and Profile / Notifications / Security tabs shared by the settings pages. */
const SettingsHeader = ({ description }: { description: string }) => (
    <div>
        <h1 className="font-serif text-3xl md:text-4xl">Settings</h1>
        <p className="mt-1.5 text-foreground/60">{description}</p>
        <nav aria-label="Settings" className="mt-5 flex gap-6 border-b border-foreground/10">
            {TABS.map((tab) => (
                <NavLink
                    key={tab.to}
                    to={tab.to}
                    end={tab.end}
                    className={({ isActive }) =>
                        cn(
                            "-mb-px border-b-2 pb-2.5 text-[15px] transition-colors",
                            isActive
                                ? "border-primary font-semibold text-foreground"
                                : "border-transparent text-foreground/60 hover:text-foreground",
                        )
                    }
                >
                    {tab.label}
                </NavLink>
            ))}
        </nav>
    </div>
);

export default SettingsHeader;
