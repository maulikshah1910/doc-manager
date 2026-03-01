import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @RequirePermissions('users.view')
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = '',
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: string = 'desc',
    @Query('nameFilter') nameFilter: string = '',
    @Query('emailFilter') emailFilter: string = '',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const cleanSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { users, total } = await this.usersService.findAll(
      pageNum,
      limitNum,
      search,
      sortBy,
      cleanSortOrder,
      nameFilter,
      emailFilter,
    );

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
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      }
    };
  }

  // NOTE: Static routes must come BEFORE :id to avoid being parsed as an ID
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

  @Get(':id')
  @RequirePermissions('users.view')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id);

    return {
      data: {
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
      },
    };
  }

  @Post()
  @RequirePermissions('users.create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.createUser(createUserDto);

    return {
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        role: user.role
          ? {
            id: user.role.id,
            name: user.role.name,
            displayName: user.role.displayName,
          }
          : null,
      },
      message: 'User created successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('users.edit')
  @HttpCode(HttpStatus.OK)
  async adminUpdate(
    @CurrentUser() currentUser: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() adminUpdateUserDto: AdminUpdateUserDto,
  ) {
    // Prevent users from editing their own role/status
    if (Number(currentUser.id) === id) {
      throw new ForbiddenException('You cannot modify your own role or status');
    }

    const user = await this.usersService.adminUpdateUser(id, adminUpdateUserDto);

    return {
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        role: user.role
          ? {
            id: user.role.id,
            name: user.role.name,
            displayName: user.role.displayName,
          }
          : null,
      },
      message: 'User updated successfully',
    };
  }
}
