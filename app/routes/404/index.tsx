import { Link } from 'react-router'
import { Button } from '~/components/ui/button'

const NotFoundPage = () => {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 py-16 text-center">
            <img src="/brand/rebooked-logo-ink.png" alt="Rebooked" className="h-9 w-auto object-contain" />
            <div className="font-serif text-7xl text-foreground/20 md:text-8xl">404</div>
            <h1 className="max-w-lg font-serif text-3xl leading-tight text-balance md:text-4xl">
                This page isn't on any of our shelves
            </h1>
            <p className="max-w-md leading-relaxed text-foreground/65">
                The link may be mistyped, or the page has moved. Let's get you back to the shelf.
            </p>
            <Button asChild size="lg" className="h-12 rounded-lg bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90">
                <Link to="/">Back to home</Link>
            </Button>
        </div>
    )
}

export default NotFoundPage