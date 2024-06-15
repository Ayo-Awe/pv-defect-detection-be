import { Request, Response } from "express";
import {
  BadRequest,
  Conflict,
  ResourceNotFound,
} from "../../../errors/httpErrors";
import db from "../../../db";
import {
  DetectionSetRepository,
  NewDetectionSet,
} from "../../../repositories/detection";
import { ImageRepository, NewImage } from "../../../repositories/image";
import { inngest } from "../../../inngest";

class DetectionSetController {
  async createDetectionSet(req: Request, res: Response) {
    if (!Array.isArray(req.files)) {
      throw new BadRequest(
        "images is a required field",
        "MISSING_REQUIRED_FIELD"
      );
    }

    const files = req.files as Express.MulterS3.File[];

    if (files.length == 0) {
      throw new BadRequest(
        "images is a required field",
        "MISSING_REQUIRED_FIELD"
      );
    }

    const detectionSet = await db.transaction(async (tx) => {
      const detectionSetRepo = new DetectionSetRepository(tx);
      const imagesRepo = new ImageRepository(tx);

      // Create new detection set
      const detectionSetPayload: NewDetectionSet = {
        name: req.body.name || `Detection Set ${req.user!.detectionSetCounter}`,
        totalImages: files.length,
        userId: req.user?.id || 2,
      };
      const detectionSet = await detectionSetRepo.create(detectionSetPayload);

      // Add images to detection set
      const imagesPayload: NewImage[] = files.map((file) => ({
        originalFilename: file.originalname,
        imageUrl: file.location,
        detectionId: detectionSet.id,
      }));
      await imagesRepo.createBulk(imagesPayload);

      return detectionSet;
    });

    await inngest.send({
      name: "app/detection-set.created",
      data: { detectionSet },
    });

    res.created({ detectionSet });
  }

  async getDetectionSetById(req: Request, res: Response) {
    const user = req.user!;

    const detectionSetRepo = new DetectionSetRepository(db);
    const detectionSet = await detectionSetRepo.getById(
      user.id,
      parseInt(req.params.id)
    );

    if (!detectionSet) {
      throw new ResourceNotFound(
        "detection set not found",
        "RESOURCE_NOT_FOUND"
      );
    }

    return res.ok({ detectionSet });
  }

  async getDetectionSets(req: Request, res: Response) {
    const user = req.user!;

    const detectionSetRepo = new DetectionSetRepository(db);
    const detectionSets = await detectionSetRepo.getAllByUser(user.id);

    // todo implement pagination
    return res.ok({ detectionSets });
  }

  async getDetectoinSetImages(req: Request, res: Response) {
    const user = req.user!;
    const imageRepo = new ImageRepository(db);
    const detectionSetRepo = new DetectionSetRepository(db);

    const detectionSet = await detectionSetRepo.getById(
      user.id,
      parseInt(req.params.id)
    );

    if (!detectionSet) {
      throw new ResourceNotFound(
        "detection set not found",
        "RESOURCE_NOT_FOUND"
      );
    }

    // 404 images not avaialbe
    if (detectionSet.status === "pending") {
      throw new ResourceNotFound(
        "images are still being processed, check back later",
        "IMAGES_STILL_PROCESSING"
      );
    }

    const images = await imageRepo.getAllByDetectionSet(detectionSet.id);

    // todo implement pagination
    return res.ok({ images });
  }
}

export default new DetectionSetController();
