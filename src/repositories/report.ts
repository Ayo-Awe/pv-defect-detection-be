import { PgDatabase } from "drizzle-orm/pg-core";
import db from "../db";
import { DefectPrediction, detections, images, reports } from "../db/schema";
import { eq } from "drizzle-orm";

export class ReportRepository {
  database: typeof db;

  constructor(database: typeof db) {
    this.database = database;
  }

  // todo: correctly type any later
  async createReport(detectionSetId: number, reportData: any) {
    return await db.transaction(async (tx) => {
      const [report] = await tx
        .insert(reports)
        .values({
          totalDefects: reportData.total,
          defectSummary: reportData.summary,
        })
        .returning();
      const [detectionSet] = await tx
        .update(detections)
        .set({
          reportId: report.id,
        })
        .where(eq(detections.id, detectionSetId))
        .returning();

      if (!detectionSet) {
        throw new Error("Detection Set Not Found");
      }

      return report;
    });
  }
}
