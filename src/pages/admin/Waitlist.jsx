import { PageHeader, Loading, useAdminData, fmtDateTime } from "./ui.jsx";

export default function Waitlist() {
  const state = useAdminData("/api/admin/waitlist");
  const list = state.data?.waitlist ?? [];

  return (
    <>
      <PageHeader
        title="Waitlist"
        subtitle={`${list.length} ${list.length === 1 ? "person" : "people"} asked to hear when pre-booking opens.`}
        actions={
          <a href="/api/admin/waitlist.csv" className="btn-ghost !px-5 !py-3">
            Export CSV
          </a>
        }
      />
      <Loading state={state} empty={!state.loading && !list.length ? "No one has joined the waitlist yet." : null}>
        <div className="overflow-x-auto border border-ivory/10">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="bg-night-800 text-[10px] uppercase tracking-[0.18em] text-ivory-mute">
              <tr>
                <th className="px-4 py-3 font-normal">Email</th>
                <th className="px-4 py-3 font-normal">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory/10">
              {list.map((w) => (
                <tr key={w.email}>
                  <td className="px-4 py-3">{w.email}</td>
                  <td className="px-4 py-3 text-ivory-mute">{fmtDateTime(w.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Loading>
    </>
  );
}
