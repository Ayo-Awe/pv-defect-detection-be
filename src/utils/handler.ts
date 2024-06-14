import {
  Handler,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";

export function ErrorWrapper(handler: RequestHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}
