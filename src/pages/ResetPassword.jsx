// Choose a new password from an emailed link: /reset-password#<token>.
// The token lives in the URL fragment, so it never reaches server logs; it is used once.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [token] = useState(() => window.location.hash.slice(1));
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [state, setState] = useState({ busy: false, error: "" });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setState({ busy: false, error: "The two passwords don't match." });
    setState({ busy: true, error: "" });
    try {
      await resetPassword(token, form.password);
      // Drop the used token from the address bar, then go to the account.
      window.history.replaceState(null, "", "/reset-password");
      navigate("/account");
    } catch (err) {
      setState({ busy: false, error: err.message });
    }
  };

  const input = (key, label) => (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input
        id={`reset-${key}`}
        className="field"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </label>
  );

  return (
    <section className="mx-auto flex min-h-screen max-w-xl items-center px-5 pb-24 pt-36">
      <div className="frame-royal w-full bg-night-800/70 p-7 sm:p-10">
        <p className="eyebrow text-gold">RUBIIK account</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl">Choose a new password</h1>
        {!token ? (
          <p className="mt-6 text-ivory-dim">
            This page needs the link from your reset email. You can request a new one from{" "}
            <Link to="/account" className="text-gold underline underline-offset-4">
              sign in
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-7">
            {input("password", "New password (at least 8 characters)")}
            {input("confirm", "Repeat new password")}
            {state.error && <p className="text-sm text-red-300">{state.error}</p>}
            <button className="btn-gold w-full" disabled={state.busy}>
              {state.busy ? "Saving…" : "Save and sign in"}
            </button>
            <p className="text-xs text-ivory-mute">For your security, you'll be signed out on every other device.</p>
          </form>
        )}
      </div>
    </section>
  );
}
