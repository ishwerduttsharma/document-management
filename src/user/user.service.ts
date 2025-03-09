import {
  ConflictException,
  InternalServerErrorException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from 'src/database/schema';
import * as bcrypt from 'bcryptjs';
import { eq, ilike, ne, and, SQL } from 'drizzle-orm';
import { users, blackListToken } from '../database/schema';
import { CreateUserDto, UserPaginationDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject('drizzleProvider')
    private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const [checkExistingUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, createUserDto.email));
    if (checkExistingUser) {
      throw new ConflictException(
        `User with email ${createUserDto.email} already exists`,
      );
    }
    try {
      const saltOrRound = 10;
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        saltOrRound,
      );
      const userData = {
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
        createdDate: new Date().toDateString(),
      };

      await this.db.insert(users).values(userData).returning();
      return { message: 'user inserted successfully', status: 200 };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error inserting user',
        error: error.message,
      });
    }
  }

  async findUser(userId: string) {
    let user;
    try {
      [user] = await this.db.select().from(users).where(eq(users.id, userId));
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error retrieving user',
        error: error.message,
      });
    }
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User details fetched successfully',
      data: user,
      statusCode: 200,
    };
  }

  async findUserByEmail(email: string) {
    let user;

    try {
      [user] = await this.db.select().from(users).where(eq(users.email, email));
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error retrieving user',
        error: error.message,
      });
    }
    if (!user) {
      throw new NotFoundException('User not exists with this email');
    }

    return user;
  }

  async findAllUsersByEmail(userId: string, payload: UserPaginationDto) {
    let usersList = new Array({});
    try {
      let limit = payload?.limit ? payload?.limit : 20;
      if (limit > 100) limit = 100;
      const skip = payload?.pageNumber ? (payload?.pageNumber - 1) * limit : 0;
      const email = payload.email;
      usersList = await this.db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(and(ilike(users.email, `%${email}%`), ne(users.id, userId))) // Case-insensitive search
        .offset(skip)
        .limit(limit);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error retrieving users',
        error: error.message,
      });
    }
    if (usersList.length === 0) {
      throw new NotFoundException('No users found with this email');
    }

    return { usersList, status: 200 };
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    const [userExistOrNot] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    if (!userExistOrNot) {
      throw new NotFoundException('User not found');
    }
    try {
      await this.db.update(users).set({ name: updateUserDto.name });
      return {
        message: 'User details updated successfully',
        data: [],
        status: 201,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error updating user',
        error: error.message,
      });
    }
  }

  async logout(token: string, expiresAt: Date) {
    try {
      return await this.db
        .insert(blackListToken)
        .values({ token, expiresAt: expiresAt.toDateString() });
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error blacklisting token',
        error: error.message,
      });
    }
  }

  async searchForBlackListToken(token: string) {
    try {
      const [isBlacklisted] = await this.db
        .select()
        .from(blackListToken)
        .where(eq(blackListToken.token, token));

      return isBlacklisted ? true : false;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error searching blacklisting token',
        error: error.message,
      });
    }
  }
}
