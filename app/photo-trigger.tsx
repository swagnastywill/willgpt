"use client";

import Image from "next/image";
import { useRef } from "react";
import { useRouter } from "next/navigation";

export default function PhotoTrigger() {
  const router = useRouter();
  const countRef = useRef(0);
  const lastRef = useRef(0);

  function onClick() {
    const now = Date.now();
    if (now - lastRef.current > 3000) {
      countRef.current = 0;
    }
    lastRef.current = now;
    countRef.current += 1;
    if (countRef.current >= 9) {
      countRef.current = 0;
      router.push("/admin");
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="willy"
      className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden ring-1 ring-black/10 dark:ring-white/10 cursor-pointer"
    >
      <Image
        src="/will.png"
        alt="willy"
        fill
        sizes="(max-width: 640px) 160px, 192px"
        priority
        className="object-cover pointer-events-none"
      />
    </button>
  );
}
