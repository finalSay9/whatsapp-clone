import { WsException } from "@nestjs/websockets";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";



export async fucntion wsValidate<T extends object>(
    DtoClass: new () => T,
    data: unknown
): Promise<T> {
    //convert plain object to dto instance
    const dto = plainToInstance(DtoClass, data);

    //run validation
    const errors = await validate(dto);

    //if errors found through wsexption with clean message
}