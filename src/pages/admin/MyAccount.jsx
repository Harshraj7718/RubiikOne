// My account: who you're signed in as, and a password change for team members.
import { useState } from "react";
import { PageHeader, Panel } from "./ui.jsx";

export default function MyAccount({ me }) {
  const [form, setForm] = useState({ current: "", next: "", repeat: "" });
  const [state, setState] = useState({ busy: false, error: "", done: false });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.next !== form.repeat) return setState({ busy: false, error: "The new passwords don't match.", done: false });
    setState({ busy: true, error: "", done: false });
    try {
      const res = await fetch("/api/admin/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current: form.current, next: form.next }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't change the password.");
      setForm({ current: "", next: "", repeat: "" });
      setState({ busy: false, error: "", done: true });
    } catch (err) {
      setState({ busy: false, error: err.message, done: false });
    }
  };

  return (
    <>
      <PageHeader title="My account" subtitle={`Signed in as ${me.name} (${me.username}) · ${me.builtIn ? "built-in owner" : me.role}`} />
      <Panel title="Change password" className="max-w-xl">
        {me.builtIn ? (
          <p className="text-sm text-ivory-dim">The built-in owner's password is set in the server environment as ADMIN_PASSWORD. Change it there (and in Vercel), then redeploy.</p>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {[
              ["current", "Current password", "current-password"],
              ["next", "New password (12+ characters)", "new-password"],
              ["repeat", "Repeat new password", "new-password"],
            ].map(([k, label, ac]) => (
              <label key={k} className="block">
                <span className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute">{label}</span>
                <input id={`my-${k}`} className="field" type="password" autoComplete={ac} value={form[k]} onChange={set(k)} required minLength={k === "current" ? 1 : 12} />
              </label>
            ))}
            <button className="btn-gold !px-6 !py-3" disabled={state.busy}>
              {state.busy ? "Saving…" : "Change password"}
            </button>
            {state.done && <p className="text-sm text-emerald-300">Password changed. Your other sessions were signed out.</p>}
            {state.error && <p className="text-sm text-red-300">{state.error}</p>}
          </form>
        )}
      </Panel>
    </>
  );
}
