import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  email?: string;
}
