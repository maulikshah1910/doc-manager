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
    Query,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('api/v1/roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    // NOTE: This route must come BEFORE :id to avoid "permissions" being parsed as an ID
    @Get('permissions')
    @RequirePermissions('roles.view')
    async findAllPermissions() {
        const permissions = await this.rolesService.findAllPermissions();

        return {
            data: permissions.map((p) => ({
                id: p.id,
                name: p.name,
                displayName: p.displayName,
                description: p.description,
                module: p.module,
            })),
        };
    }

    @Get()
    @RequirePermissions('roles.view')
    async findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ) {
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;

        const { roles, total } = await this.rolesService.findAll(pageNum, limitNum);

        return {
            data: roles.map((role) => ({
                id: role.id,
                name: role.name,
                displayName: role.displayName,
                description: role.description,
                isActive: role.isActive,
                permissions: role.permissions.map((p) => ({
                    id: p.id,
                    name: p.name,
                    displayName: p.displayName,
                    module: p.module,
                })),
                createdAt: role.createdAt,
                updatedAt: role.updatedAt,
            })),
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            }
        };
    }

    @Get(':id')
    @RequirePermissions('roles.view')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const role = await this.rolesService.findById(id);

        return {
            data: {
                id: role.id,
                name: role.name,
                displayName: role.displayName,
                description: role.description,
                isActive: role.isActive,
                permissions: role.permissions.map((p) => ({
                    id: p.id,
                    name: p.name,
                    displayName: p.displayName,
                    module: p.module,
                })),
                createdAt: role.createdAt,
                updatedAt: role.updatedAt,
            },
        };
    }

    @Post()
    @RequirePermissions('roles.create')
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createRoleDto: CreateRoleDto) {
        const role = await this.rolesService.create(createRoleDto);

        return {
            data: {
                id: role.id,
                name: role.name,
                displayName: role.displayName,
                description: role.description,
                isActive: role.isActive,
                permissions: role.permissions.map((p) => ({
                    id: p.id,
                    name: p.name,
                    displayName: p.displayName,
                    module: p.module,
                })),
            },
            message: 'Role created successfully',
        };
    }

    @Put(':id')
    @RequirePermissions('roles.edit')
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateRoleDto: UpdateRoleDto,
    ) {
        const role = await this.rolesService.update(id, updateRoleDto);

        return {
            data: {
                id: role.id,
                name: role.name,
                displayName: role.displayName,
                description: role.description,
                isActive: role.isActive,
                permissions: role.permissions.map((p) => ({
                    id: p.id,
                    name: p.name,
                    displayName: p.displayName,
                    module: p.module,
                })),
            },
            message: 'Role updated successfully',
        };
    }
}
