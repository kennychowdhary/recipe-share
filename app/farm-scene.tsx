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

// Falling produce: left %, size px, colour, fall duration s, and the point in
// that fall where it starts (so nothing is bunched at the top on first paint).
const FALLERS = [
  { Icon: IconCarrot, left: 10, size: 30, color: "#639922", duration: 21, phase: 0.2 },
  { Icon: IconLemon2, left: 36, size: 24, color: "#BA7517", duration: 26, phase: 0.6 },
  { Icon: IconApple, left: 62, size: 27, color: "#993C1D", duration: 23, phase: 0.4 },
  { Icon: IconCherry, left: 84, size: 24, color: "#D4537E", duration: 28, phase: 0.75 },
];

const BREEZE = [
  { Icon: IconLeaf, top: 40, size: 24, color: "#3B6D11", duration: 30, phase: 0.2 },
  { Icon: IconLeaf, top: 140, size: 18, color: "#639922", duration: 38, phase: 0.65 },
  { Icon: IconSeeding, top: -20, size: 21, color: "#97C459", duration: 34, phase: 0.42 },
];

const HILL_PLANTS = [
  { Icon: IconWheat, left: "12%", size: 26, color: "#854F0B", duration: 6, delay: 0 },
  { Icon: IconWheat, left: "19%", size: 20, color: "#BA7517", duration: 7, delay: -2 },
  { Icon: IconPlant, left: "72%", size: 24, color: "#3B6D11", duration: 8, delay: -4 },
  { Icon: IconWheat, left: "82%", size: 21, color: "#854F0B", duration: 6.5, delay: -1 },
];

/** The site-wide backdrop. Fixed to the viewport and behind everything, so it
 * costs no layout height and doesn't scroll away on long pages. */
export default function FarmScene() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 select-none overflow-hidden"
    >
      <IconSun className="absolute right-10 top-8 opacity-45" size={34} stroke={1.5} color="#EF9F27" />
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
          key={`fall-${i}`}
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
          key={`breeze-${i}`}
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
          key={`plant-${i}`}
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
  );
}
