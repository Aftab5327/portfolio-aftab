/**
 * Privacy-preserving chat analytics. Per UTC day, Redis holds:
 *   chat:q:<yyyy-mm-dd>       total questions        (INCR)
 *   chat:topics:<yyyy-mm-dd>  hash topic → count     (HINCRBY)
 * Keys expire after 90 days. Topics are knowledge-chunk ids of the retrieved
 * context ("project:infrasense-360", "skills:database"): never the message
 * text, never an IP or any visitor identifier.
 */
import { getRedis, safeRead } from "@/lib/redis";

const TTL_SECONDS = 90 * 24 * 60 * 60;
const TOPIC_PATTERN = /^[a-z0-9][a-z0-9:-]{0,79}$/;

export type QuestionEvent = {
  /** Topic ids of the retrieved chunks (see topicOf in lib/knowledge.ts). */
  topics: string[];
  resultCount: number;
  followUp: boolean;
};

const dayKey = (date: Date) => date.toISOString().slice(0, 10);
const questionsKey = (day: string) => `chat:q:${day}`;
const topicsKey = (day: string) => `chat:topics:${day}`;

export async function trackQuestion(event: QuestionEvent): Promise<void> {
  const kv = getRedis();
  if (!kv) return;

  const day = dayKey(new Date());
  const topics = [...new Set(event.topics)].filter((topic) => TOPIC_PATTERN.test(topic)).slice(0, 5);
  try {
    await Promise.all([
      kv.incr(questionsKey(day)),
      kv.expire(questionsKey(day), TTL_SECONDS),
      ...topics.map((topic) => kv.hincrby(topicsKey(day), topic, 1)),
      ...(topics.length ? [kv.expire(topicsKey(day), TTL_SECONDS)] : [])
    ]);
  } catch (error) {
    console.error("Chat analytics failed:", error instanceof Error ? error.message : error);
  }
}

export type ChatAnalytics = {
  days: { date: string; questions: number }[];
  totalQuestions: number;
  topTopics: { topic: string; count: number }[];
};

/** Questions per day and top topics over the last `days` days (null without Redis). */
export async function getChatAnalytics(days = 7): Promise<ChatAnalytics | null> {
  return safeRead(
    "chat analytics",
    async (kv) => {
      const dates = Array.from({ length: days }, (_, i) => dayKey(new Date(Date.now() - i * 86_400_000))).reverse();
      const [counts, topicMaps] = await Promise.all([
        Promise.all(dates.map((date) => kv.get(questionsKey(date)))),
        Promise.all(dates.map((date) => kv.hgetall(topicsKey(date))))
      ]);

      const totals = new Map<string, number>();
      for (const map of topicMaps) {
        for (const [topic, value] of Object.entries(map ?? {})) totals.set(topic, (totals.get(topic) ?? 0) + (Number(value) || 0));
      }

      const perDay = dates.map((date, i) => ({ date, questions: Number(counts[i]) || 0 }));
      return {
        days: perDay,
        totalQuestions: perDay.reduce((sum, day) => sum + day.questions, 0),
        topTopics: [...totals.entries()]
          .map(([topic, count]) => ({ topic, count }))
          .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic))
          .slice(0, 5)
      };
    },
    { cached: true }
  );
}
