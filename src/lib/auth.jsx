// Signed-in customer, shared across the app. The session itself lives in an httpOnly cookie.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

async function post(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? "Something went wrong. Please try again."), { fields: data.fields ?? [] });
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email, password) => setUser((await post("/api/auth/login", { email, password })).user), []);
  const register = useCallback(async (name, email, password) => setUser((await post("/api/auth/register", { name, email, password })).user), []);
  const logout = useCallback(async () => {
    await post("/api/auth/logout");
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, register, logout }), [user, ready, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** "Harsh Raj" → "Harsh R." — the default name shown on the public owners wall. */
export const shortName = (name = "") => {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0].toUpperCase()}.` : first ?? "";
};
