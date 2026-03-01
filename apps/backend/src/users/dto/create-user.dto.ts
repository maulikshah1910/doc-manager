import {
    IsString,
    IsEmail,
    IsOptional,
    IsNumber,
    IsIn,
    MinLength,
    MaxLength,
} from 'class-validator';

export class CreateUserDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName: string;

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    @MaxLength(255)
    password: string;

    @IsNumber()
    roleId: number;

    @IsString()
    @IsOptional()
    @IsIn(['active', 'inactive', 'suspended', 'pending'])
    status?: 'active' | 'inactive' | 'suspended' | 'pending';
}
