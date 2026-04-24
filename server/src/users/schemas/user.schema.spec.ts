import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserSchema } from './user.schema';
import * as bcrypt from 'bcrypt';

describe('User Schema', () => {
  let userModel: Model<UserDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot('mongodb://localhost:27017/trello-test'),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
    }).compile();

    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  afterEach(async () => {
    await userModel.deleteMany({});
  });

  describe('password hashing', () => {
    it('should hash password before saving', async () => {
      const plainPassword = 'testPassword123';
      const user = new userModel({
        email: 'test@example.com',
        password: plainPassword,
        name: 'Test User',
      });

      await user.save();

      // Password should be hashed
      expect(user.password).not.toBe(plainPassword);
      expect(user.password.length).toBeGreaterThan(plainPassword.length);

      // Verify the hash is valid
      const isMatch = await bcrypt.compare(plainPassword, user.password);
      expect(isMatch).toBe(true);
    });

    it('should not rehash password if not modified', async () => {
      const plainPassword = 'testPassword123';
      const user = new userModel({
        email: 'test2@example.com',
        password: plainPassword,
        name: 'Test User 2',
      });

      await user.save();
      const hashedPassword = user.password;

      // Update name without changing password
      user.name = 'Updated Name';
      await user.save();

      // Password hash should remain the same
      expect(user.password).toBe(hashedPassword);
    });
  });

  describe('schema validation', () => {
    it('should require email', async () => {
      const user = new userModel({
        password: 'testPassword123',
        name: 'Test User',
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should require password', async () => {
      const user = new userModel({
        email: 'test@example.com',
        name: 'Test User',
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should require name', async () => {
      const user = new userModel({
        email: 'test@example.com',
        password: 'testPassword123',
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      const user1 = new userModel({
        email: 'duplicate@example.com',
        password: 'testPassword123',
        name: 'User 1',
      });
      await user1.save();

      const user2 = new userModel({
        email: 'duplicate@example.com',
        password: 'testPassword456',
        name: 'User 2',
      });

      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('timestamps', () => {
    it('should automatically add createdAt and updatedAt', async () => {
      const user = new userModel({
        email: 'timestamp@example.com',
        password: 'testPassword123',
        name: 'Timestamp User',
      });

      await user.save();

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });
});
