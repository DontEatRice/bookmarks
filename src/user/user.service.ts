import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EditUserDto } from './dto';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async editUser(userId: number, userDto: EditUserDto) {
        const user = await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                ...userDto,
            },
        });

        delete user.hash;
        return user;
    }
}
