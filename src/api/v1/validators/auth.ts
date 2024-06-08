import { validateRequestBody } from "../../../utils/validationHelpers";
import { z } from "zod";

export const loginValidator = (payload: any) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string(),
  });

  return validateRequestBody(schema, payload);
};

export const signupValidator = (payload: any) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  return validateRequestBody(schema, payload);
};
