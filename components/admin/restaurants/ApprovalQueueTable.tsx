'use client';

export default function ApprovalQueueTable({ items = [], loading = false }: any) {
  return (
    <div>
      <div className="w-full overflow-auto">
        <table className="w-full text-left" style={{borderCollapse: 'separate', borderSpacing: '0 8px'}}>
          <thead className="sr-only">
            <tr>
              <th>Name</th>
              <th>Zone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={3} className="py-4">Loading…</td></tr>}
            {!loading && items.length === 0 && (
              <tr><td colSpan={3} className="py-4 text-[13px] text-[var(--gray)]">No restaurants awaiting approval</td></tr>
            )}
            {!loading && items.map((r: any) => (
              <tr key={r.id} className="bg-white" style={{border: '1px solid var(--line)', borderRadius: 8}}>
                <td className="py-3 px-3">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-[11px]" style={{color: 'var(--gray)'}}>{r.owner_name ?? 'Owner'}</div>
                </td>
                <td className="py-3 px-3 text-[13px]" style={{color: 'var(--gray)'}}>{r.zone ?? '—'}</td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button className="px-3 py-1 rounded-md text-[13px]" style={{border: '1px solid var(--line)'}}>Reject</button>
                    <button className="px-3 py-1 rounded-md bg-[var(--orange)] text-white text-[13px]">Approve</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
