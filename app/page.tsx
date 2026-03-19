import Link from "next/link";

// ── Static data ──────────────────────────────────────────────────────────────

const socialProof = [
  { metric: "4.2x", label: "ROAS", client: "Fashion Brand" },
  { metric: "$2.1M", label: "Revenue Attributed", client: "Home Goods Store" },
  { metric: "312%", label: "Revenue Growth YoY", client: "Beauty Brand" },
  { metric: "$0.38", label: "Cost Per Click", client: "Apparel DTC" },
];

const problems = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Wasted Ad Spend With No Clear ROI",
    body: "You're pouring budget into Meta campaigns that show big impressions but tiny returns. Every month feels like another expensive experiment with no real learning.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Agencies That Ghost You After Onboarding",
    body: "You've hired agencies that promised the world, then went quiet after the first invoice. No reporting, no strategy updates, no accountability.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: "Scaling Feels Impossible Past a Ceiling",
    body: "Your ads work at $5K/month but fall apart at $20K. You can't figure out what breaks, and every attempt to scale just increases your losses.",
  },
];

const systemSteps = [
  {
    number: "01",
    title: "Deep-Dive Audit",
    body: "We analyze your existing ad account, creatives, funnel, and benchmarks. You get a clear diagnosis — what's broken, what's working, and exactly what to fix.",
  },
  {
    number: "02",
    title: "Campaign Architecture",
    body: "We build a full-funnel Meta Ads structure designed around your unit economics — ROAS targets, CPP thresholds, and creative cadence.",
  },
  {
    number: "03",
    title: "Creative-Led Testing",
    body: "We produce and test campaign briefs weekly. Every creative has a hypothesis. Losers get cut fast; winners get scaled with precision.",
  },
  {
    number: "04",
    title: "Transparent Reporting",
    body: "Weekly reports, monthly strategy calls, and your own client portal — so you always know where your money is going and what it's returning.",
  },
];

const features = [
  { title: "Weekly Performance Reports", body: "Automated reports delivered every Monday with spend, ROAS, revenue, and key insights." },
  { title: "Campaign Briefs with Approval", body: "Every creative direction is documented. You review and approve briefs before production begins." },
  { title: "Dedicated Client Portal", body: "Real-time access to your campaigns, creatives, metrics, and message thread — any time." },
  { title: "Meta Ads Expert Assigned", body: "A dedicated media buyer manages your account — not a generalist, not a junior account manager." },
  { title: "Slack / Async Communication", body: "Direct messaging in your portal. Responses within one business day, guaranteed." },
  { title: "Monthly Strategy Calls", body: "Deep-dive strategy reviews each month to align on wins, pivots, and next-quarter goals." },
];

// ── Subcomponents ─────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header
      className="fixed top-0 inset-x-0 z-50"
      style={{ background: "rgba(15,17,23,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(37,42,56,0.8)" }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-coral)" }}
          >
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M4 20 C7 14, 10 18, 14 12 C18 6, 21 14, 24 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M4 24 C7 18, 11 22, 14 17 C17 12, 21 18, 24 15" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <span className="text-white font-bold text-base tracking-tight">REEF NTWRKS</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#problem" className="text-sm text-gray-400 hover:text-white transition-colors">Why Us</a>
          <a href="#system" className="text-sm text-gray-400 hover:text-white transition-colors">Our Process</a>
          <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">What You Get</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
            Login
          </Link>
          <Link
            href="/intake"
            className="text-sm font-semibold px-5 py-2.5 rounded-lg transition-all"
            style={{ background: "var(--color-coral)", color: "white" }}
          >
            Book a Free Audit
          </Link>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer style={{ background: "var(--color-navy)", borderTop: "1px solid var(--color-navy-border)" }}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--color-coral)" }}>
                <svg width="15" height="15" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path d="M4 20 C7 14, 10 18, 14 12 C18 6, 21 14, 24 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M4 24 C7 18, 11 22, 14 17 C17 12, 21 18, 24 15" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              <span className="text-white font-bold text-sm tracking-tight">REEF NTWRKS</span>
            </div>
            <p className="text-sm max-w-xs" style={{ color: "var(--color-text-subtle)" }}>
              Performance Meta Ads for e-commerce brands ready to scale.
            </p>
          </div>
          <div className="flex gap-12">
            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Company</p>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm hover:text-white transition-colors" style={{ color: "var(--color-text-subtle)" }}>About</a></li>
                <li><a href="#" className="text-sm hover:text-white transition-colors" style={{ color: "var(--color-text-subtle)" }}>Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Client</p>
              <ul className="space-y-2">
                <li><Link href="/login" className="text-sm hover:text-white transition-colors" style={{ color: "var(--color-text-subtle)" }}>Portal Login</Link></li>
                <li><Link href="/intake" className="text-sm hover:text-white transition-colors" style={{ color: "var(--color-text-subtle)" }}>Book an Audit</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t mt-10 pt-6 flex flex-col sm:flex-row justify-between gap-2" style={{ borderColor: "var(--color-navy-border)" }}>
          <p className="text-xs" style={{ color: "var(--color-text-subtle)" }}>© {new Date().getFullYear()} Reef Ntwrks. All rights reserved.</p>
          <p className="text-xs" style={{ color: "var(--color-text-subtle)" }}>Privacy Policy · Terms of Service</p>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-navy)", color: "white" }}>
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background glows */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background: "radial-gradient(ellipse at 15% 60%, rgba(255,107,71,0.12) 0%, transparent 55%), radial-gradient(ellipse at 85% 20%, rgba(45,212,191,0.07) 0%, transparent 50%)",
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            style={{ background: "var(--color-coral-muted)", color: "var(--color-coral)", border: "1px solid rgba(255,107,71,0.3)" }}
          >
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--color-coral)" }} />
            Meta Ads · E-Commerce Growth
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
            Scale Your E-Commerce Brand<br className="hidden sm:block" />
            <span style={{ color: "var(--color-coral)" }}> with Paid Ads That Actually Work</span>
          </h1>
          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "var(--color-text-subtle)" }}>
            Reef Ntwrks manages Meta Ads for performance-obsessed e-commerce brands. We build full-funnel campaigns backed by data, creative strategy, and radical transparency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/intake"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: "var(--color-coral)", color: "white", boxShadow: "0 8px 24px rgba(255,107,71,0.35)" }}
            >
              Book a Free Audit
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a
              href="#system"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-medium border transition-all hover:bg-white/5"
              style={{ borderColor: "var(--color-navy-border)", color: "var(--color-text-subtle)" }}
            >
              See Our Process
            </a>
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="py-16 px-6" style={{ background: "var(--color-navy-light)", borderTop: "1px solid var(--color-navy-border)", borderBottom: "1px solid var(--color-navy-border)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs uppercase tracking-widest font-semibold mb-10" style={{ color: "var(--color-text-subtle)" }}>
            Results from clients we've scaled
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {socialProof.map((item) => (
              <div
                key={item.label}
                className="text-center p-6 rounded-xl"
                style={{ background: "var(--color-navy)", border: "1px solid var(--color-navy-border)" }}
              >
                <div className="text-3xl sm:text-4xl font-bold mb-1" style={{ color: "var(--color-coral)" }}>{item.metric}</div>
                <div className="text-sm font-medium text-white mb-1">{item.label}</div>
                <div className="text-xs" style={{ color: "var(--color-text-subtle)" }}>{item.client}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Problem ── */}
      <section id="problem" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "var(--color-coral)" }}>The Problem</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Most e-commerce brands are bleeding money on ads</h2>
            <p className="mt-4 max-w-xl mx-auto" style={{ color: "var(--color-text-subtle)" }}>
              It's not your product. It's the way your campaigns are structured, managed, and iterated.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {problems.map((p) => (
              <div
                key={p.title}
                className="p-7 rounded-2xl"
                style={{ background: "var(--color-navy-light)", border: "1px solid var(--color-navy-border)" }}
              >
                <div className="mb-4 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--color-coral-muted)", color: "var(--color-coral)" }}>
                  {p.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{p.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-subtle)" }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The System ── */}
      <section id="system" className="py-24 px-6" style={{ background: "var(--color-navy-light)", borderTop: "1px solid var(--color-navy-border)", borderBottom: "1px solid var(--color-navy-border)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "var(--color-coral)" }}>The System</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">A repeatable process built for scale</h2>
            <p className="mt-4 max-w-xl mx-auto" style={{ color: "var(--color-text-subtle)" }}>
              Every client goes through the same proven framework — from audit to profitable scaling.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {systemSteps.map((step) => (
              <div key={step.number} className="relative">
                <div
                  className="p-6 rounded-2xl h-full"
                  style={{ background: "var(--color-navy)", border: "1px solid var(--color-navy-border)" }}
                >
                  <div className="text-4xl font-black mb-4" style={{ color: "rgba(255,107,71,0.2)" }}>{step.number}</div>
                  <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-subtle)" }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What You Get ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "var(--color-coral)" }}>What You Get</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Everything you need, nothing you don't</h2>
            <p className="mt-4 max-w-xl mx-auto" style={{ color: "var(--color-text-subtle)" }}>
              A full-service engagement built around transparency, communication, and results.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl flex gap-4"
                style={{ background: "var(--color-navy-light)", border: "1px solid var(--color-navy-border)" }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--color-coral)" }}>
                    <svg className="w-3 h-3" fill="none" stroke="white" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-subtle)" }}>{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        className="py-24 px-6"
        style={{
          background: "var(--color-navy-light)",
          borderTop: "1px solid var(--color-navy-border)",
        }}
      >
        <div
          className="max-w-3xl mx-auto text-center rounded-3xl px-8 py-16 relative overflow-hidden"
          style={{
            background: "var(--color-navy)",
            border: "1px solid var(--color-navy-border)",
            boxShadow: "0 0 80px rgba(255,107,71,0.1)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,107,71,0.15) 0%, transparent 60%)" }}
          />
          <div className="relative">
            <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: "var(--color-coral)" }}>Ready to scale?</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Let's find out if we're the right fit</h2>
            <p className="max-w-lg mx-auto mb-10" style={{ color: "var(--color-text-subtle)" }}>
              Book a free 30-minute audit. We'll review your ad account, identify the biggest opportunities, and give you an honest assessment — no fluff, no sales pressure.
            </p>
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl text-base font-semibold transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: "var(--color-coral)", color: "white", boxShadow: "0 8px 24px rgba(255,107,71,0.35)" }}
            >
              Book a Free Audit
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
