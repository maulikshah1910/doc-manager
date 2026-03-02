import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '../entities/document.entity';
import { DocumentVersion } from '../entities/document-version.entity';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
    constructor(
        @InjectRepository(Document)
        private readonly documentsRepo: Repository<Document>,

        @InjectRepository(DocumentVersion)
        private readonly versionsRepo: Repository<DocumentVersion>,
    ) { }

    // ─── List own documents ──────────────────────────────────────────────────

    async findMine(
        userId: number,
        options: { page: number; limit: number; search?: string },
    ): Promise<{ data: Document[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
        const { page, limit, search } = options;

        const qb = this.documentsRepo
            .createQueryBuilder('doc')
            .leftJoinAndSelect('doc.uploadedBy', 'uploader')
            .where('doc.uploadedById = :userId', { userId })
            .andWhere('doc.deletedAt IS NULL');

        if (search) {
            qb.andWhere('(doc.title LIKE :search OR doc.fileName LIKE :search)', {
                search: `%${search}%`,
            });
        }

        const total = await qb.getCount();
        const data = await qb
            .orderBy('doc.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ─── Get single doc (must be owner or have view_all) ─────────────────────

    async findOne(id: string, userId: number, hasViewAll: boolean): Promise<Document> {
        const doc = await this.documentsRepo.findOne({
            where: { id },
            relations: ['uploadedBy', 'versions'],
            withDeleted: false,
        });

        if (!doc) throw new NotFoundException('Document not found');

        if (!hasViewAll && doc.uploadedById !== userId) {
            throw new ForbiddenException('You can only access your own documents');
        }

        return doc;
    }

    // ─── Upload (create) ─────────────────────────────────────────────────────

    async create(
        dto: UploadDocumentDto,
        file: Express.Multer.File & { path: string },
        userId: number,
    ): Promise<Document> {
        if (!file) throw new BadRequestException('No file provided');

        const docId = uuidv4();
        const version = 1;

        // Persist file to: uploads/{docId}/v{version}/{originalname}
        const storagePath = this.buildStoragePath(docId, version, file.originalname);
        this.ensureDir(path.dirname(storagePath));
        fs.renameSync(file.path, storagePath);

        const doc = this.documentsRepo.create({
            id: docId,
            title: dto.title,
            description: dto.description,
            fileName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
            storagePath,
            currentVersion: version,
            uploadedById: userId,
        });

        await this.documentsRepo.save(doc);

        // Record first version
        const docVersion = this.versionsRepo.create({
            documentId: docId,
            version,
            fileName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
            storagePath,
            uploadedById: userId,
        });
        await this.versionsRepo.save(docVersion);

        const created = await this.documentsRepo.findOne({ where: { id: docId }, relations: ['uploadedBy'] });
        if (!created) throw new NotFoundException('Failed to retrieve created document');
        return created;
    }

    // ─── Update metadata ──────────────────────────────────────────────────────

    async update(
        id: string,
        dto: UpdateDocumentDto,
        userId: number,
        hasEditAll: boolean,
    ): Promise<Document> {
        const doc = await this.documentsRepo.findOne({ where: { id } });
        if (!doc) throw new NotFoundException('Document not found');

        if (!hasEditAll && doc.uploadedById !== userId) {
            throw new ForbiddenException('You can only edit your own documents');
        }

        if (dto.title !== undefined) doc.title = dto.title;
        if (dto.description !== undefined) doc.description = dto.description;

        return this.documentsRepo.save(doc);
    }

    // ─── Soft delete ──────────────────────────────────────────────────────────

    async remove(id: string, userId: number, hasDeleteAll: boolean): Promise<void> {
        const doc = await this.documentsRepo.findOne({ where: { id } });
        if (!doc) throw new NotFoundException('Document not found');

        if (!hasDeleteAll && doc.uploadedById !== userId) {
            throw new ForbiddenException('You can only delete your own documents');
        }

        await this.documentsRepo.softDelete(id);
    }

    // ─── Download ─────────────────────────────────────────────────────────────

    async getFilePath(id: string, userId: number, hasViewAll: boolean): Promise<string> {
        const doc = await this.findOne(id, userId, hasViewAll);
        if (!fs.existsSync(doc.storagePath)) {
            throw new NotFoundException('File not found on disk');
        }
        return doc.storagePath;
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private buildStoragePath(docId: string, version: number, originalName: string): string {
        const uploadsRoot = path.resolve(process.cwd(), 'uploads');
        return path.join(uploadsRoot, docId, `v${version}`, originalName);
    }

    private ensureDir(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
}
