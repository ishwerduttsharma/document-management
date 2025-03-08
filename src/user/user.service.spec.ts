import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import {
  InternalServerErrorException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { users, blackListToken } from '../database/schema';

const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
};

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: 'drizzleProvider', useValue: mockDb },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      try {
        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValueOnce([]),
          }),
        });

        mockDb.insert.mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: jest
              .fn()
              .mockResolvedValueOnce([
                { id: '123', email: 'test@example.com' },
              ]),
          }),
        });

        const result = await service.create({
          name: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
        });

        console.log('Result:', result); // Debugging output

        expect(result).toEqual({
          message: 'user inserted successfully',
          status: 200,
        });

        expect(mockDb.insert).toHaveBeenCalled();
      } catch (error) {
        console.error('Test failed:', error);
        throw error; // Ensure Jest logs the actual error
      }
    });
    it('should throw ConflictException if user already exists', async () => {
      try {
        // Fix: Properly mock the entire database query chain
        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest
              .fn()
              .mockResolvedValueOnce([
                { id: '123', email: 'test@example.com' },
              ]), // Simulate existing user
          }),
        });

        await expect(
          service.create({
            name: 'John',
            email: 'test@example.com',
            password: 'pass123',
          }),
        ).rejects.toThrow(ConflictException);
      } catch (error) {
        console.error('Test failed:', error);
        throw error; // Ensure Jest logs the actual error
      }
    });
  });

  describe('findUser', () => {
    it('should return user details', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValueOnce([
            {
              id: '123',
              email: 'test@example.com',
              name: 'test',
              password: 'aaaa',
              platformRole: 'USER',
              createdDate: '2025-03-08 00:00:00',
              updatedDate: '2025-03-08 00:00:00',
            },
          ]),
        }),
      });

      const result = await service.findUser('123');

      expect(result).toEqual({
        message: 'User details fetched successfully',
        data: {
          id: '123',
          email: 'test@example.com',
          name: 'test',
          password: 'aaaa',
          platformRole: 'USER',
          createdDate: '2025-03-08 00:00:00',
          updatedDate: '2025-03-08 00:00:00',
        },
        statusCode: 200,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValueOnce([]), // Simulating no user found
        }),
      });

      await expect(service.findUser('123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update user details', async () => {
      // Correctly mock update function
      mockDb.update.mockReturnValue({
        set: jest.fn().mockResolvedValueOnce([]), // Simulating update success
      });

      const result = await service.update('123', { name: 'New Name' });

      expect(result).toEqual({
        message: 'User details updated successfully',
        data: [],
        status: 201,
      });

      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on update failure', async () => {
      mockDb.update.mockReturnValue({
        set: jest.fn().mockImplementationOnce(() => {
          throw new Error('DB error'); // Simulate database error
        }),
      });

      await expect(service.update('123', { name: 'New Name' })).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('logout', () => {
    it('should insert token into blacklist', async () => {
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValueOnce([]),
      });

      const result = await service.logout('some-token', new Date());
      expect(mockDb.insert).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toBeDefined();
    });

    it('should throw InternalServerErrorException on insert failure', async () => {
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockImplementationOnce(() => {
          throw new Error('DB error');
        }),
      });

      await expect(service.logout('some-token', new Date())).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('searchForBlackListToken', () => {
    beforeEach(() => {
      jest.clearAllMocks(); // Reset all mocks before each test
    });

    it('should return true if token is blacklisted', async () => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValueOnce([{ token: 'some-token' }]); // Simulate blacklisted token

      const result = await service.searchForBlackListToken('some-token');
      expect(result).toBe(true);
    });

    it('should return false if token is not blacklisted', async () => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValueOnce([]); // Simulate empty result

      const result = await service.searchForBlackListToken('some-token');
      console.log('Mocked DB Response:', result); // Debugging line
      expect(result).toBe(false);
    });
  });
});
