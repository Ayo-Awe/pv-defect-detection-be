import { ZodError, z } from "zod";

export const envSchema = z.object({
  PORT: z.string().optional(),
  DB_URL: z.string(),
  JWT_SECRET: z.string(),
});

try {
  envSchema.parse(process.env);
} catch (error) {
  if (error instanceof ZodError) {
    const missingEnvs = error.errors
      .map((e) => e.path)
      .reduce((acc, v) => acc.concat(v), [])
      .join("\n");

    console.error(`Missing or invalid environment variables: \n${missingEnvs}`);

    process.exit(1);
  }
}
