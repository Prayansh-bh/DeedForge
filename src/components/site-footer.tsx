import { Link } from "@tanstack/react-router";
import { registeredDeeds, unregisteredDeeds } from "@/lib/deed-data";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-background">
      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 font-serif text-lg font-bold">
              <span className="inline-block h-5 w-5 rounded-sm bg-foreground" aria-hidden />
              DeedForge
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Draft, customise and generate legally-formatted deeds and agreements in minutes.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider">Registered</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {registeredDeeds.slice(0, 5).map((d) => (
                <li key={d.slug}>
                  <Link
                    to="/deed/$slug"
                    params={{ slug: d.slug }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {d.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider">Unregistered</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {unregisteredDeeds.slice(0, 5).map((d) => (
                <li key={d.slug}>
                  <Link
                    to="/deed/$slug"
                    params={{ slug: d.slug }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {d.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider">Company</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link></li>
              <li><Link to="/about" className="text-muted-foreground hover:text-foreground">About Us</Link></li>
              <li><Link to="/testimonials" className="text-muted-foreground hover:text-foreground">Testimonials</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-foreground">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} DeedForge. All rights reserved.</p>
          <p>Generated documents are templates. Consult a qualified lawyer before execution.</p>
        </div>
      </div>
    </footer>
  );
}
