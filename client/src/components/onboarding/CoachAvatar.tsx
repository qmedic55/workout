import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

export type AvatarState = "idle" | "waving" | "celebrating" | "nodding" | "thinking";

interface CoachAvatarProps {
  state?: AvatarState;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

// Animation variants for the whole avatar container
const containerVariants: Variants = {
  idle: {
    y: [0, -2, 0],
    transition: {
      y: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
  celebrating: {
    y: [0, -12, 0],
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.5,
      repeat: 2,
      ease: "easeOut",
    },
  },
  nodding: {
    rotate: [0, -5, 5, -5, 0],
    transition: {
      duration: 0.8,
      ease: "easeInOut",
    },
  },
  thinking: {
    scale: [1, 0.98, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  waving: {},
};

// Animation variants for the waving hand
const handVariants: Variants = {
  idle: { rotate: 0 },
  waving: {
    rotate: [0, 20, -10, 20, -5, 15, 0],
    transition: {
      duration: 1.2,
      repeat: 2,
      ease: "easeInOut",
    },
  },
  celebrating: {
    rotate: [0, 20, -20, 20, 0],
    y: [-5, 0, -5, 0],
    transition: {
      duration: 0.4,
      repeat: 3,
      ease: "easeOut",
    },
  },
  nodding: { rotate: 0 },
  thinking: { rotate: 0 },
};

// Animation variants for eyes (blinking)
const eyeVariants: Variants = {
  idle: {
    scaleY: [1, 1, 0.1, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      times: [0, 0.9, 0.95, 1],
    },
  },
  waving: {
    scaleY: 1,
  },
  celebrating: {
    scaleY: [1, 0.3, 1],
    transition: {
      duration: 0.3,
      repeat: 2,
    },
  },
  nodding: { scaleY: 1 },
  thinking: {
    scaleY: 1,
    x: [0, 2, 0],
    transition: {
      x: {
        duration: 2,
        repeat: Infinity,
      },
    },
  },
};

// Smile variants
const smileVariants: Variants = {
  idle: { scaleX: 1 },
  waving: { scaleX: 1.1 },
  celebrating: {
    scaleX: [1, 1.3, 1],
    transition: { duration: 0.3, repeat: 2 }
  },
  nodding: { scaleX: 1 },
  thinking: { scaleX: 0.8 },
};

export function CoachAvatar({ state = "idle", size = "md", className }: CoachAvatarProps) {
  return (
    <motion.div
      className={cn("relative", sizeClasses[size], className)}
      variants={containerVariants}
      animate={state}
      initial="idle"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="48"
          strokeWidth="2"
          className="fill-primary/10 stroke-primary/30"
        />

        {/* Body/shirt */}
        <path
          d="M25 85 C25 70, 35 65, 50 65 C65 65, 75 70, 75 85"
          className="fill-primary"
        />

        {/* Head */}
        <circle cx="50" cy="40" r="22" className="fill-amber-100 dark:fill-amber-200" />

        {/* Hair */}
        <path
          d="M30 35 Q30 20, 50 18 Q70 20, 70 35 Q65 28, 50 28 Q35 28, 30 35"
          className="fill-amber-800 dark:fill-amber-900"
        />

        {/* Left eye */}
        <motion.ellipse
          cx="42"
          cy="38"
          rx="3"
          ry="4"
          className="fill-slate-800"
          variants={eyeVariants}
          animate={state}
          style={{ originX: "42px", originY: "38px" }}
        />

        {/* Right eye */}
        <motion.ellipse
          cx="58"
          cy="38"
          rx="3"
          ry="4"
          className="fill-slate-800"
          variants={eyeVariants}
          animate={state}
          style={{ originX: "58px", originY: "38px" }}
        />

        {/* Eyebrows */}
        <path
          d="M37 32 Q42 30, 46 32"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="stroke-amber-800 dark:stroke-amber-900"
        />
        <path
          d="M54 32 Q58 30, 63 32"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="stroke-amber-800 dark:stroke-amber-900"
        />

        {/* Smile */}
        <motion.path
          d="M42 50 Q50 56, 58 50"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          className="stroke-slate-700"
          variants={smileVariants}
          animate={state}
          style={{ originX: "50px", originY: "52px" }}
        />

        {/* Left arm (static) */}
        <path
          d="M28 75 Q20 70, 18 78"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="stroke-primary"
        />

        {/* Right arm (waving) */}
        <motion.g
          variants={handVariants}
          animate={state}
          style={{ originX: "72px", originY: "75px" }}
        >
          <path
            d="M72 75 Q80 68, 85 60"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className="stroke-primary"
          />
          {/* Hand */}
          <circle cx="85" cy="58" r="5" className="fill-amber-100 dark:fill-amber-200" />
        </motion.g>

        {/* Sparkles for celebrating state */}
        {state === "celebrating" && (
          <>
            <motion.circle
              cx="20"
              cy="25"
              r="3"
              className="fill-yellow-400"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.circle
              cx="80"
              cy="20"
              r="2.5"
              className="fill-yellow-400"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
            <motion.circle
              cx="15"
              cy="50"
              r="2"
              className="fill-yellow-400"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            />
          </>
        )}
      </svg>
    </motion.div>
  );
}
