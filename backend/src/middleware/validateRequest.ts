import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";

export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        res.status(422).json({
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details,
        });
        return;
      }
      next(err);
    }
  };
}
