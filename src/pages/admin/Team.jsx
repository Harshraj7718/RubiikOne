// Team (owners only): add admins with their own username and password, change roles, deactivate,
// and set a new password. Every change is recorded in the activity log.
import { useState } from "react";
import { PageHeader, Panel, Loading, useAdminData, fmtDateTime } from "./ui.jsx";

async function send(url, method, body) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}

// A readable random password to hand to a new team member (they can change it under My account).
const LETTERS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
const makePassword = () => {
  const bytes = crypto.getRandomValues(new Uint32Array(16));
  return Array.from(bytes, (b, i) => (i && i % 4 === 0 ? "-" : "") + LETTERS[b % LETTERS.length]).join("");
};

const EMPTY = { username: "", name: "", role: "staff", password: "" };

export default function Team({ me }) {
  const state = useAdminData("/api/admin/team");
  const team = state.data?.team ?? [];
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState({ busy: false, error: "", created: null });
  const [rowMsg, setRowMsg] = useState({ error: "", info: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const add = async (e) => {
    e.preventDefault();
    setMsg({ busy: true, error: "", created: null });
    try {
      await send("/api/admin/team", "POST", form);
      setMsg({ busy: false, error: "", created: { username: form.username.toLowerCase(), password: form.password } });
      setForm(EMPTY);
      state.reload();
    } catch (err) {
      setMsg({ busy: false, error: err.message, created: null });
    }
  };

  const update = async (username, body, info) => {
    setRowMsg({ error: "", info: "" });
    try {
      await send(`/api/admin/team/${encodeURIComponent(username)}`, "PATCH", body);
      setRowMsg({ error: "", info });
      state.reload();
    } catch (err) {
      setRowMsg({ error: err.message, info: "" });
    }
  };

  return (
    <>
      <PageHeader title="Team" subtitle="Give each person their own admin login. Owners manage the team and see the activity log; staff can do everything else." />

      <Panel title="Add a team member" className="mb-8">
        <form onSubmit={add} className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute">Name</span>
            <input id="team-name" className="field" value={form.name} onChange={set("name")} required maxLength={60} />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute">Username</span>
            <input id="team-username" className="field lowercase" value={form.username} onChange={set("username")} required maxLength={32} placeholder="e.g. priya" />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute">Role</span>
            <select id="team-role" className="field bg-night-800" value={form.role} onChange={set("role")}>
              <option value="staff">Staff: orders, coupons, waitlist, wall</option>
              <option value="owner">Owner: also team and activity log</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ivory-mute">Temporary password (12+ characters)</span>
            <span className="flex items-end gap-3">
              <input id="team-password" className="field font-mono" value={form.password} onChange={set("password")} required minLength={12} />
              <button type="button" onClick={() => setForm((f) => ({ ...f, password: makePassword() }))} className="btn-ghost shrink-0 !px-4 !py-2.5">
                Generate
              </button>
            </span>
          </label>
          <div className="flex flex-wrap items-center gap-5 md:col-span-2">
            <button className="btn-gold !px-6 !py-3" disabled={msg.busy}>
              {msg.busy ? "Adding…" : "Add team member"}
            </button>
            {msg.error && <p className="text-sm text-red-300">{msg.error}</p>}
          </div>
          {msg.created && (
            <p className="border border-emerald-400/30 bg-emerald-400/5 px-4 py-3 text-sm text-ivory-dim md:col-span-2">
              Added <span className="font-mono text-ivory">{msg.created.username}</span>. Share the password{" "}
              <span className="select-all font-mono text-ivory">{msg.created.password}</span> with them privately; it isn't shown again. They can change it under My account.
            </p>
          )}
        </form>
      </Panel>

      {rowMsg.error && <p className="mb-4 text-sm text-red-300">{rowMsg.error}</p>}
      {rowMsg.info && <p className="mb-4 text-sm text-emerald-300">{rowMsg.info}</p>}
      <Loading state={state} empty={null}>
        <div className="overflow-x-auto border border-ivory/10">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-night-800 text-[10px] uppercase tracking-[0.18em] text-ivory-mute">
              <tr>
                <th className="px-4 py-3 font-normal">Person</th>
                <th className="px-4 py-3 font-normal">Role</th>
                <th className="px-4 py-3 font-normal">Last sign-in</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory/10">
              {team.map((m) => {
                const self = m.username === me.username;
                return (
                  <tr key={m.username}>
                    <td className="px-4 py-3">
                      {m.name} {self && <span className="text-xs text-gold">(you)</span>}
                      <span className="block font-mono text-xs text-ivory-mute">{m.username}</span>
                    </td>
                    <td className="px-4 py-3 capitalize">{m.builtIn ? "Owner (built-in)" : m.role}</td>
                    <td className="px-4 py-3 text-ivory-mute">{m.builtIn ? "—" : fmtDateTime(m.lastLoginAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block border px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] ${m.active ? "border-emerald-400/40 text-emerald-300" : "border-ivory/20 text-ivory-mute"}`}>
                        {m.active ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-[11px] uppercase tracking-[0.15em]">
                      {m.builtIn ? (
                        <span className="normal-case tracking-normal text-ivory-mute">Set in the server environment</span>
                      ) : (
                        <span className="flex justify-end gap-4">
                          {!self && (
                            <button className="text-ivory-dim hover:text-gold" onClick={() => update(m.username, { role: m.role === "owner" ? "staff" : "owner" }, `${m.name} is now ${m.role === "owner" ? "staff" : "an owner"}.`)}>
                              Make {m.role === "owner" ? "staff" : "owner"}
                            </button>
                          )}
                          <button
                            className="text-ivory-dim hover:text-gold"
                            onClick={() => {
                              const password = makePassword();
                              update(m.username, { password }, `New password for ${m.name}: ${password} (share it privately; they're signed out until they use it).`);
                            }}
                          >
                            New password
                          </button>
                          {!self && (
                            <button className="text-ivory-dim hover:text-red-300" onClick={() => update(m.username, { active: !m.active }, m.active ? `${m.name} is deactivated and signed out.` : `${m.name} can sign in again.`)}>
                              {m.active ? "Deactivate" : "Reactivate"}
                            </button>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Loading>
    </>
  );
}
