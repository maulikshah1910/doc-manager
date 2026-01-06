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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
}
