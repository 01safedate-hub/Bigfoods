'use client';

export default function ZoneMap() {
  // Minimal map placeholder. The real app can replace this with react-leaflet usage.
  return (
    <div className="w-full" style={{height: 460}}>
      <div className="w-full h-full rounded-[8px] bg-[linear-gradient(90deg,#fff,#fafafa)] border" style={{border: '1px solid var(--line)'}}>
        <div className="flex items-center justify-center h-full text-[13px]" style={{color: 'var(--gray)'}}>Interactive map placeholder</div>
      </div>
    </div>
  );
}
