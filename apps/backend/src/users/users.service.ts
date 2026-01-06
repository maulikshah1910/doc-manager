import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'role.permissions'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.findById(userId);

    // Check if email is being updated and if it's already taken by another user
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateProfileDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email address is already in use');
      }
    }

    // Update user fields
    if (updateProfileDto.firstName !== undefined) {
      user.firstName = updateProfileDto.firstName;
    }

    if (updateProfileDto.lastName !== undefined) {
      user.lastName = updateProfileDto.lastName;
    }

    if (updateProfileDto.email !== undefined) {
      user.email = updateProfileDto.email;
    }

    // Save updated user
    const updatedUser = await this.userRepository.save(user);

    // Reload with relations
    return this.findById(updatedUser.id);
  }

  async updateProfileImage(userId: number, imageUrl: string): Promise<User> {
    const user = await this.findById(userId);
    user.profileImage = imageUrl;
    await this.userRepository.save(user);
    return this.findById(userId);
  }
}
