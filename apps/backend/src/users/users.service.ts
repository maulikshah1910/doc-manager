import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly mailService: MailService,
  ) { }

  async findAll(page: number = 1, limit: number = 10): Promise<{ users: User[], total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await this.userRepository.findAndCount({
      relations: ['role'],
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    return { users, total };
  }

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

  async createUser(dto: CreateUserDto): Promise<User> {
    // Check for duplicate email
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Validate role if provided
    if (dto.roleId) {
      const role = await this.roleRepository.findOne({
        where: { id: dto.roleId },
      });
      if (!role) {
        throw new BadRequestException(`Role with ID ${dto.roleId} not found`);
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const user = this.userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
      roleId: dto.roleId,
      status: dto.status || 'active',
    });

    const savedUser = await this.userRepository.save(user);

    // Reload with relations to get role info for email
    const reloadedUser = await this.findById(savedUser.id);

    // Send welcome email with plain and original password
    await this.mailService.sendUserWelcome(reloadedUser, dto.password);

    return reloadedUser;
  }

  async adminUpdateUser(id: number, dto: AdminUpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    // Validate role if provided
    if (dto.roleId !== undefined) {
      if (dto.roleId === null) {
        user.roleId = null as any;
        user.role = null as any;
      } else {
        const role = await this.roleRepository.findOne({
          where: { id: dto.roleId },
        });
        if (!role) {
          throw new BadRequestException(`Role with ID ${dto.roleId} not found`);
        }
        user.roleId = dto.roleId;
        user.role = role;
      }
    }

    if (dto.status !== undefined) {
      user.status = dto.status;
    }

    await this.userRepository.save(user);

    // Reload with relations
    return this.findById(id);
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

  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.findById(userId);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(changePasswordDto.newPassword, salt);

    await this.userRepository.save(user);
  }

  async updateProfileImage(userId: number, imageUrl: string): Promise<User> {
    const user = await this.findById(userId);
    user.profileImage = imageUrl;
    await this.userRepository.save(user);
    return this.findById(userId);
  }
}
