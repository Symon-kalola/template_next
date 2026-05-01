import ExcelJS from "exceljs";
import { eq } from "drizzle-orm";
import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users, roles } from "../db/schema";
import { UserModel } from "../models/users.model";
import { AppError } from "../middleware/error.middleware";
import { hashPassword } from "../utils/hash";
import {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  ChangeStatusInput,
  UserFiltersInput,
} from "../validators/users.validator";
import { UserStatus } from "../db/schema";

type IdParams = { id: string };

const TEMPLATE_COLUMNS = [
  { header: "service_number *", key: "service_number", width: 22 },
  { header: "first_name *", key: "first_name", width: 20 },
  { header: "last_name", key: "last_name", width: 20 },
  { header: "email", key: "email", width: 28 },
  { header: "phone", key: "phone", width: 16 },
  { header: "rank", key: "rank", width: 16 },
  { header: "unit", key: "unit", width: 20 },
];

export const UsersController = {
  downloadTemplate: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "KDF eShop";
      const ws = workbook.addWorksheet("Users");

      ws.columns = TEMPLATE_COLUMNS;

      // Style header row
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      headerRow.alignment = { horizontal: "center" };
      headerRow.commit();

      // Sample data row
      ws.addRow({
        service_number: "SVC-001",
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        phone: "+254700000000",
        rank: "Captain",
        unit: "Unit Alpha",
      });

      // Notes row
      const noteRow = ws.addRow({
        service_number: "REQUIRED",
        first_name: "REQUIRED",
        last_name: "optional",
        email: "optional",
        phone: "optional",
        rank: "optional",
        unit: "optional",
      });
      noteRow.font = { italic: true, color: { argb: "FF6B7280" } };
      noteRow.commit();

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="users_upload_template.xlsx"',
      );

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

      // Map header names from row 1 (strip *, spaces, lowercase)
      const headerRow = ws.getRow(1);
      const colMap: Record<number, string> = {};
      headerRow.eachCell((cell, col) => {
        colMap[col] = String(cell.value ?? "")
          .toLowerCase()
          .replace(/\s*\*/g, "")
          .trim();
      });

      // Find or create "customer" role
      let customerRole = await db
        .select()
        .from(roles)
        .where(eq(roles.name, "customer"))
        .then((r) => r[0] ?? null);
      if (!customerRole) {
        customerRole = await db
          .insert(roles)
          .values({ name: "customer", description: "Regular customer" })
          .returning()
          .then((r) => r[0]);
      }

      const summary = { total: 0, created: 0, skipped: 0, errors: [] as object[] };

      for (let rowNum = 2; rowNum <= ws.rowCount; rowNum++) {
        const row = ws.getRow(rowNum);
        if (!row.hasValues) continue;

        const data: Record<string, string | null> = {};
        row.eachCell({ includeEmpty: true }, (cell, col) => {
          if (colMap[col]) {
            data[colMap[col]] = cell.value != null ? String(cell.value).trim() : null;
          }
        });

        summary.total++;

        if (!data.service_number || !data.first_name) {
          summary.skipped++;
          summary.errors.push({
            row: rowNum,
            reason: "Missing required fields: service_number, first_name",
          });
          continue;
        }

        const existing = await UserModel.findByServiceNumber(data.service_number);
        if (existing) {
          summary.skipped++;
          summary.errors.push({
            row: rowNum,
            serviceNumber: data.service_number,
            reason: "Service number already exists",
          });
          continue;
        }

        await db.insert(users).values({
          serviceNumber: data.service_number,
          firstName: data.first_name,
          lastName: data.last_name || null,
          email: data.email || null,
          phone: data.phone || null,
          rank: data.rank || null,
          unit: data.unit || null,
          status: "pending",
          roleId: customerRole.id,
          passwordHash: null,
        });

        summary.created++;
      }

      res.status(201).json({ success: true, message: "Bulk upload completed", data: summary });
    } catch (err) {
      next(err);
    }
  },

  adminCreate: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as AdminCreateUserInput;

      const existing = await UserModel.findByServiceNumber(body.service_number);
      if (existing) throw new AppError("Service number already exists", 409);

      if (body.email) {
        const emailUser = await UserModel.findByEmail(body.email);
        if (emailUser) throw new AppError("Email is already in use", 409);
      }

      const passwordHash = await hashPassword(body.service_number);

      const user = await UserModel.create({
        serviceNumber: body.service_number,
        firstName: body.first_name,
        lastName: body.last_name,
        email: body.email,
        phone: body.phone,
        rank: body.rank,
        unit: body.unit,
        roleId: body.role_id,
        status: "active",
        passwordHash,
      });

      res.status(201).json({
        success: true,
        message: `User created. Default password is the service number (${body.service_number}). Ask the user to change it after first login.`,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },

  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, status, role_id, search } = req.query as unknown as UserFiltersInput;

      const data = await UserModel.findAll({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        status: status as UserStatus | undefined,
        roleId: role_id,
        search,
      });

      res.json({ success: true, message: "Users fetched", data });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await UserModel.findByIdWithRole(Number(req.params.id));
      if (!user) throw new AppError("User not found", 404);
      res.json({ success: true, message: "User fetched", data: user });
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as AdminUpdateUserInput;

      if (body.email) {
        const emailUser = await UserModel.findByEmail(body.email);
        if (emailUser && emailUser.id !== Number(req.params.id))
          throw new AppError("Email is already in use", 409);
      }

      const user = await UserModel.updateById(Number(req.params.id), {
        firstName: body.first_name,
        lastName: body.last_name,
        email: body.email,
        phone: body.phone,
        rank: body.rank,
        unit: body.unit,
        roleId: body.role_id,
      });

      if (!user) throw new AppError("User not found", 404);
      res.json({ success: true, message: "User updated", data: user });
    } catch (err) {
      next(err);
    }
  },

  changeStatus: async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.body as ChangeStatusInput;
      const user = await UserModel.updateStatus(Number(req.params.id), status);
      if (!user) throw new AppError("User not found", 404);
      res.json({ success: true, message: `User status changed to ${status}`, data: user });
    } catch (err) {
      next(err);
    }
  },
};
