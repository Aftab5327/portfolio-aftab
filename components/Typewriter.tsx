"use client";

import { useEffect, useState } from "react";

type TypewriterProps = {
  words: string[];
};

export default function Typewriter({ words }: TypewriterProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex % words.length];
    const doneTyping = text === currentWord;
    const doneDeleting = text === "";

    const delay = deleting ? 55 : 90;
    const pause = doneTyping ? 1400 : 0;

    const timer = setTimeout(
      () => {
        if (!deleting) {
          setText(currentWord.slice(0, text.length + 1));
          if (doneTyping) setDeleting(true);
        } else {
          setText(currentWord.slice(0, text.length - 1));
          if (doneDeleting) {
            setDeleting(false);
            setWordIndex((prev) => (prev + 1) % words.length);
          }
        }
      },
      pause || delay
    );

    return () => clearTimeout(timer);
  }, [deleting, text, wordIndex, words]);

  return (
    <span className="inline-flex items-center gap-1 text-accent">
      <span>{text}</span>
      <span className="h-6 w-[2px] animate-pulse bg-accent" />
    </span>
  );
}
