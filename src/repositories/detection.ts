import { eq, sql } from "drizzle-orm";
import db from "../db";
import { detections } from "../db/schema";

export type NewDetectionSet = {
  name: string;
  totalImages: number;
  userId: number;
};

export type UpdateDetectionSet = {
  name?: string;
  totalPredictedImages?: number;
  status?: "pending" | "done";
};

export class DetectionSetRepository {
  database: typeof db;

  constructor(database: typeof db) {
    this.database = database;
  }

  async create(data: NewDetectionSet) {
    const [detection] = await this.database
      .insert(detections)
      .values(data)
      .returning();

    return detection;
  }

  async getById(userId: number, id: number) {
    return this.database.query.detections.findFirst({
      where: (detections, { eq, and }) =>
        and(eq(detections.userId, userId), eq(detections.id, id)),
      with: { report: true },
    });
  }

  async incrementPredictedImages(id: number) {
    const [detectionSet] = await this.database
      .update(detections)
      .set({
        totalPredictedImages: sql`${detections.totalPredictedImages} + 1`,
      })
      .where(eq(detections.id, id))
      .returning();
    return detectionSet;
  }

  async markAsDone(id: number) {
    const [detectionSet] = await this.database
      .update(detections)
      .set({
        status: "done",
      })
      .where(eq(detections.id, id))
      .returning();

    return detectionSet;
  }

  async getAllByUser(userId: number) {
    return this.database.query.detections.findMany({
      where: (detections, { eq, and }) => and(eq(detections.userId, userId)),
      with: { report: true },
    });
  }
}
