import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  DuplicateEmailException,
  InvalidCredentialsException,
} from '../common/exceptions/custom.exceptions';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: Model<UserDocument>;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    _id: 'user123',
    email: 'test@example.com',
    password: 'hashedPassword123',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
  };

  const mockUserModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
    };

    it('should successfully register a new user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      
      const savedUser = { ...mockUser, ...registerDto };
      const mockSave = jest.fn().mockResolvedValue(savedUser);
      
      // Mock the userModel constructor
      (userModel as any) = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));
      service['userModel'] = userModel as any;

      const result = await service.register(registerDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should throw DuplicateEmailException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        DuplicateEmailException,
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const userWithHashedPassword = { ...mockUser, password: hashedPassword };
      
      mockUsersService.findByEmail.mockResolvedValue(userWithHashedPassword);
      mockJwtService.sign.mockReturnValue('jwt-token-123');

      const result = await service.login(loginDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.token).toBe('jwt-token-123');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          userId: userWithHashedPassword._id.toString(),
          email: userWithHashedPassword.email,
        },
        { expiresIn: '7d' },
      );
    });

    it('should throw InvalidCredentialsException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        InvalidCredentialsException,
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
    });

    it('should throw InvalidCredentialsException if password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('differentPassword', 10);
      const userWithHashedPassword = { ...mockUser, password: hashedPassword };
      
      mockUsersService.findByEmail.mockResolvedValue(userWithHashedPassword);

      await expect(service.login(loginDto)).rejects.toThrow(
        InvalidCredentialsException,
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
    });
  });

  describe('JWT token generation', () => {
    it('should generate token with correct payload and expiration', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userWithHashedPassword = { ...mockUser, password: hashedPassword };
      
      mockUsersService.findByEmail.mockResolvedValue(userWithHashedPassword);
      mockJwtService.sign.mockReturnValue('jwt-token-123');

      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      await service.login(loginDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          userId: mockUser._id.toString(),
          email: mockUser.email,
        },
        { expiresIn: '7d' },
      );
    });
  });
});
