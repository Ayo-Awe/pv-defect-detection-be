import { Request, Response } from "express";
import { loginValidator, signupValidator } from "../validators/auth";
import { BadRequest, Conflict } from "../../../errors/httpErrors";
import { users } from "../../../db/schema";
import db from "../../../db";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";

class AuthController {
  async signup(req: Request, res: Response) {
    const { data, error } = signupValidator(req.body);

    if (error) {
      throw new BadRequest(error.message, error.code);
    }

    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, data.email),
    });

    if (existingUser) {
      throw new Conflict(
        "User with email already exists",
        "EXISTING_USER_EMAIL"
      );
    }

    const hashedPasswored = await bcrypt.hash(data.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...data, password: hashedPasswored })
      .returning();

    const accessToken = createAuthToken({ userId: user.id });
    console.log(accessToken);

    res.ok({ user: { ...user, password: undefined }, accessToken });
  }

  async login(req: Request, res: Response) {
    // validate request
    const { data, error } = loginValidator(req.body);

    if (error) {
      throw new BadRequest(error.message, error.code);
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, data.email),
    });

    if (!user) {
      throw new BadRequest(
        "Invalid Email/Password",
        "INVALID_REQUEST_PARAMETERS"
      );
    }

    // Compare user passwords
    const match = await bcrypt.compare(data.password, user.password);
    if (!match) {
      throw new BadRequest(
        "Invalid Email/Password",
        "INVALID_REQUEST_PARAMETERS"
      );
    }

    const accessToken = createAuthToken({ userId: user.id });

    res.ok({ user: { ...user, password: undefined }, accessToken });
  }
}

export function createAuthToken(payload: { userId: number }) {
  return jwt.sign({ uid: payload.userId }, process.env.JWT_SECRET!, {
    expiresIn: "24h",
  });
}

export default new AuthController();
