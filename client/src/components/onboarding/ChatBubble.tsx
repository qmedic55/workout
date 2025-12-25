import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ChatBubbleProps {
  children: ReactNode;
  /** Whether this is a user message (right aligned) or coach message (left aligned) */
  isUser?: boolean;
  /** Whether to animate the bubble appearing */
  animate?: boolean;
  /** Additional class names */
  className?: string;
  /** Delay before the bubble appears (in seconds) */
  delay?: number;
}

const bubbleVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};

export function ChatBubble({
  children,
  isUser = false,
  animate = true,
  className,
  delay = 0,
}: ChatBubbleProps) {
  const Wrapper = animate ? motion.div : "div";
  const wrapperProps = animate
    ? {
        variants: bubbleVariants,
        initial: "hidden",
        animate: "visible",
        transition: { delay },
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "max-w-[85%] relative",
        isUser ? "ml-auto" : "mr-auto",
        className
      )}
    >
      <div
        className={cn(
          "px-4 py-3 rounded-2xl relative",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        {/* Speech bubble tail */}
        <div
          className={cn(
            "absolute bottom-0 w-3 h-3",
            isUser
              ? "-right-1 bg-primary"
              : "-left-1 bg-muted",
            // Create the tail shape with clip-path
            isUser
              ? "[clip-path:polygon(0_0,100%_0,100%_100%)]"
              : "[clip-path:polygon(0_0,100%_0,0_100%)]"
          )}
        />
        <div className="relative z-10">{children}</div>
      </div>
    </Wrapper>
  );
}

// A variant that combines ChatBubble with TypewriterText
interface TypedChatBubbleProps extends Omit<ChatBubbleProps, "children"> {
  text: string;
  /** Speed in milliseconds per character */
  speed?: number;
  /** Callback when typing is complete */
  onComplete?: () => void;
}

export function TypedChatBubble({
  text,
  speed = 30,
  onComplete,
  ...bubbleProps
}: TypedChatBubbleProps) {
  // Import dynamically to avoid circular dependency
  const { TypewriterText } = require("./TypewriterText");

  return (
    <ChatBubble {...bubbleProps}>
      <TypewriterText
        text={text}
        speed={speed}
        onComplete={onComplete}
        showCursor={false}
        className="text-sm"
      />
    </ChatBubble>
  );
}
