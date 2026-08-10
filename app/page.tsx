import Link from "next/link";
import {
  IconApple,
  IconCarrot,
  IconCherry,
  IconCloud,
  IconLeaf,
  IconLemon2,
  IconPlant,
  IconSeeding,
  IconSun,
  IconWheat,
} from "@tabler/icons-react";

// Falling produce: [left %, size px, color, duration s, phase 0–1]
const FALLERS = [
  { Icon: IconCarrot, left: 10, size: 30, color: "#639922", duration: 21, phase: 0.2 },
  { Icon: IconLemon2, left: 36, size: 24, color: "#BA7517", duration: 26, phase: 0.6 },
  { Icon: IconApple, left: 62, size: 27, color: "#993C1D", duration: 23, phase: 0.4 },
  { Icon: IconCherry, left: 84, size: 24, color: "#D4537E", duration: 28, phase: 0.75 },
];

// Leaves on the breeze: [top px, size px, color, duration s, phase 0–1]
const BREEZE = [
  { Icon: IconLeaf, top: 40, size: 24, color: "#3B6D11", duration: 30, phase: 0.2 },
  { Icon: IconLeaf, top: 140, size: 18, color: "#639922", duration: 38, phase: 0.65 },
  { Icon: IconSeeding, top: -20, size: 21, color: "#97C459", duration: 34, phase: 0.42 },
];

// Wheat and seedlings swaying on the hill line.
const HILL_PLANTS = [
  { Icon: IconWheat, left: "12%", size: 26, color: "#854F0B", duration: 6, delay: 0 },
  { Icon: IconWheat, left: "19%", size: 20, color: "#BA7517", duration: 7, delay: -2 },
  { Icon: IconPlant, left: "72%", size: 24, color: "#3B6D11", duration: 8, delay: -4 },
  { Icon: IconWheat, left: "82%", size: 21, color: "#854F0B", duration: 6.5, delay: -1 },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
        <IconSun
          className="absolute right-10 top-8 opacity-45"
          size={34}
          stroke={1.5}
          color="#EF9F27"
        />
        <IconCloud
          className="absolute top-10"
          size={36}
          stroke={1.5}
          color="#B4B2A9"
          style={{ opacity: 0.3, animation: "farm-cloud 44s linear infinite", animationDelay: "-8s" }}
        />
        <IconCloud
          className="absolute top-24"
          size={24}
          stroke={1.5}
          color="#B4B2A9"
          style={{ opacity: 0.22, animation: "farm-cloud 58s linear infinite", animationDelay: "-36s" }}
        />

        {FALLERS.map(({ Icon, left, size, color, duration, phase }, i) => (
          <Icon
            key={i}
            className="absolute"
            size={size}
            stroke={1.5}
            color={color}
            style={{
              left: `${left}%`,
              opacity: 0.3,
              animation: `farm-fall ${duration}s linear infinite`,
              animationDelay: `${-phase * duration}s`,
            }}
          />
        ))}

        {BREEZE.map(({ Icon, top, size, color, duration, phase }, i) => (
          <Icon
            key={i}
            className="absolute left-0"
            size={size}
            stroke={1.5}
            color={color}
            style={{
              top: `${top}px`,
              opacity: 0.3,
              animation: `farm-drift ${duration}s linear infinite`,
              animationDelay: `${-phase * duration}s`,
            }}
          />
        ))}

        {/* Rolling hills anchor the bottom; wheat sways on the horizon. */}
        <div
          className="absolute rounded-[50%]"
          style={{ bottom: "-11rem", left: "-12%", width: "70%", height: "18rem", background: "#97C459", opacity: 0.26 }}
        />
        <div
          className="absolute rounded-[50%]"
          style={{ bottom: "-13rem", right: "-15%", width: "82%", height: "19.5rem", background: "#639922", opacity: 0.2 }}
        />
        {HILL_PLANTS.map(({ Icon, left, size, color, duration, delay }, i) => (
          <Icon
            key={i}
            className="absolute"
            size={size}
            stroke={1.5}
            color={color}
            style={{
              left,
              bottom: "3.5rem",
              opacity: 0.45,
              transformOrigin: "bottom center",
              animation: `farm-sway ${duration}s ease-in-out infinite`,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-3xl px-6 py-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-pill px-4 py-1.5 text-sm text-pill-fg">
          🍳 Home cooking, shared
        </span>
        <h1 className="mt-8 font-serif text-5xl font-semibold leading-tight">
          Recipes that <span className="text-accent">someone actually cooked.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Anyone can copy a recipe off the internet. This is for the ones you make
          on a weeknight — with the shortcuts, substitutions, and honest timings.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/submit"
            className="rounded-lg bg-accent px-6 py-3 font-medium text-background hover:bg-accent-strong"
          >
            Share a recipe
          </Link>
          <Link
            href="/browse"
            className="rounded-lg border border-border bg-background/70 px-6 py-3 font-medium backdrop-blur hover:border-muted"
          >
            Browse recipes
          </Link>
          <Link
            href="/plan"
            className="rounded-lg border border-border bg-background/70 px-6 py-3 font-medium backdrop-blur hover:border-muted"
          >
            Plan your week
          </Link>
        </div>

        <div className="mx-auto mt-20 grid max-w-2xl gap-4 text-left sm:grid-cols-3">
          {[
            ["✨", "Paste anything", "A link, a text from mom, scrawled notes — we sort it out."],
            ["📅", "Plan the month", "Leftover nights welcome. History included."],
            ["🛒", "Shop once", "One merged grocery list for the whole week."],
          ].map(([icon, title, blurb]) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card/90 p-5 backdrop-blur"
            >
              <div className="text-2xl">{icon}</div>
              <div className="mt-2 font-serif text-lg font-semibold">{title}</div>
              <p className="mt-1 text-sm leading-relaxed text-muted">{blurb}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
