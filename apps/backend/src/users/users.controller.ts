import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @RequirePermissions('users.view')
  async findAll() {
    const users = await this.usersService.findAll();

    return {
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        status: user.status,
        role: user.role
          ? {
            id: user.role.id,
            name: user.role.name,
            displayName: user.role.displayName,
          }
          : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    };
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    const userProfile = await this.usersService.findById(user.id);

    // Extract permissions from user's role
    const permissions = userProfile.role?.permissions
      ?.filter((p) => p.isActive)
      .map((p) => p.name) || [];

    return {
      data: {
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        profileImage: userProfile.profileImage,
        role: userProfile.role ? {
          id: userProfile.role.id,
          name: userProfile.role.name,
          displayName: userProfile.role.displayName,
        } : null,
        permissions,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
      },
    };
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.usersService.updateProfile(
      user.id,
      updateProfileDto,
    );

    // Extract permissions from user's role
    const permissions = updatedUser.role?.permissions
      ?.filter((p) => p.isActive)
      .map((p) => p.name) || [];

    return {
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        profileImage: updatedUser.profileImage,
        role: updatedUser.role ? {
          id: updatedUser.role.id,
          name: updatedUser.role.name,
          displayName: updatedUser.role.displayName,
        } : null,
        permissions,
        updatedAt: updatedUser.updatedAt,
      },
      message: 'Profile updated successfully',
    };
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(user.id, changePasswordDto);

    return {
      message: 'Password changed successfully',
    };
  }
}
