import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateProfileDto, UpdatePasswordDto } from './dto/update-user.dto';
import {
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) { }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findIdsByUsernames(usernames: string[]): Promise<string[]> {
    const users = await this.userModel
      .find({ name: { $in: usernames } })
      .select('_id')
      .exec();
    return users.map((user) => user._id.toString());
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.findByEmail(dto.email);
      if (existingUser) throw new ConflictException('Email already in use');
      user.email = dto.email;
    }

    if (dto.name) user.name = dto.name;

    return user.save();
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid old password');

    user.password = dto.newPassword; // Hashing handled by pre-save hook
    await user.save();
  }
}
