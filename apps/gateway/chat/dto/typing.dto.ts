import { IsUUID, IsBoolean } from 'class-validator';

export class TypingDto {
    @IsUUID()
    recipientId: string

    @IsBoolean()
    isTyping: boolean
}