import { INestApplication } from '@nestjs/common/interfaces';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';

describe('App e2e', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    const port = 3333;
    pactum.request.setBaseUrl('http://localhost:' + port);
    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
        await app.listen(port);

        prisma = app.get(PrismaService);
        await prisma.cleanDb();
    });
    afterAll(() => {
        app.close();
    });

    describe('Auth', () => {
        const authDTO = {
            email: '123@example.com',
            password: 'admin12345',
        };
        describe('Signup', () => {
            it('should signup', () => {
                return pactum
                    .spec()
                    .post('/auth/signup')
                    .withBody(authDTO)
                    .expectStatus(201);
            });
            it('should throw if email is empty', () => {
                return pactum
                    .spec()
                    .post('/auth/signin')
                    .withBody({ password: authDTO.password })
                    .expectStatus(400);
            });
        });
        describe('Signin', () => {
            it('should signin', () => {
                return pactum
                    .spec()
                    .post('/auth/signin')
                    .withBody(authDTO)
                    .expectStatus(200)
                    .stores('userAt', 'access_token');
            });
        });
    });
    describe('User', () => {
        describe('Get current user', () => {
            it('Should get current user', () => {
                return pactum
                    .spec()
                    .get('/users/me')
                    .withHeaders({
                        Authorization: 'Bearer $S{userAt}',
                    })
                    .expectStatus(200);
            });
        });

        // describe('Edit user', () => {});
    });
    // describe('Bookmarks', () => {
    //     describe('Get bookmarks', () => {});
    //     describe('Get bookmark by id', () => {});
    //     describe('Create bookmark', () => {});
    //     describe('Edit bookmark', () => {});
    // });
});
