import { db } from "./db";
import { jobs, subscribers, deliveries, pipelines } from "./db/schema";
import { eq } from "drizzle-orm";

const processingActions = {
  uppercase: (payload: any) => {
    if (payload.data && typeof payload.data === "string") {
      return { ...payload, data: payload.data.toUpperCase() };
    }
    return payload;
  },

  addTimestamp: (payload: any) => ({
    ...payload,
    processedAt: new Date().toISOString(),
  }),

  reverseString: (payload: any) => {
    if (payload.data && typeof payload.data === "string") {
      return {
        ...payload,
        data: payload.data.split("").reverse().join(""),
      };
    }
    return payload;
  },
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; 

const deliverToSubscribers = async (
  pipelineId: string,
  jobId: string,
  result: any
) => {
  const subs = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.pipelineId, pipelineId));

  for (const sub of subs) {
    let attempt = 0;
    let delivered = false;

    while (attempt < MAX_RETRIES && !delivered) {
      attempt++;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        await fetch(sub.url, {
          method: "POST",
          body: JSON.stringify(result),
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        console.log(`Delivered to ${sub.url} (attempt ${attempt})`);
        delivered = true;

        await db.insert(deliveries).values({
          jobId,
          subscriberUrl: sub.url,
          status: "success",
          attempt,
        });
      } catch (err: any) {
        console.error(
          `Failed delivery to ${sub.url} (attempt ${attempt})`,
          err.message
        );

        await db.insert(deliveries).values({
          jobId,
          subscriberUrl: sub.url,
          status: "failed",
          attempt,
          lastError: err.message,
        });

        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY * attempt;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
  }
};

const processJob = async () => {
  try {
    const jobsToProcess = await db
      .update(jobs)
      .set({ status: "processing" })
      .where(eq(jobs.status, "pending"))
      .returning();

    const job = jobsToProcess[0];
    if (!job) return;

    const pipeline = await db
      .select()
      .from(pipelines)
      .where(eq(pipelines.id, job.pipelineId));

    if (!pipeline[0]) throw new Error("Pipeline not found");

    const actionKey = pipeline[0].action as keyof typeof processingActions;
    const action = processingActions[actionKey];

    if (!action) throw new Error("Invalid action");

    const processedResult = action(job.payload);

    await db
      .update(jobs)
      .set({ status: "done", result: processedResult })
      .where(eq(jobs.id, job.id));

    await deliverToSubscribers(
      job.pipelineId,
      job.id,
      processedResult
    );

    console.log("Job processed:", job.id);
  } catch (err: any) {
    console.error("Job failed:", err.message);
  }
};

const runWorker = async () => {
  console.log("Worker running...");

  while (true) {
    await processJob();

    await new Promise((r) => setTimeout(r, 2000));
  }
};

runWorker();