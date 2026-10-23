import { usePortfolioReady } from '@/lib/usePortfolioReady';
import DemoFooter from '@/components/DemoFooter';
import TopBar from './TopBar';
import ProgramCard from './ProgramCard';
import DealerCard from './DealerCard';

export default function HomePage() {
  usePortfolioReady(true);
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f5f7',
        color: '#1d1d1f',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, system-ui, sans-serif",
      }}
    >
      <style>{`
        @media (min-width: 769px) {
          .hp-topbar { height: 52px !important; padding: 0 48px !important; }
          .hp-title { margin-top: 104px !important; font-size: 52px !important; line-height: 1 !important; }
          .hp-cards { margin-top: 72px !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 28px !important; }
          .hp-card { height: 420px !important; border-radius: 24px !important; padding: 40px !important; }
          .hp-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
          .hp-card:hover .hp-arrow { transform: translate(2px, -2px); }
          .hp-card--disabled:hover { transform: none; box-shadow: none; }
          .hp-art-d { display: block !important; }
          .hp-art-m { display: none !important; }
          .hp-name { font-size: 46px !important; }
          .hp-sub { font-size: 17px !important; }
          .hp-foot { gap: 14px !important; }
          .hp-meta { font-size: 14px !important; }
        }
      `}</style>

      <TopBar />

      <h1
        className="hp-title text-3xl"
        style={{
          marginTop: 52,
          marginBottom: 0,
          textAlign: 'center',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        Insurance Management
      </h1>

      <div
        className="hp-cards"
        style={{
          maxWidth: 1000,
          margin: '44px auto 80px',
          padding: '0 20px',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 18,
        }}
      >
        <ProgramCard />
        <DealerCard />
      </div>

      <DemoFooter />
    </div>
  );
}
