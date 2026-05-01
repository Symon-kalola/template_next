import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

type Target = "body" | "params" | "query";

export const validate =
  (schema: ZodSchema, target: Target = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }
    // Express 5 makes req.query a read-only getter — must use defineProperty
    if (target === "query") {
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
      });
    } else {
      req[target] = result.data;
    }
    next();
  };
