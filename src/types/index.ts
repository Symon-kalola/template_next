import { Request, Response, NextFunction } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
