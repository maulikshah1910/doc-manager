import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from './user.entity';

@Entity('documents')
export class Document {
    @PrimaryColumn({ type: 'char', length: 36 })
    id: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 255, name: 'file_name' })
    fileName: string;

    @Column({ type: 'varchar', length: 100, name: 'mime_type' })
    mimeType: string;

    @Column({ type: 'bigint', unsigned: true, name: 'file_size' })
    fileSize: number;

    @Column({ type: 'varchar', length: 500, name: 'storage_path' })
    storagePath: string;

    @Column({ type: 'smallint', unsigned: true, default: 1, name: 'current_version' })
    currentVersion: number;

    @Column({ type: 'bigint', unsigned: true, name: 'uploaded_by_id' })
    uploadedById: number;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'uploaded_by_id' })
    uploadedBy: User;

    // String-based relation avoids circular import in isolatedModules mode.
    // TypeORM resolves 'DocumentVersion' by entity name at runtime.
    @OneToMany('DocumentVersion', 'document', { cascade: true })
    versions: object[];

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true, name: 'deleted_at' })
    deletedAt?: Date;

    @BeforeInsert()
    generateId() {
        if (!this.id) {
            this.id = uuidv4();
        }
    }
}
