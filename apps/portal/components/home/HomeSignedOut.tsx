import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function HomeSignedOut() {
  return (
    <div className="relative h-screen overflow-hidden bg-black">
      {/* Full-screen background — subtle Ken Burns scale on load */}
      <img
        src="/Portal_Banner.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-[60%_center]"
      />

      {/* Overlay — mirrors main site hero gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgb(16 28 39 / 0.92) 0%, rgb(16 28 39 / 0.78) 34%, rgb(16 28 39 / 0.35) 58%, transparent 72%), linear-gradient(180deg, transparent 55%, rgb(16 28 39 / 0.35) 100%)",
        }}
      />

      {/* Content — bottom-left aligned, same rhythm as main site hero */}
      <div className="relative z-10 flex h-full flex-col justify-end px-8 pb-14 sm:px-12 sm:pb-18 lg:px-20 lg:pb-20">
        <p className="font-display text-[11px] uppercase tracking-[0.2em] text-white/50">
          Monarch Portal
        </p>
        <h1 className="mt-3 font-display text-4xl uppercase tracking-wide text-white sm:text-5xl lg:text-6xl">
          Retainers &<br />Projects
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
          Jira-style boards for DayZ servers. Track sprints, tasks, quotes, and delivery with
          Discord synced to your team.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 border border-white bg-white px-5 py-2.5 font-display text-xs uppercase tracking-widest text-black transition-colors hover:bg-white/90"
          >
            Sign in
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 border border-white/30 bg-white/5 px-5 py-2.5 font-display text-xs uppercase tracking-widest text-white/80 backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-white/10 hover:text-white"
          >
            Request access
          </Link>
        </div>
      </div>
    </div>
  )
}
