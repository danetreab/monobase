import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { DRIZZLE_DB, type Db, user, account, userInvite } from "@repo/db";
import { DrizzleQueryService } from "../../lib/nestjs-query-drizzle";
import type { UserDto } from "./dto/user.dto";

const INVITE_EXPIRY_DAYS = 7;

@Injectable()
export class UsersService extends DrizzleQueryService<UserDto> {
  constructor(@Inject(DRIZZLE_DB) private readonly drizzle: Db) {
    super(drizzle, user, { idColumn: "id", dialect: "pg" });
  }

  async createAdminUser(dto: {
    name: string;
    email: string;
    role: string;
    password?: string;
  }): Promise<{ user: UserDto; inviteToken?: string }> {
    const existing = await this.drizzle.query.user.findFirst({
      where: eq(user.email, dto.email),
    });
    if (existing) throw new BadRequestException("Email already in use");

    const userId = randomBytes(16).toString("hex");
    const now = new Date();

    await this.drizzle.insert(user).values({
      id: userId,
      name: dto.name,
      email: dto.email,
      emailVerified: !!dto.password,
      role: dto.role,
      createdAt: now,
      updatedAt: now,
    });

    const tempPassword = dto.password ?? randomBytes(16).toString("hex");
    const hashed = await hashPassword(tempPassword);

    await this.drizzle.insert(account).values({
      id: randomBytes(8).toString("hex"),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashed,
      createdAt: now,
      updatedAt: now,
    });

    const created = (await this.drizzle.query.user.findFirst({
      where: eq(user.id, userId),
    })) as UserDto;

    if (dto.password) {
      return { user: created };
    }

    const invite = await this.generateInvite(userId);
    return { user: created, inviteToken: invite.token };
  }

  async generateInvite(userId: string) {
    const existing = await this.drizzle.query.user.findFirst({
      where: eq(user.id, userId),
    });
    if (!existing) throw new NotFoundException("User not found");

    await this.drizzle.delete(userInvite).where(eq(userInvite.userId, userId));

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(
      Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.drizzle.insert(userInvite).values({
      id: randomBytes(8).toString("hex"),
      userId,
      token,
      expiresAt,
    });

    return { token, expiresAt };
  }

  async getInviteByToken(token: string) {
    const invite = await this.drizzle.query.userInvite.findFirst({
      where: eq(userInvite.token, token),
      with: { user: true },
    });

    if (!invite) throw new NotFoundException("Invite not found or expired");
    if (invite.expiresAt < new Date())
      throw new BadRequestException("Invite has expired");

    return {
      userId: invite.userId,
      name: invite.user.name,
      email: invite.user.email,
      expiresAt: invite.expiresAt,
    };
  }

  async acceptInvite(token: string, password: string) {
    const invite = await this.drizzle.query.userInvite.findFirst({
      where: eq(userInvite.token, token),
    });

    if (!invite) throw new NotFoundException("Invite not found or expired");
    if (invite.expiresAt < new Date())
      throw new BadRequestException("Invite has expired");

    await this.setPasswordForUser(invite.userId, password);
    await this.drizzle.delete(userInvite).where(eq(userInvite.token, token));

    return true;
  }

  async setUserPassword(userId: string, password: string) {
    const existing = await this.drizzle.query.user.findFirst({
      where: eq(user.id, userId),
    });
    if (!existing) throw new NotFoundException("User not found");

    await this.setPasswordForUser(userId, password);
    await this.drizzle.delete(userInvite).where(eq(userInvite.userId, userId));

    return true;
  }

  private async setPasswordForUser(userId: string, password: string) {
    const hashed = await hashPassword(password);

    const existingAccount = await this.drizzle.query.account.findFirst({
      where: and(
        eq(account.userId, userId),
        eq(account.providerId, "credential"),
      ),
    });

    if (existingAccount) {
      await this.drizzle
        .update(account)
        .set({ password: hashed, updatedAt: new Date() })
        .where(
          and(eq(account.userId, userId), eq(account.providerId, "credential")),
        );
    } else {
      await this.drizzle.insert(account).values({
        id: randomBytes(8).toString("hex"),
        accountId: userId,
        providerId: "credential",
        userId,
        password: hashed,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await this.drizzle
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.id, userId));
  }
}
