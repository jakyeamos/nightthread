import { LockKeyhole } from "lucide-react";
import { Brand } from "@/components/brand";
import { SignInCard } from "@/components/sign-in-card";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] lg:grid lg:grid-cols-[1.08fr_.92fr]">
      <section className="welcome-photo relative flex min-h-[48vh] flex-col justify-between overflow-hidden p-6 text-white lg:min-h-screen lg:p-12 xl:p-16">
        <div className="relative z-10"><Brand tone="light" /></div>
        <div className="relative z-10 max-w-2xl pb-4">
          <p className="mb-4 text-xs font-semibold tracking-[.12em] text-white/80 uppercase">Plan together, beautifully</p>
          <h1 className="display text-5xl leading-[.94] tracking-[-.035em] text-balance md:text-7xl xl:text-[6rem]">Follow the thread<br />of a great trip.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/88 md:text-lg">Gather the places you keep sending each other. Shape flexible days. See your journey emerge—without turning the joy of travel into a spreadsheet.</p>
          <p className="mt-8 text-[10px] text-white/70">Tokyo photograph via <a className="underline underline-offset-2 hover:text-white" href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a></p>
        </div>
      </section>
      <section className="flex min-h-[52vh] flex-col bg-[var(--canvas)] px-6 py-6 lg:min-h-screen lg:px-12 xl:px-20">
        <header className="flex justify-end"><span className="flex items-center gap-2 text-xs text-[var(--muted)]"><LockKeyhole size={14} />Private trips. Invited people only.</span></header>
        <div className="flex flex-1 items-center justify-center py-12"><SignInCard /></div>
        <div className="flex justify-center gap-8 pb-3 text-xs text-[var(--muted)]"><span>Saved ideas in one place</span><span>Room for plans to change</span></div>
      </section>
    </main>
  );
}
