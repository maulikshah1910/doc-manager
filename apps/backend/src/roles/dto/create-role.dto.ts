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

export class CreateRoleDto {
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    name: string;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    displayName: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsArray()
    @IsNumber({}, { each: true })
    @ArrayMinSize(1, { message: 'At least one permission must be selected' })
    permissionIds: number[];
}
