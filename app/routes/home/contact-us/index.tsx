import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { isValidEmail } from "~/utils/auth";

const EMPTY = { name: "", email: "", message: "" };

const ContactUsPage = () => {
    const [submitting, setSubmitting] = useState(false);
    const [params] = useSearchParams();
    // "Report this seller" (seller page) arrives with ?subject=report&seller=<id>.
    const reportedSeller = params.get("subject") === "report" ? params.get("seller") : null;
    const [form, setForm] = useState(() =>
        reportedSeller
            ? { ...EMPTY, message: `I'd like to report a seller (seller page: /seller/${reportedSeller}).\n\nWhat happened: ` }
            : EMPTY,
    );
    const canSubmit = form.name.trim().length > 0 && isValidEmail(form.email) && form.message.trim().length > 0 && !submitting;
    const bind = (key: keyof typeof EMPTY) => ({
        value: form[key],
        onChange: (event: { target: { value: string } }) => setForm((current) => ({ ...current, [key]: event.target.value })),
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            toast.success("Message sent — we'll get back to you within a day or two.");
            setForm(EMPTY);
        }, 700);
    };

    return (
        <div className="mx-auto grid max-w-5xl gap-12 px-6 py-16 md:grid-cols-2 md:px-12 md:py-24">
            <div>
                <span className="text-xs font-semibold tracking-[0.16em] text-destructive uppercase">Get in touch</span>
                <h1 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">We'd like to hear from you.</h1>
                <p className="mt-6 leading-relaxed text-foreground/70">
                    Questions about a book, a report about another user, or feedback on Rebooked itself — send it our way
                    and a real person will read it.
                </p>
                <div className="mt-8 flex flex-col gap-4 text-sm text-foreground/65">
                    <div>
                        <div className="font-semibold text-foreground">Email</div>
                        <div>hello@rebooked.co</div>
                    </div>
                    <div>
                        <div className="font-semibold text-foreground">Response time</div>
                        <div>Usually within 1–2 business days</div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 md:p-8">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" placeholder="Thandi Mokoena" required {...bind("name")} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="you@example.com" required {...bind("email")} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="message">Message</Label>
                    <textarea
                        id="message"
                        name="message"
                        required
                        {...bind("message")}
                        rows={5}
                        placeholder="How can we help?"
                        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                </div>
                <Button type="submit" disabled={!canSubmit} className="h-11 rounded-lg bg-primary font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90">
                    {submitting ? "Sending…" : "Send message"}
                </Button>
            </form>
        </div>
    );
};

export default ContactUsPage;
