import { PASSWORD_RULES } from "~/utils/auth";

/** The live ✓/○ checklist under a new-password field. Matches the backend rule. */
const PasswordRules = ({ password, className }: { password: string; className?: string }) => (
    <ul className={className ?? "grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3"}>
        {PASSWORD_RULES.map((rule) => {
            const met = rule.test(password);
            return (
                <li key={rule.label} aria-label={`${rule.label}: ${met ? "met" : "not met"}`} className={met ? "text-olive" : "text-foreground/45"}>
                    {met ? "✓" : "○"} {rule.label}
                </li>
            );
        })}
    </ul>
);

export default PasswordRules;
