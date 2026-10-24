// Admin dashboard shell: access guard, sidebar navigation and the section routes.
import { NavLink, Routes, Route, Link } from "react-router-dom";
import { useAuth } from "../../lib/auth.jsx";
import AuthForm from "../../components/AuthForm.jsx";
import { Emblem, Wordmark } from "../../components/Logo.jsx";
import Overview from "./Overview.jsx";
import Orders from "./Orders.jsx";
import Customers from "./Customers.jsx";
import Waitlist from "./Waitlist.jsx";
import Wall from "./Wall.jsx";
import Media from "./Media.jsx";
import Design from "./Design.jsx";

const LINKS = [
  ["", "Overview"],
  ["orders", "Orders"],
  ["customers", "Customers"],
  ["waitlist", "Waitlist"],
  ["wall", "Owners wall"],
  ["media", "Media library"],
  ["design", "Design system"],
];

export default function AdminApp() {
  const { user, ready, logout } = useAuth();

  if (!ready) return <div className="min-h-screen bg-night-900" />;
  if (!user)
    return (
      <div className="flex min-h-screen items-center justify-center bg-night-900 px-5 py-16">
        <div className="w-full max-w-lg">
          <AuthForm title="RUBIIK admin" note="Sign in with an admin account to open the dashboard." />
        </div>
      </div>
    );
  if (!user.isAdmin)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-night-900 px-5 text-center">
        <Emblem className="h-12" />
        <h1 className="font-serif text-4xl">No admin access</h1>
        <p className="max-w-md text-ivory-dim">You're signed in as {user.email}, which isn't on the admin list.</p>
        <div className="flex gap-3">
          <Link to="/" className="btn-ghost">
            Back to the site
          </Link>
          <button onClick={logout} className="btn-gold">
            Switch account
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-night-900 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-ivory/10 bg-night-800 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-5 py-5 lg:flex-col lg:items-start lg:px-7 lg:py-8">
          <Link to="/admin" className="flex items-center gap-3">
            <Emblem className="h-7" />
            <span>
              <Wordmark className="block text-lg leading-none" />
              <span className="text-[9px] uppercase tracking-[0.35em] text-gold">Admin</span>
            </span>
          </Link>
          <Link to="/" className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute hover:text-gold lg:hidden">
            View site
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 [scrollbar-width:none] lg:flex-col lg:px-4 lg:pb-0 [&::-webkit-scrollbar]:hidden">
          {LINKS.map(([to, label]) => (
            <NavLink
              key={to}
              to={to ? `/admin/${to}` : "/admin"}
              end={!to}
              className={({ isActive }) =>
                `whitespace-nowrap px-3 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  isActive ? "bg-gold/10 text-gold" : "text-ivory/60 hover:bg-ivory/5 hover:text-ivory"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden px-7 py-8 text-xs text-ivory-mute lg:absolute lg:bottom-0 lg:block">
          <p className="truncate">{user.email}</p>
          <div className="mt-3 flex gap-4 uppercase tracking-[0.2em]">
            <Link to="/" className="hover:text-gold">
              View site
            </Link>
            <button onClick={logout} className="hover:text-gold">
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="orders" element={<Orders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="waitlist" element={<Waitlist />} />
          <Route path="wall" element={<Wall />} />
          <Route path="media" element={<Media />} />
          <Route path="design" element={<Design />} />
        </Routes>
      </main>
    </div>
  );
}
