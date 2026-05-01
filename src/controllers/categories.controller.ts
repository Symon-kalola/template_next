import ExcelJS from "exceljs";
import { Request, Response, NextFunction } from "express";
import { CategoryModel } from "../models/categories.model";
import { AppError } from "../middleware/error.middleware";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../validators/categories.validator";
import { CategoryStatus } from "../db/schema";

type IdParams = { id: string };

const TEMPLATE_COLUMNS = [
  { header: "name *", key: "name", width: 30 },
  { header: "parent_id", key: "parent_id", width: 15 },
  { header: "display_order", key: "display_order", width: 15 },
  { header: "return_window_days", key: "return_window_days", width: 20 },
  { header: "icon_url", key: "icon_url", width: 40 },
  { header: "banner_url", key: "banner_url", width: 40 },
];

export const CategoriesController = {
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, status, parent_id, search } = req.query as {
        page?: string;
        limit?: string;
        status?: CategoryStatus;
        parent_id?: string;
        search?: string;
      };

      const data = await CategoryModel.findAll({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        status,
        parent_id: parent_id ? Number(parent_id) : undefined,
        search,
      });

      res.json({ success: true, message: "Categories fetched", data });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await CategoryModel.findById(Number(req.params.id));
      if (!category) throw new AppError("Category not found", 404);

      const children = await CategoryModel.findChildren(category.id);
      res.json({ success: true, message: "Category fetched", data: { ...category, children } });
    } catch (err) {
      next(err);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as CreateCategoryInput;

      if (body.parent_id) {
        const parent = await CategoryModel.findById(body.parent_id);
        if (!parent) throw new AppError(`Parent category ID ${body.parent_id} not found`, 404);
      }

      const category = await CategoryModel.create({
        name: body.name,
        parentId: body.parent_id ?? null,
        iconUrl: body.icon_url ?? null,
        bannerUrl: body.banner_url ?? null,
        displayOrder: body.display_order ?? 0,
        returnWindowDays: body.return_window_days ?? null,
      });

      res.status(201).json({ success: true, message: "Category created", data: category });
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as UpdateCategoryInput;

      if (body.parent_id) {
        if (body.parent_id === Number(req.params.id))
          throw new AppError("A category cannot be its own parent", 400);
        const parent = await CategoryModel.findById(body.parent_id);
        if (!parent) throw new AppError(`Parent category ID ${body.parent_id} not found`, 404);
      }

      const category = await CategoryModel.update(Number(req.params.id), {
        name: body.name,
        parentId: body.parent_id,
        iconUrl: body.icon_url,
        bannerUrl: body.banner_url,
        displayOrder: body.display_order,
        returnWindowDays: body.return_window_days,
      });

      if (!category) throw new AppError("Category not found", 404);
      res.json({ success: true, message: "Category updated", data: category });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await CategoryModel.delete(Number(req.params.id));
      if (!category) throw new AppError("Category not found", 404);
      res.json({ success: true, message: "Category deleted", data: category });
    } catch (err) {
      next(err);
    }
  },

  changeStatus: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.body as { status: CategoryStatus };
      const category = await CategoryModel.updateStatus(Number(req.params.id), status);
      if (!category) throw new AppError("Category not found", 404);
      res.json({ success: true, message: `Category status changed to ${status}`, data: category });
    } catch (err) {
      next(err);
    }
  },

  downloadTemplate: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "KDF eShop";
      const ws = workbook.addWorksheet("Categories");

      ws.columns = TEMPLATE_COLUMNS;

      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } };
      headerRow.alignment = { horizontal: "center" };
      headerRow.commit();

      ws.addRow({
        name: "Electronics",
        parent_id: "",
        display_order: 1,
        return_window_days: 30,
        icon_url: "",
        banner_url: "",
      });

      ws.addRow({
        name: "Phones",
        parent_id: "1 (ID of Electronics)",
        display_order: 1,
        return_window_days: 14,
        icon_url: "",
        banner_url: "",
      });

      const noteRow = ws.addRow({
        name: "REQUIRED",
        parent_id: "optional (integer ID)",
        display_order: "optional (integer, default 0)",
        return_window_days: "optional (integer)",
        icon_url: "optional (URL)",
        banner_url: "optional (URL)",
      });
      noteRow.font = { italic: true, color: { argb: "FF6B7280" } };
      noteRow.commit();

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="categories_upload_template.xlsx"');
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      next(err);
    }
  },

  bulkUpload: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) throw new AppError("No file uploaded", 400);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const ws = workbook.worksheets[0];
      if (!ws) throw new AppError("Invalid Excel file — no worksheet found", 400);

      const headerRow = ws.getRow(1);
      const colMap: Record<number, string> = {};
      headerRow.eachCell((cell, col) => {
        colMap[col] = String(cell.value ?? "")
          .toLowerCase()
          .replace(/\s*\*/g, "")
          .trim();
      });

      const summary = { total: 0, created: 0, skipped: 0, errors: [] as object[] };

      for (let rowNum = 2; rowNum <= ws.rowCount; rowNum++) {
        const row = ws.getRow(rowNum);
        if (!row.hasValues) continue;

        const data: Record<string, string | null> = {};
        row.eachCell({ includeEmpty: true }, (cell, col) => {
          if (colMap[col]) data[colMap[col]] = cell.value != null ? String(cell.value).trim() : null;
        });

        summary.total++;

        if (!data.name) {
          summary.skipped++;
          summary.errors.push({ row: rowNum, reason: "Missing required field: name" });
          continue;
        }

        let parentId: number | null = null;
        if (data.parent_id) {
          const pid = parseInt(data.parent_id, 10);
          if (isNaN(pid)) {
            summary.skipped++;
            summary.errors.push({ row: rowNum, reason: `Invalid parent_id: ${data.parent_id}` });
            continue;
          }
          const parent = await CategoryModel.findById(pid);
          if (!parent) {
            summary.skipped++;
            summary.errors.push({ row: rowNum, reason: `Parent category ID ${pid} not found` });
            continue;
          }
          parentId = pid;
        }

        await CategoryModel.create({
          name: data.name,
          parentId,
          displayOrder: data.display_order ? parseInt(data.display_order, 10) || 0 : 0,
          returnWindowDays: data.return_window_days ? parseInt(data.return_window_days, 10) || null : null,
          iconUrl: data.icon_url || null,
          bannerUrl: data.banner_url || null,
        });

        summary.created++;
      }

      res.status(201).json({ success: true, message: "Bulk upload completed", data: summary });
    } catch (err) {
      next(err);
    }
  },
};
