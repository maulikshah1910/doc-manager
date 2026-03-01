import {
    IsOptional,
    IsNumber,
    IsString,
    IsIn,
} from 'class-validator';

export class AdminUpdateUserDto {
    @IsNumber()
    @IsOptional()
    roleId?: number;

    @IsString()
    @IsOptional()
    @IsIn(['active', 'inactive', 'suspended', 'pending'])
    status?: 'active' | 'inactive' | 'suspended' | 'pending';
}
