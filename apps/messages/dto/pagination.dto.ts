import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class PaginationDto {
    @IsOptional()
    @Type (() => number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type (() => number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number;
}