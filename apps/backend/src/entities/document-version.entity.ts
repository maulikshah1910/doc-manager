import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Document } from './document.entity';
import { User } from './user.entity';

@Entity('document_versions')
export class DocumentVersion {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id: number;

    @Column({ type: 'char', length: 36, name: 'document_id' })
    documentId: string;

    @ManyToOne(() => Document, (doc) => doc.versions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'document_id' })
    document: Document;

    @Column({ type: 'smallint', unsigned: true })
    version: number;

    @Column({ type: 'varchar', length: 255, name: 'file_name' })
    fileName: string;

    @Column({ type: 'varchar', length: 100, name: 'mime_type' })
    mimeType: string;

    @Column({ type: 'bigint', unsigned: true, name: 'file_size' })
    fileSize: number;

    @Column({ type: 'varchar', length: 500, name: 'storage_path' })
    storagePath: string;

    @Column({ type: 'bigint', unsigned: true, name: 'uploaded_by_id' })
    uploadedById: number;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'uploaded_by_id' })
    uploadedBy: User;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date;
}
