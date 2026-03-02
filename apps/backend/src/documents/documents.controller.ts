import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    Req,
    Res,
    UseInterceptors,
    UploadedFile,
    ParseIntPipe,
    DefaultValuePipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as os from 'os';
import type { Response, Request } from 'express';
import * as path from 'path';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('api/v1/documents')
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) { }

    // ─── GET /api/v1/documents  ───────────────────────────────────────────────
    // Returns the current user's own documents (paginated, searchable)
    @Get()
    @RequirePermissions('documents.view')
    async findMine(
        @Req() req: Request & { user: { id: number; permissions: string[] } },
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('search') search?: string,
    ) {
        return this.documentsService.findMine(req.user.id, { page, limit, search });
    }

    // ─── GET /api/v1/documents/:id  ───────────────────────────────────────────
    @Get(':id')
    @RequirePermissions('documents.view')
    async findOne(
        @Param('id') id: string,
        @Req() req: Request & { user: { id: number; permissions: string[] } },
    ) {
        const hasViewAll = req.user.permissions.includes('documents.view_all');
        return this.documentsService.findOne(id, req.user.id, hasViewAll);
    }

    // ─── POST /api/v1/documents  ───────────────────────────────────────────────
    @Post()
    @RequirePermissions('documents.create')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: os.tmpdir(), // temp storage; service moves file to final path
                filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
            }),
            limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
        }),
    )
    async create(
        @Body() dto: UploadDocumentDto,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: Request & { user: { id: number } },
    ) {
        return this.documentsService.create(dto, file, req.user.id);
    }

    // ─── PATCH /api/v1/documents/:id  ─────────────────────────────────────────
    @Patch(':id')
    @RequirePermissions('documents.edit')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateDocumentDto,
        @Req() req: Request & { user: { id: number; permissions: string[] } },
    ) {
        const hasEditAll = req.user.permissions.includes('documents.edit_all');
        return this.documentsService.update(id, dto, req.user.id, hasEditAll);
    }

    // ─── DELETE /api/v1/documents/:id  ────────────────────────────────────────
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @RequirePermissions('documents.delete')
    async remove(
        @Param('id') id: string,
        @Req() req: Request & { user: { id: number; permissions: string[] } },
    ) {
        const hasDeleteAll = req.user.permissions.includes('documents.delete_all');
        return this.documentsService.remove(id, req.user.id, hasDeleteAll);
    }

    // ─── GET /api/v1/documents/:id/download  ──────────────────────────────────
    @Get(':id/download')
    @RequirePermissions('documents.download')
    async download(
        @Param('id') id: string,
        @Req() req: Request & { user: { id: number; permissions: string[] } },
        @Res() res: unknown,
    ) {
        const hasViewAll = req.user.permissions.includes('documents.view_all');
        const filePath = await this.documentsService.getFilePath(id, req.user.id, hasViewAll);
        (res as Response).download(filePath, path.basename(filePath));
    }
}
