import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from './mail.service';

@Module({
    imports: [
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                transport: {
                    host: config.get<string>('SMTP_HOST', 'localhost'),
                    port: config.get<number>('SMTP_PORT', 1025),
                    secure: false, // true for 465, false for other ports
                    auth: config.get<string>('SMTP_USER')
                        ? {
                            user: config.get<string>('SMTP_USER'),
                            pass: config.get<string>('SMTP_PASSWORD'),
                        }
                        : undefined,
                    ignoreTLS: true,
                },
                defaults: {
                    from: `"No Reply" <${config.get<string>('SMTP_FROM', 'noreply@docmanager.local')}>`,
                },
                template: {
                    dir: join(__dirname, 'templates'),
                    adapter: new HandlebarsAdapter(),
                    options: {
                        strict: true,
                    },
                },
            }),
        }),
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule { }
