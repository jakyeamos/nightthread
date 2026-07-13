import { LockKeyhole } from "lucide-react";
import { Brand } from "@/components/brand";
import { SignInCard } from "@/components/sign-in-card";

export default function Home() {
  return (
    <main className="landing-grain relative min-h-screen overflow-hidden">
      <div className="hero-photo absolute inset-0 opacity-75" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1440px] flex-col px-6 py-6 md:px-12 lg:px-16">
        <header className="flex items-center justify-between"><Brand /><span className="muted flex items-center gap-2 text-xs"><LockKeyhole size={14} />Private trips. Invited people only.</span></header>
        <div className="grid flex-1 items-center gap-16 py-16 lg:grid-cols-[1.15fr_.85fr]">
          <section className="max-w-2xl">
            <p className="eyebrow mb-5 text-[oklch(0.78_0.1_18)]">Plan together, beautifully</p>
            <h1 className="display text-6xl leading-[.92] tracking-[-0.045em] md:text-7xl lg:text-[6.6rem]">Follow the thread<br />of a great trip.</h1>
            <p className="muted mt-7 max-w-xl text-base leading-7 md:text-lg">Gather the places you keep sending each other. Shape flexible days. See your journey emerge—without turning the joy of travel into a spreadsheet.</p>
            <div className="mt-10 flex gap-8 text-sm"><span><strong className="block text-[var(--ink)]">Saved ideas</strong><span className="muted">in one shared place</span></span><span><strong className="block text-[var(--ink)]">Human plans</strong><span className="muted">with room to wander</span></span></div>
          </section>
          <div className="flex justify-center lg:justify-end"><SignInCard /></div>
        </div>
        <footer className="muted text-[10px]">Tokyo photograph via <a className="underline underline-offset-2 hover:text-white" href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a></footer>
      </div>
    </main>
  );
}
