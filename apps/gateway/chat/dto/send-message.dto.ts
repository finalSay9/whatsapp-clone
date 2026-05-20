import { IsString, IsUUID, IsNotEmpty, MaxLength } from 'class-validator';


export class SendMessageDto{
    @IsUUID()
    recipientId: string

    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    content: string

}