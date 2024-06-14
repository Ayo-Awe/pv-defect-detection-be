import {
  Handler,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";

export function ErrorWrapper(handler: RequestHandler) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      console.log("hello");
      return next(error);
    }
  };
}
