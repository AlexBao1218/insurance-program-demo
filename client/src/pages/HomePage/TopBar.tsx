import { useCurrentUserProfile } from '@lark-apaas/client-toolkit/hooks/useCurrentUserProfile';
import { Image } from '@client/src/components/ui/image';
import { ShieldCheck } from 'lucide-react';
import { PROGRAM_NAME } from '@/lib/brand';

export default function TopBar() {
  const profile = useCurrentUserProfile();

  return (
    <header
      className="hp-topbar sticky top-0 z-10 flex items-center justify-between"
      style={{
        height: 48,
        padding: '0 20px',
        background: 'rgba(251,251,253,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, fontWeight: 500 }}>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <ShieldCheck className="size-4" aria-hidden="true" />
        </div>
        <span className="text-base">{PROGRAM_NAME}</span>
      </div>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#e8e8ed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {profile?.avatar ? (
          <Image
            src={profile.avatar}
            alt=""
            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6e6e73"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8.5" r="3.5" />
            <path d="M5 20c1.3-3 3.9-4.5 7-4.5s5.7 1.5 7 4.5" />
          </svg>
        )}
      </div>
    </header>
  );
}
