import {
    IsString,
    IsOptional,
    IsBoolean,
    IsArray,
    IsNumber,
    MaxLength,
    MinLength,
    ArrayMinSize,
} from 'class-validator';

export class UpdateRoleDto {
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    @IsOptional()
    name?: string;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    @IsOptional()
    displayName?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsArray()
    @IsNumber({}, { each: true })
    @ArrayMinSize(1, { message: 'At least one permission must be selected' })
    @IsOptional()
    permissionIds?: number[];
}
