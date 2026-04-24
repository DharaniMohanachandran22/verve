import Link from 'next/link';
import { Sparkles, Shield, Rocket, ChevronDown, Layout, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20 gradient-lush noise">
      <header className="fixed top-0 z-50 w-full border-b border-border glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-12">
          <div className="flex items-center gap-3 font-serif text-2xl font-bold tracking-tight text-primary">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-success shadow-lg shadow-primary/20 transition-luxury hover:rotate-12">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-br from-primary to-foreground bg-clip-text text-transparent">Verve</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-bold text-secondary transition-luxury hover:text-primary hover:scale-105">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-primary px-6 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-luxury hover:scale-105 hover:bg-primary/90 hover:shadow-primary/40"
            >
              Start for Free
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-24 pb-32 text-center lg:px-12 lg:pt-36">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur-sm transition-luxury hover:bg-primary/10">
              <Rocket className="h-3.5 w-3.5" />
              <span>Redefining team productivity</span>
            </div>
            <h1 className="font-serif text-5xl font-extrabold leading-[1.15] tracking-tight text-foreground lg:text-7xl">
              Organize Every <br />
              <span className="italic text-primary">Detail</span>
            </h1>
            <p className="mx-auto mt-10 max-w-2xl text-lg leading-relaxed text-secondary sm:text-xl font-medium antialiased">
              Verve orchestrates your tasks, teammates, and vision into a single, <span className="text-foreground font-semibold underline decoration-primary/30 underline-offset-4">harmonious</span> workspace.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row">
              <Link
                href="/register"
                className="group relative flex h-14 items-center gap-2.5 overflow-hidden rounded-xl bg-primary px-10 text-lg font-bold text-white shadow-xl shadow-primary/30 transition-luxury hover:-translate-y-1 hover:shadow-primary/50"
              >
                <span>Get Verve Free</span>
                <ChevronDown className="h-5 w-5 -rotate-90 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="h-14 flex items-center px-10 text-lg font-bold text-primary border-2 border-transparent transition-luxury hover:bg-primary/5 hover:border-primary/20 rounded-xl"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--color-border)_0%,_transparent_70%)] opacity-20 pointer-events-none"></div>
          <div className="mx-auto max-w-7xl px-6 lg:px-12 relative">
            <div className="grid gap-10 md:grid-cols-3">
              {[
                { icon: Layout, title: "Infinite Boards", desc: "Create as many boards as your imagination allows. No limits on your vision.", color: "bg-primary/10 text-primary" },
                { icon: Users, title: "Team Sync", desc: "Real-time collaboration that keeps everyone in perfect harmony.", color: "bg-info/10 text-info" },
                { icon: Shield, title: "Secure by Design", desc: "Enterprise-grade security with encrypted data and robust access control.", color: "bg-danger/10 text-danger" }
              ].map((feature, i) => (
                <div key={i} className="group flex flex-col items-start p-8 rounded-[2rem] bg-white border border-border soft-shadow transition-luxury hover-lift">
                  <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl ${feature.color} transition-luxury group-hover:scale-110 group-hover:rotate-6`}>
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-3 font-serif text-2xl font-bold">{feature.title}</h3>
                  <p className="text-secondary text-base font-medium leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white/40 glass py-12 mt-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-2 font-serif font-bold text-primary text-2xl">
              <Sparkles className="h-6 w-6 transition-luxury hover:rotate-12" />
              <span>Verve</span>
            </div>
            <p className="font-medium text-secondary text-base">© 2024 Verve. Crafting premium productivity.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
