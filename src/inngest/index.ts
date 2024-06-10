import { Inngest } from "inngest";
import { ImageRepository } from "../repositories/image";
import db from "../db";
import { DefectPrediction } from "../db/schema";
import { randomInt } from "crypto";
import { DetectionSetRepository } from "../repositories/detection";

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
      data: {
        image,
      },
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

    const predictions: DefectPrediction[] = [
      {
        class: "hotspot",
        x: 30,
        y: 10,
        w: 12,
        h: randomInt(0, 30),
      },
      {
        class: "snail-trail",
        x: 30,
        y: randomInt(0, 30),
        w: 12,
        h: 15,
      },
    ];

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

export const functions = [predictDefectInPV, predictDetectionSetDefects];
