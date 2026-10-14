/**
 * Privacy-preserving analytics hook (a no-op until Phase E).
 * Only aggregate topic tags are passed in: never the visitor's message,
 * IP address or any identifier.
 */
export type QuestionEvent = {
  /** Topic tags of the retrieved knowledge chunks, e.g. ["project", "iot", "skills"]. */
  tags: string[];
  resultCount: number;
  followUp: boolean;
};

export function trackQuestion(event: QuestionEvent): void {
  void event; // Phase E: forward to an analytics sink.
}
