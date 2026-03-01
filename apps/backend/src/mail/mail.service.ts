import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
    ) { }

    async sendUserWelcome(user: User, plainPassword?: string): Promise<boolean> {
        try {
            const loginUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

            const roleName = user.role ? user.role.displayName : 'Standard User';

            await this.mailerService.sendMail({
                to: user.email,
                subject: 'Welcome to Document Manager! Your acccount is ready.',
                template: './welcome', // `.hbs` extension is appended automatically
                context: {
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    password: plainPassword || 'Admin should provide this to you securely if missing here.',
                    role: roleName,
                    loginUrl,
                },
            });

            this.logger.log(`Welcome email sent successfully to ${user.email}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send welcome email to ${user.email}: ${error.message}`, error.stack);
            return false;
        }
    }
}
