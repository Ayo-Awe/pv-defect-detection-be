import { Inngest } from "inngest";
import { ImageRepository } from "../repositories/image";
import db from "../db";
import { DefectPrediction } from "../db/schema";
import { DetectionSetRepository } from "../repositories/detection";
import { ReportRepository } from "../repositories/report";
import download from "download";
import axios from "axios";
import FormData from "form-data";
import { createReadStream, fstat, readFile } from "fs";

export const inngest = new Inngest({
  id: "pv-detection",
});

export const predictDetectionSetDefects = inngest.createFunction(
  { id: "predict-detection-set-defects" },
  { event: "app/detection-set.created" },
  async ({ event, step }) => {
    const imageRepo = new ImageRepository(db);

    const images = await step.run("fetch-images", async () => {
      return imageRepo.getAllByDetectionSet(event.data.detectionSet.id);
    });

    const events = images.map((image) => ({
      name: "app/pv-images.predict",
      data: { image },
    }));

    await step.sendEvent("fanout-pv-defect-predictions", events);

    await step.waitForEvent("predictions-completed", {
      event: "app/detection-set.completed",
      timeout: "2hrs",
      match: "data.detectionSet.id",
    });

    return { count: images.length };
  }
);

export const predictDefectInPV = inngest.createFunction(
  { id: "predict-pv-image-defect" },
  { event: "app/pv-images.predict" },
  async ({ event, step }) => {
    const imageRepo = new ImageRepository(db);

    const image = await step.run(
      "fetch image data from database",
      async function () {
        return await imageRepo.getById(event.data.image.id);
      }
    );

    if (!image) throw new Error("Image not found");

    const predictions = await step.run("run ML predictions", async function () {
      const imgRes = await axios.get(image.imageUrl, {
        responseType: "stream",
      });

      const formData = new FormData();
      formData.append("file", imgRes.data, image.originalFilename);

      const response = await axios.post<{
        predictions: DefectPrediction[];
      }>(process.env.ML_SERVER_URL + "/predict", formData, {
        ...formData.getHeaders(),
      });
      return response.data.predictions;
    });

    await step.run("save-predictions", async () => {
      return imageRepo.setDefectPredictions(event.data.image.id, predictions);
    });

    const detectionSet = await step.run(
      "update-detection-set-progress",
      async () => {
        return await db.transaction(async (tx) => {
          const detectionSetRepo = new DetectionSetRepository(tx);

          const detectionSet = await detectionSetRepo.incrementPredictedImages(
            event.data.image.detectionId
          );

          if (detectionSet.totalPredictedImages == detectionSet.totalImages) {
            return await detectionSetRepo.markAsDone(detectionSet.id);
          }

          return detectionSet;
        });
      }
    );

    if (detectionSet.status === "done") {
      await step.sendEvent("detection-set-completed", {
        name: "app/detection-set.completed",
        data: {
          detectionSet,
        },
      });
    }
  }
);

export const generateReport = inngest.createFunction(
  { id: "generate-detection-set-report" },
  { event: "app/detection-set.completed" },
  async ({ event, step }) => {
    const images = await step.run("fetch-images", async () => {
      const imageRepo = new ImageRepository(db);
      return imageRepo.getAllByDetectionSet(event.data.detectionSet.id);
    });

    const defectPredictions = images.reduce<DefectPrediction[]>(
      (preds, image) => preds.concat(image.defectPredictions),
      []
    );

    interface DefectClassAggregate {
      [key: string]: number;
    }

    const defectClassAggregate = defectPredictions.reduce<{
      summary: DefectClassAggregate;
      total: number;
    }>(
      (aggregate, defectPrediction) => {
        if (!aggregate.summary[defectPrediction.class]) {
          aggregate.summary[defectPrediction.class] = 0;
        }
        aggregate.summary[defectPrediction.class] += 1;
        aggregate.total++;
        return aggregate;
      },
      { summary: {}, total: 0 }
    );

    const report = await step.run("create detection set report", async () => {
      const reportRepo = new ReportRepository(db);
      return await reportRepo.createReport(
        event.data.detectionSet.id,
        defectClassAggregate
      );
    });

    return report;
  }
);

export const pingMLServer = inngest.createFunction(
  { id: "ping ml server" },
  { cron: "*/2 * * * *" },
  async () => {
    const response = await axios.get<{ status: boolean }>(
      process.env.ML_SERVER_URL + "/status"
    );
    return response.data.status;
  }
);

export const functions = [
  predictDefectInPV,
  predictDetectionSetDefects,
  generateReport,
  pingMLServer,
];
