import {
  boolean,
  pgTable,
  timestamp,
  varchar,
  serial,
  integer,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";

export type DefectPrediction = {
  x: number;
  y: number;
  w: number;
  h: number;
  class: string;
};

export const detectionStatus = pgEnum("detection_status", ["done", "pending"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey().notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const detections = pgTable("detections", {
  id: serial("id").primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  totalImages: integer("total_images").notNull(),
  progress: integer("progress").notNull(),
  status: detectionStatus("status").notNull(),
  userId: integer("user_id").references(() => users.id),
  reportId: integer("report_id").references(() => reports.id),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const images = pgTable("images", {
  id: serial("id").primaryKey().notNull(),
  originalFilename: varchar("original_filename").notNull(),
  imageUrl: varchar("image_url").notNull(),
  defectPredictions: jsonb("defect_predictions")
    .default([])
    .notNull()
    .$type<DefectPrediction[]>(),
  detectionId: integer("detection_id").references(() => detections.id),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey().notNull(),
  totalDefects: integer("total_defects").notNull(),
  defectSummary: jsonb("defect_summary").default({}).notNull(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
