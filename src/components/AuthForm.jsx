// Sign in / create account, used by the checkout and the account page.
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/auth.jsx";
import { ease } from "./motion.jsx";

export default function AuthForm({ title = "Sign in to your RUBIIK account", note }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [state, setState] = useState({ busy: false, error: "", fields: [] });

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: "", fields: [] });
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
    } catch (err) {
      setState({ busy: false, error: err.message, fields: err.fields ?? [] });
    }
  };

  const field = (key, label, type, autoComplete) => (
    <label className="block">
      <span className={`eyebrow ${state.fields.includes(key) ? "!text-red-300" : ""}`}>{label}</span>
      <input
        className={`field ${state.fields.includes(key) ? "!border-red-300" : ""}`}
        type={type}
        autoComplete={autoComplete}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        required
        minLength={key === "password" && mode === "register" ? 8 : undefined}
      />
    </label>
  );

  return (
    <div className="frame-royal bg-night-800/70 p-7 sm:p-10">
      <p className="eyebrow text-gold">RUBIIK account</p>
      <h2 className="mt-3 font-serif text-3xl sm:text-4xl">{title}</h2>
      {note && <p className="mt-3 text-ivory-dim">{note}</p>}

      <div className="mt-8 flex border-b border-ivory/15">
        {[
          ["login", "Sign in"],
          ["register", "Create account"],
        ].map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setState({ busy: false, error: "", fields: [] });
            }}
            className={`relative mr-8 whitespace-nowrap px-1 pb-3 text-[11px] uppercase tracking-wide2 transition-colors ${mode === m ? "text-ivory" : "text-ivory-mute hover:text-ivory"}`}
          >
            {label}
            {mode === m && <motion.span layoutId="auth-tab" className="bg-gold absolute inset-x-0 -bottom-px h-px" />}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-8 space-y-7" noValidate>
        <AnimatePresence initial={false}>
          {mode === "register" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.5, ease }}>
              {field("name", "Full name", "text", "name")}
            </motion.div>
          )}
        </AnimatePresence>
        {field("email", "Email", "email", "email")}
        {field("password", mode === "register" ? "Password (at least 8 characters)" : "Password", "password", mode === "register" ? "new-password" : "current-password")}
        {state.error && <p className="text-sm text-red-300">{state.error}</p>}
        <button className="btn-gold w-full" disabled={state.busy}>
          {state.busy ? "One moment…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
