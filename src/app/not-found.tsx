import Link from "next/link";
import { Brand } from "@/components/brand";

export default function NotFound() { return <main className="grid min-h-screen place-items-center px-6"><div className="text-center"><Brand /><p className="eyebrow mt-10">404</p><h1 className="display mt-3 text-6xl">That thread ends here.</h1><p className="muted mt-4">The trip or page may have moved.</p><Link href="/trips" className="mt-7 inline-flex rounded-xl bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-[var(--night)]">Return to trips</Link></div></main>; }
