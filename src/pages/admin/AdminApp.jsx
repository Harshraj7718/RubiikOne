// Admin dashboard shell: admin sign-in, sidebar navigation and the section routes.
// The dashboard uses its own admin username/password, separate from customer accounts.
import { useEffect, useState } from "react";
import { NavLink, Routes, Route, Link } from "react-router-dom";
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
  const [state, setState] = useState({ checked: false, admin: null, configured: true });

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => setState({ checked: true, admin: d.admin ?? null, configured: d.configured !== false }))
      .catch(() => setState({ checked: true, admin: null, configured: true }));
  }, []);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    setState((s) => ({ ...s, admin: null }));
  };

  if (!state.checked) return <div className="min-h-screen bg-night-900" />;
  if (!state.admin) return <AdminLogin configured={state.configured} onLogin={(admin) => setState((s) => ({ ...s, admin }))} />;
  const user = { email: state.admin.username };

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

function AdminLogin({ configured, onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [state, setState] = useState({ busy: false, error: "" });

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: "" });
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't sign in.");
      onLogin(data.admin);
    } catch (err) {
      setState({ busy: false, error: err.message });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-night-900 px-5 py-16">
      <form onSubmit={submit} className="frame-royal w-full max-w-md bg-night-800/70 p-8 sm:p-10">
        <div className="flex items-center gap-3">
          <Emblem className="h-8" />
          <span>
            <Wordmark className="block text-xl leading-none" />
            <span className="text-[9px] uppercase tracking-[0.35em] text-gold">Admin</span>
          </span>
        </div>
        <h1 className="mt-8 font-serif text-4xl">Dashboard sign-in</h1>
        {!configured && <p className="mt-4 text-sm text-red-300">Admin login isn't set up on this server yet: add ADMIN_USERNAME and ADMIN_PASSWORD to its environment.</p>}
        <label className="mt-8 block">
          <span className="eyebrow">Username</span>
          <input className="field" autoComplete="username" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required />
        </label>
        <label className="mt-6 block">
          <span className="eyebrow">Password</span>
          <input className="field" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
        </label>
        {state.error && <p className="mt-5 text-sm text-red-300">{state.error}</p>}
        <button className="btn-gold mt-8 w-full" disabled={state.busy || !configured}>
          {state.busy ? "Signing in…" : "Sign in"}
        </button>
        <Link to="/" className="mt-6 block text-center text-[10px] uppercase tracking-[0.2em] text-ivory-mute hover:text-gold">
          Back to the site
        </Link>
      </form>
    </div>
  );
}
