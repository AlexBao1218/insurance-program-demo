import { Link } from 'react-router-dom';
import { PROGRAM_SHORT } from '@/lib/brand';

export default function ProgramCard() {
  return (
    <Link
      to="/dashboard"
      className="hp-card"
      style={{
        position: 'relative',
        overflow: 'hidden',
        height: 264,
        borderRadius: 22,
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        background: '#E9F1F9',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        textDecoration: 'none',
      }}
    >
      <svg
        className="hp-art-d"
        style={{ position: 'absolute', right: -120, bottom: -140, display: 'none' }}
        width="400"
        height="400"
        viewBox="0 0 400 400"
        fill="none"
      >
        <circle cx="200" cy="200" r="62" stroke="#4E85B8" strokeWidth="1" opacity="0.38" />
        <circle cx="200" cy="200" r="98" stroke="#4E85B8" strokeWidth="1" opacity="0.32" />
        <circle cx="200" cy="200" r="134" stroke="#4E85B8" strokeWidth="1" opacity="0.26" />
        <circle cx="200" cy="200" r="168" stroke="#4E85B8" strokeWidth="1" opacity="0.20" />
        <circle cx="200" cy="200" r="198" stroke="#4E85B8" strokeWidth="1" opacity="0.14" />
      </svg>
      <svg
        className="hp-art-m"
        style={{ position: 'absolute', right: -90, bottom: -110 }}
        width="280"
        height="280"
        viewBox="0 0 280 280"
        fill="none"
      >
        <circle cx="140" cy="140" r="44" stroke="#4E85B8" strokeWidth="1" opacity="0.38" />
        <circle cx="140" cy="140" r="70" stroke="#4E85B8" strokeWidth="1" opacity="0.32" />
        <circle cx="140" cy="140" r="96" stroke="#4E85B8" strokeWidth="1" opacity="0.26" />
        <circle cx="140" cy="140" r="120" stroke="#4E85B8" strokeWidth="1" opacity="0.20" />
        <circle cx="140" cy="140" r="139" stroke="#4E85B8" strokeWidth="1" opacity="0.14" />
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
              color: '#10395C',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            Internal
          </span>
          <span
            className="hp-sub"
            style={{ color: '#3A6B99', fontSize: 15, fontWeight: 500 }}
          >
            {PROGRAM_SHORT}
          </span>
        </div>
        <svg
          className="hp-arrow"
          style={{ flexShrink: 0, transition: 'transform 0.2s ease' }}
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#10395C"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 17L17 7" />
          <path d="M8 7h9v9" />
        </svg>
      </div>

      <div style={{ flexGrow: 1 }} />

      <div
        className="hp-foot"
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div style={{ height: 1, background: 'rgba(16,57,92,0.16)' }} />
        <span
          className="hp-meta"
          style={{
            color: 'rgba(16,57,92,0.72)',
            fontSize: 13,
            fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          34 Classes · 767 Claims
        </span>
      </div>
    </Link>
  );
}
