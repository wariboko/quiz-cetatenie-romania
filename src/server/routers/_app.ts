import { router } from "@/server/trpc";
import { sessionsRouter } from "./sessions";
import { progressRouter } from "./progress";

export const appRouter = router({
  sessions: sessionsRouter,
  progress: progressRouter,
});

export type AppRouter = typeof appRouter;
