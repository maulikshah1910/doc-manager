import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(Permission)
        private readonly permissionRepository: Repository<Permission>,
    ) { }

    async findAll(): Promise<Role[]> {
        return this.roleRepository.find({
            order: { id: 'ASC' },
        });
    }

    async findAllPermissions(): Promise<Permission[]> {
        return this.permissionRepository.find({
            where: { isActive: true },
            order: { module: 'ASC', name: 'ASC' },
        });
    }

    async findById(id: number): Promise<Role> {
        const role = await this.roleRepository.findOne({
            where: { id },
        });

        if (!role) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }

        return role;
    }

    async create(dto: CreateRoleDto): Promise<Role> {
        // Check for duplicate name
        const existing = await this.roleRepository.findOne({
            where: { name: dto.name },
        });
        if (existing) {
            throw new ConflictException(`Role with name "${dto.name}" already exists`);
        }

        // Find the permissions by IDs
        const permissions = await this.permissionRepository.find({
            where: { id: In(dto.permissionIds) },
        });

        const role = this.roleRepository.create({
            name: dto.name,
            displayName: dto.displayName,
            description: dto.description,
            isActive: dto.isActive ?? true,
            permissions,
        });

        return this.roleRepository.save(role);
    }

    async update(id: number, dto: UpdateRoleDto): Promise<Role> {
        const role = await this.findById(id);

        // Check for duplicate name (if changing)
        if (dto.name && dto.name !== role.name) {
            const existing = await this.roleRepository.findOne({
                where: { name: dto.name },
            });
            if (existing) {
                throw new ConflictException(`Role with name "${dto.name}" already exists`);
            }
        }

        // Update scalar fields
        if (dto.name !== undefined) role.name = dto.name;
        if (dto.displayName !== undefined) role.displayName = dto.displayName;
        if (dto.description !== undefined) role.description = dto.description;
        if (dto.isActive !== undefined) role.isActive = dto.isActive;

        // Update permissions if provided
        if (dto.permissionIds !== undefined) {
            const permissions = await this.permissionRepository.find({
                where: { id: In(dto.permissionIds) },
            });
            role.permissions = permissions;
        }

        return this.roleRepository.save(role);
    }
}
