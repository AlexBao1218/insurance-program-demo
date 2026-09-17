export default function DealerCard() {
  return (
    <div
      aria-disabled="true"
      title="Not included in this demo"
      className="hp-card hp-card--disabled"
      style={{
        position: 'relative',
        overflow: 'hidden',
        height: 264,
        borderRadius: 22,
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'not-allowed',
        background: '#F7EFE2',
        opacity: 0.6,
        textAlign: 'left',
        border: 'none',
        userSelect: 'none',
      }}
    >
      <svg
        className="hp-art-d"
        style={{ position: 'absolute', right: -100, bottom: -120, display: 'none' }}
        width="380"
        height="380"
        viewBox="0 0 380 380"
        fill="none"
      >
        <line x1="-260" y1="380" x2="120" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="-220" y1="380" x2="160" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="-180" y1="380" x2="200" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="-140" y1="380" x2="240" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="-100" y1="380" x2="280" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="-60" y1="380" x2="320" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="-20" y1="380" x2="360" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="20" y1="380" x2="400" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="60" y1="380" x2="440" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="100" y1="380" x2="480" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="140" y1="380" x2="520" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="180" y1="380" x2="560" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
      </svg>
      <svg
        className="hp-art-m"
        style={{ position: 'absolute', right: -70, bottom: -90 }}
        width="280"
        height="280"
        viewBox="0 0 280 280"
        fill="none"
      >
        <line x1="-180" y1="280" x2="100" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="-148" y1="280" x2="132" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="-116" y1="280" x2="164" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="-84" y1="280" x2="196" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="-52" y1="280" x2="228" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="-20" y1="280" x2="260" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="12" y1="280" x2="292" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="44" y1="280" x2="324" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="76" y1="280" x2="356" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
        <line x1="108" y1="280" x2="388" y2="0" stroke="#C08A3E" strokeWidth="1" opacity="0.22" />
      </svg>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span
            className="hp-name text-3xl"
            style={{
              color: '#63400C',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            Dealer
          </span>
          <span
            className="hp-sub"
            style={{ color: '#9A6B2E', fontSize: 15, fontWeight: 500 }}
          >
            Insurance Program
          </span>
        </div>
        <span
          style={{
            flexShrink: 0,
            padding: '4px 10px',
            borderRadius: 999,
            border: '1px solid rgba(99,64,12,0.28)',
            color: 'rgba(99,64,12,0.8)',
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          Not included in this demo
        </span>
      </div>

      <div style={{ flexGrow: 1 }} />

      <div
        className="hp-foot"
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div style={{ height: 1, background: 'rgba(99,64,12,0.16)' }} />
        <span
          className="hp-meta"
          style={{
            color: 'rgba(99,64,12,0.72)',
            fontSize: 13,
            fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          69 Dealers · 145 Claims
        </span>
      </div>
    </div>
  );
}
