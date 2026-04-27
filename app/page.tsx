import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="max-w-md w-full flex flex-col items-center gap-6">
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden ring-1 ring-black/10 dark:ring-white/10">
          <Image
            src="/will.png"
            alt="will"
            fill
            sizes="(max-width: 640px) 160px, 192px"
            priority
            className="object-cover"
          />
        </div>

        <h1 className="font-display text-5xl sm:text-7xl tracking-tight">
          i am replacing ai
        </h1>

        <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
          hey im will. ai sucks honestly. i&apos;ll just answer your questions
          myself. text me anything, ill get back when i can.
        </p>

        <Link
          href="/chat"
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#007aff] hover:bg-[#0066d6] active:bg-[#0057b8] text-white px-6 py-3 text-base font-medium transition-colors"
        >
          message will
        </Link>

        <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-6">
          by{" "}
          <a
            href="https://x.com/willyhopps"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            @willyhopps
          </a>
        </p>
      </div>
    </main>
  );
}
