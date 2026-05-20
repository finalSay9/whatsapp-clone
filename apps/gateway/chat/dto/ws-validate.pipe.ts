import { WsException } from "@nestjs/websockets";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";



export async function wsValidate<T extends object>(
    DtoClass: new () => T,
    data: unknown
): Promise<T> {
    //convert plain object to dto instance
    const dto = plainToInstance(DtoClass, data);

    //run validation
    const errors = await validate(dto);

    //if errors found through wsexption with clean message
    if(errors.length > 0) {
        const messages = errors.map((e) => 
            Object.values(e.constraints || {}).join(', ')
        );
        throw new WsException({
            statusCode: 400,
            message: messages,
            error: 'validation failed'
        })
    }
    return dto
}