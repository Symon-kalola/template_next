import ExcelJS from "exceljs";
import { Request, Response, NextFunction } from "express";
import { ShopModel } from "../models/shops.model";
import { ShopAdminModel } from "../models/shop_admins.model";
import { UserModel } from "../models/users.model";
import { AppError } from "../middleware/error.middleware";
import {
  CreateShopInput,
  UpdateShopInput,
  AddShopAdminsInput,
  RemoveShopAdminsInput,
} from "../validators/shops.validator";
import { ShopStatus } from "../db/schema";

type IdParams = { id: string };

const TEMPLATE_COLUMNS = [
  { header: "name *", key: "name", width: 25 },
  { header: "description", key: "description", width: 35 },
  { header: "unit", key: "unit", width: 20 },
  { header: "geo_lat", key: "geo_lat", width: 15 },
  { header: "geo_long", key: "geo_long", width: 15 },
];

export const ShopsController = {
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, status, search } = req.query as {
        page?: string;
        limit?: string;
        status?: ShopStatus;
        search?: string;
      };

      const data = await ShopModel.findAll({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        status,
        search,
      });

      res.json({ success: true, message: "Shops fetched", data });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shop = await ShopModel.findById(Number(req.params.id));
      if (!shop) throw new AppError("Shop not found", 404);
      res.json({ success: true, message: "Shop fetched", data: shop });
    } catch (err) {
      next(err);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as CreateShopInput;
      const shop = await ShopModel.create({
        name: body.name,
        description: body.description,
        imageUrl: body.image_url,
        unit: body.unit,
        geoLat: body.geo_lat,
        geoLong: body.geo_long,
      });
      res.status(201).json({ success: true, message: "Shop created", data: shop });
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as UpdateShopInput;
      const shop = await ShopModel.update(Number(req.params.id), {
        name: body.name,
        description: body.description,
        imageUrl: body.image_url,
        unit: body.unit,
        geoLat: body.geo_lat,
        geoLong: body.geo_long,
      });
      if (!shop) throw new AppError("Shop not found", 404);
      res.json({ success: true, message: "Shop updated", data: shop });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shop = await ShopModel.delete(Number(req.params.id));
      if (!shop) throw new AppError("Shop not found", 404);
      res.json({ success: true, message: "Shop deleted", data: shop });
    } catch (err) {
      next(err);
    }
  },

  changeStatus: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.body as { status: ShopStatus };
      const shop = await ShopModel.updateStatus(Number(req.params.id), status);
      if (!shop) throw new AppError("Shop not found", 404);
      res.json({ success: true, message: `Shop status changed to ${status}`, data: shop });
    } catch (err) {
      next(err);
    }
  },

  downloadTemplate: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "KDF eShop";
      const ws = workbook.addWorksheet("Shops");

      ws.columns = TEMPLATE_COLUMNS;

      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF16A34A" } };
      headerRow.alignment = { horizontal: "center" };
      headerRow.commit();

      ws.addRow({
        name: "Shop Alpha",
        description: "Main branch in Nairobi CBD",
        unit: "Nairobi",
        geo_lat: -1.286389,
        geo_long: 36.817223,
      });

      const noteRow = ws.addRow({
        name: "REQUIRED",
        description: "optional",
        unit: "optional",
        geo_lat: "optional (decimal, e.g. -1.286389)",
        geo_long: "optional (decimal, e.g. 36.817223)",
      });
      noteRow.font = { italic: true, color: { argb: "FF6B7280" } };
      noteRow.commit();

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", 'attachment; filename="shops_upload_template.xlsx"');
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

        await ShopModel.create({
          name: data.name,
          description: data.description || null,
          unit: data.unit || null,
          geoLat: data.geo_lat ? parseFloat(data.geo_lat) : null,
          geoLong: data.geo_long ? parseFloat(data.geo_long) : null,
        });

        summary.created++;
      }

      res.status(201).json({ success: true, message: "Bulk upload completed", data: summary });
    } catch (err) {
      next(err);
    }
  },

  // Shop Admins
  getAdmins: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shop = await ShopModel.findById(Number(req.params.id));
      if (!shop) throw new AppError("Shop not found", 404);
      const data = await ShopAdminModel.findByShopId(Number(req.params.id));
      res.json({ success: true, message: "Shop admins fetched", data });
    } catch (err) {
      next(err);
    }
  },

  addAdmins: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shopId = Number(req.params.id);
      const shop = await ShopModel.findById(shopId);
      if (!shop) throw new AppError("Shop not found", 404);

      const { admins } = req.body as AddShopAdminsInput;

      // Validate all user IDs exist
      for (const admin of admins) {
        const user = await UserModel.findSafeById(admin.user_id);
        if (!user) throw new AppError(`User ID ${admin.user_id} not found`, 404);
      }

      await ShopAdminModel.addAdmins(
        shopId,
        admins.map((a) => ({ userId: a.user_id, isPrimaryAdmin: a.is_primary_admin })),
      );

      const data = await ShopAdminModel.findByShopId(shopId);
      res.json({ success: true, message: "Admins added to shop", data });
    } catch (err) {
      next(err);
    }
  },

  removeAdmins: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shopId = Number(req.params.id);
      const shop = await ShopModel.findById(shopId);
      if (!shop) throw new AppError("Shop not found", 404);

      const { user_ids } = req.body as RemoveShopAdminsInput;
      await ShopAdminModel.removeAdmins(shopId, user_ids);

      const data = await ShopAdminModel.findByShopId(shopId);
      res.json({ success: true, message: "Admins removed from shop", data });
    } catch (err) {
      next(err);
    }
  },
};
