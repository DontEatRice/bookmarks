import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

export const GetUser = createParamDecorator(
    <Tkey extends keyof User>(
        data: Tkey | undefined,
        ctx: ExecutionContext,
    ) => {
        const request = ctx.switchToHttp().getRequest();
        if (data) {
            return request.user[data];
        }
        return request.user;
    },
);
