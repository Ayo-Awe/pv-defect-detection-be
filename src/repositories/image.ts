import { PgDatabase } from "drizzle-orm/pg-core";
import db from "../db";
import { DefectPrediction, images } from "../db/schema";
import { eq } from "drizzle-orm";

export type NewImage = {
  originalFilename: string;
  imageUrl: string;
  detectionId: number;
};

export class ImageRepository {
  database: typeof db;

  constructor(database: typeof db) {
    this.database = database;
  }

  async create(data: NewImage) {
    const [image] = await this.database.insert(images).values(data).returning();
    return image;
  }

  async createBulk(data: NewImage[]) {
    const results = await this.database.insert(images).values(data).returning();
    return results;
  }

  async setDefectPredictions(id: number, predictions: DefectPrediction[]) {
    const [image] = await this.database
      .update(images)
      .set({
        defectPredictions: predictions,
      })
      .where(eq(images.id, id))
      .returning();

    // image maybe null but typescript doesn't catch that condition
    return image ? image : null;
  }

  async getById(id: number) {
    return this.database.query.images.findFirst({
      where: (images, { eq }) => eq(images.id, id),
    });
  }

  async getAllByDetectionSet(detectionSetId: number) {
    return this.database.query.images.findMany({
      where: (images, { eq }) => eq(images.detectionId, detectionSetId),
    });
  }
}
