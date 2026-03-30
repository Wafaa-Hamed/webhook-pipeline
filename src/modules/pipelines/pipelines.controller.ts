import { Request, Response } from "express";
import { db } from "../../db";
import { pipelines } from "../../db/schema";

const allowedActions = ["uppercase", "addTimestamp", "reverseString"];

export const createPipeline = async (req: Request, res: Response) => {
  try {
    const { name, webhookPath, action } = req.body;

    if (!name || !webhookPath || !action) {
      return res.status(400).json({
        message: "name, webhookPath and action are required",
      });
    }

    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        message: "Invalid action",
      });
    }

    const result = await db.insert(pipelines).values({
      name,
      webhookPath,
      action,
    }).returning();

    res.status(201).json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};