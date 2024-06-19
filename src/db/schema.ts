import { relations } from "drizzle-orm";
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
  password: varchar("password", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  detectionSetCounter: integer("detection_set_counter").default(0).notNull(),
});

export const detections = pgTable("detections", {
  id: serial("id").primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  totalImages: integer("total_images").notNull(),
  totalPredictedImages: integer("total_predicted_images").notNull().default(0),
  status: detectionStatus("status").notNull().default("pending"),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
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
  detectionId: integer("detection_id")
    .references(() => detections.id)
    .notNull(),
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

export const detectionSetRelations = relations(detections, ({ one, many }) => ({
  report: one(reports, {
    fields: [detections.reportId],
    references: [reports.id],
  }),
  images: many(images),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  detectionSet: one(detections, {
    fields: [images.detectionId],
    references: [detections.id],
  }),
}));
