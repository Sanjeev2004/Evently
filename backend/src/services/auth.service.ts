import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";
import { AuthenticationError, ConflictError } from "../errors/AppError.js";
import {
  hashToken,
  signAccess,
  signRefresh,
  verifyRefresh,
} from "../utils/tokens.js";
import { userRepository } from "../repositories/user.repository.js";
const cookieDays = 7;
const issue = async (user: {
  id: string;
  email: string;
  role: "USER" | "ORGANIZER" | "ADMIN";
}) => {
  const payload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + cookieDays * 86400000),
    },
  });
  return { accessToken, refreshToken };
};
export const authService = {
  async register(input: {
    name: string;
    email: string;
    password: string;
    role: "USER" | "ORGANIZER";
  }) {
    if (await userRepository.findByEmail(input.email))
      throw new ConflictError("An account with this email already exists");
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await userRepository.create({ ...input, passwordHash });
    return { user, ...(await issue(user)) };
  },
  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      logger.warn({ email }, "Authentication failed");
      throw new AuthenticationError("Invalid email or password");
    }
    if (user.isBlocked)
      throw new AuthenticationError("This account has been blocked");
    const safe = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
    };
    return { user: safe, ...(await issue(user)) };
  },
  async refresh(token: string) {
    try {
      const decoded = verifyRefresh(token);
      const stored = await prisma.refreshToken.findUnique({
        where: { tokenHash: hashToken(token) },
        include: { user: true },
      });
      if (
        !stored ||
        stored.revokedAt ||
        stored.expiresAt < new Date() ||
        stored.user.isBlocked
      )
        throw new Error();
      await prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });
      return issue({
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      });
    } catch {
      throw new AuthenticationError("Invalid or expired refresh token");
    }
  },
  async logout(token?: string) {
    if (token)
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
  },
};
