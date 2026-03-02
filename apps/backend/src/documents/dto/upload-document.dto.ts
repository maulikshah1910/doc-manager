import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UploadDocumentDto {
    @IsString()
    @MaxLength(255)
    title: string;

    @IsOptional()
    @IsString()
    description?: string;
}
