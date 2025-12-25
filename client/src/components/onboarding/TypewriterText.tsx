import { useTypewriter } from "@/hooks/useTypewriter";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TypewriterTextProps {
  text: string;
  /** Speed in milliseconds per character */
  speed?: number;
  /** Delay before starting in milliseconds */
  delay?: number;
  /** Callback when typing is complete */
  onComplete?: () => void;
  /** Additional class names */
  className?: string;
  /** Whether to show a blinking cursor */
  showCursor?: boolean;
  /** Render children when typing is complete */
  children?: (props: { isComplete: boolean }) => React.ReactNode;
}

export function TypewriterText({
  text,
  speed = 30,
  delay = 0,
  onComplete,
  className,
  showCursor = true,
  children,
}: TypewriterTextProps) {
  const { displayedText, isComplete, isTyping } = useTypewriter(text, {
    speed,
    delay,
    onComplete,
  });

  return (
    <div className={cn("relative", className)}>
      <span className="whitespace-pre-wrap">
        {displayedText}
        {showCursor && !isComplete && (
          <motion.span
            className="inline-block w-0.5 h-[1.1em] bg-current ml-0.5 align-middle"
            animate={{ opacity: [1, 0] }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        )}
      </span>
      {children?.({ isComplete })}
    </div>
  );
}
