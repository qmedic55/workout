import { useState, useEffect, useCallback } from "react";

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
  const [shouldStart, setShouldStart] = useState(false);

  const reset = useCallback(() => {
    setDisplayedText("");
    setIsComplete(false);
    setIsTyping(false);
    setShouldStart(false);
    // Trigger start after reset
    setTimeout(() => setShouldStart(true), 0);
  }, []);

  const skip = useCallback(() => {
    setDisplayedText(text);
    setIsComplete(true);
    setIsTyping(false);
    onComplete?.();
  }, [text, onComplete]);

  // Initial delay before starting
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setShouldStart(true);
    }, delay);

    return () => clearTimeout(delayTimer);
  }, [delay]);

  // Main typing effect
  useEffect(() => {
    if (!shouldStart || isComplete) return;

    let currentIndex = 0;
    setIsTyping(true);
    setDisplayedText("");

    const typeNextChar = () => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsComplete(true);
        setIsTyping(false);
        onComplete?.();
      }
    };

    const interval = setInterval(typeNextChar, speed);

    return () => clearInterval(interval);
  }, [text, speed, shouldStart, onComplete, isComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);
    setIsTyping(false);
    setShouldStart(false);
    // Re-trigger start after a brief moment
    const timer = setTimeout(() => setShouldStart(true), delay);
    return () => clearTimeout(timer);
  }, [text, delay]);

  return {
    displayedText,
    isComplete,
    isTyping,
    reset,
    skip,
  };
}
