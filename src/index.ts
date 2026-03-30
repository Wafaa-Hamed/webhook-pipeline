import express from "express";
import { db } from "./db";
import { pipelines, subscribers, jobs, deliveries } from "./db/schema";
import { eq } from "drizzle-orm";

const app = express();
app.use(express.json());

const allowedActions = ["uppercase", "addTimestamp", "reverseString"];

app.post("/pipelines", async (req, res) => {
  const { name, webhookPath, action } = req.body;

  if (!name || !webhookPath || !action) {
    return res.status(400).json({ message: "name, webhookPath & action required" });
  }

  if (!allowedActions.includes(action)) {
    return res.status(400).json({ message: "Invalid action" });
  }

  const [pipeline] = await db.insert(pipelines).values({
    name,
    webhookPath,
    action,
  }).returning();

  res.status(201).json(pipeline);
});


app.post("/pipelines/:pipelineId/subscribers", async (req, res) => {
  const { pipelineId } = req.params;
  const { url } = req.body;

  if (!url) return res.status(400).json({ message: "url required" });

  const [sub] = await db.insert(subscribers).values({
    pipelineId,
    url,
  }).returning();

  res.status(201).json(sub);
});

app.post("/webhooks/:pipelineId", async (req, res) => {
  const { pipelineId } = req.params;
  const payload = req.body;

  const pipelineExists = await db
    .select()
    .from(pipelines)
    .where(eq(pipelines.id, pipelineId));

  if (!pipelineExists[0]) {
    return res.status(404).json({ message: "Pipeline not found" });
  }

  const [job] = await db.insert(jobs).values({
    pipelineId,
    payload,
  }).returning();

  res.status(201).json({
    message: "Job queued successfully",
    jobId: job.id,
  });
});

app.get("/pipelines", async (req, res) => {
  const all = await db.select().from(pipelines);
  res.json(all);
});

app.get("/jobs/:jobId", async (req, res) => {
  const { jobId } = req.params;

  const job = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, jobId));

  if (!job[0]) {
    return res.status(404).json({ message: "Job not found" });
  }

  const jobDeliveries = await db
    .select()
    .from(deliveries)
    .where(eq(deliveries.jobId, jobId));

  res.json({
    job: job[0],
    deliveries: jobDeliveries,
  });
});

app.get("/pipelines/:id", async (req, res) => {
const pipeline = await db
  .select()
  .from(pipelines)
  .where(eq(pipelines.id, req.params.id));
  
if (!pipeline.length) {
  return res.status(404).json({ error: "Pipeline not found" });
}

  res.json(pipeline);
});

app.put("/pipelines/:id", async (req, res) => {
  const { id } = req.params;
  const { name, webhookPath, action } = req.body;

  if (!name && !webhookPath && !action) {
    return res.status(400).json({
      message: "At least one field (name, webhookPath, action) is required",
    });
  }

  if (action && !allowedActions.includes(action)) {
    return res.status(400).json({ message: "Invalid action" });
  }

  try {
    const updated = await db
      .update(pipelines)
      .set({
        ...(name && { name }),
        ...(webhookPath && { webhookPath }),
        ...(action && { action }),
      })
      .where(eq(pipelines.id, id))
      .returning();

    if (!updated.length) {
      return res.status(404).json({ message: "Pipeline not found" });
    }

    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({
      message: "Error updating pipeline",
      error,
    });
  }
});

app.delete("/pipelines/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await db
      .delete(pipelines)
      .where(eq(pipelines.id, id))
      .returning();

    if (!deleted.length) {
      return res.status(404).json({ message: "Pipeline not found" });
    }

    res.json({ message: "Deleted successfully", deleted: deleted[0] });
  } catch (error) {
    res.status(500).json({ message: "Error deleting pipeline", error });
  }
});


app.listen(3000, () => console.log("Server running http://localhost:3000 🚀"));