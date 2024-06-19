import { desc, eq, sql } from "drizzle-orm";
import db from "../db";
import { detections, users } from "../db/schema";

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
    return await this.database.transaction(async (tx) => {
      const [detection] = await this.database
        .insert(detections)
        .values(data)
        .returning();

      await this.database
        .update(users)
        .set({ detectionSetCounter: sql`${users.detectionSetCounter} + 1` })
        .where(eq(users.id, data.userId));

      return detection;
    });
  }

  async getById(userId: number, id: number) {
    return this.database.query.detections.findFirst({
      where: (detections, { eq, and }) =>
        and(eq(detections.userId, userId), eq(detections.id, id)),
      with: { report: true, images: true },
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
      with: { report: true, images: true },
      orderBy: [desc(detections.createdAt)],
    });
  }
}
