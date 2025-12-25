import { useState, useEffect, useCallback, useRef } from "react";

interface UseTypewriterOptions {
  /** Speed in milliseconds per character */
  speed?: number;
  /** Delay before starting in milliseconds */
  delay?: number;
  /** Callback when typing is complete */
  onComplete?: () => void;
}

interface UseTypewriterReturn {
  /** The currently displayed text */
  displayedText: string;
  /** Whether the typewriter effect is complete */
  isComplete: boolean;
  /** Whether the typewriter is currently typing */
  isTyping: boolean;
  /** Reset and start typing again */
  reset: () => void;
  /** Skip to the end immediately */
  skip: () => void;
}

export function useTypewriter(
  text: string,
  options: UseTypewriterOptions = {}
): UseTypewriterReturn {
  const { speed = 30, delay = 0, onComplete } = options;

  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Use refs to avoid stale closures
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const textRef = useRef(text);
  textRef.current = text;

  const reset = useCallback(() => {
    setDisplayedText("");
    setIsComplete(false);
    setIsTyping(false);
  }, []);

  const skip = useCallback(() => {
    setDisplayedText(textRef.current);
    setIsComplete(true);
    setIsTyping(false);
    onCompleteRef.current?.();
  }, []);

  // Main typing effect - runs once per text change
  useEffect(() => {
    // Reset state for new text
    setDisplayedText("");
    setIsComplete(false);
    setIsTyping(false);

    let currentIndex = 0;
    let intervalId: NodeJS.Timeout | null = null;

    // Start after delay
    const delayTimer = setTimeout(() => {
      setIsTyping(true);

      const typeNextChar = () => {
        if (currentIndex < text.length) {
          currentIndex++;
          setDisplayedText(text.slice(0, currentIndex));
        } else {
          if (intervalId) clearInterval(intervalId);
          setIsComplete(true);
          setIsTyping(false);
          onCompleteRef.current?.();
        }
      };

      // Type first character immediately, then continue at interval
      typeNextChar();
      if (text.length > 1) {
        intervalId = setInterval(typeNextChar, speed);
      }
    }, delay);

    return () => {
      clearTimeout(delayTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speed, delay]);

  return {
    displayedText,
    isComplete,
    isTyping,
    reset,
    skip,
  };
}
