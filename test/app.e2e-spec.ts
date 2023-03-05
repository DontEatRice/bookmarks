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

        describe('Edit user', () => {
            it('Should edit user', () => {
                const dto = {
                    firstName: 'Jakub',
                    email: 'test@example.com',
                };
                return pactum
                    .spec()
                    .patch('/users')
                    .withBody(dto)
                    .withHeaders({
                        Authorization: 'Bearer $S{userAt}',
                    })
                    .expectStatus(200)
                    .expectBodyContains(dto.email)
                    .expectBodyContains(dto.firstName);
            });
        });
    });
    describe('Bookmarks', () => {
        describe('Create bookmark', () => {
            it('Create bookmark', () => {
                const dto = {
                    title: 'First bookmark',
                    description: 'Lorem ipsum',
                    link: 'https://example.com/',
                };
                return pactum
                    .spec()
                    .post('/bookmarks')
                    .withHeaders({
                        Authorization: 'Bearer $S{userAt}',
                    })
                    .withBody(dto)
                    .expectStatus(201)
                    .stores('bookmarkId', 'id');
            });
        });
        describe('Get bookmarks', () => {
            it('should get bookmarks', () => {
                return pactum
                    .spec()
                    .get('/bookmarks')
                    .withHeaders({
                        Authorization: 'Bearer $S{userAt}',
                    })
                    .expectStatus(200)
                    .expectJsonLength(1);
            });
        });
        describe('Get bookmark by id', () => {
            it('Get bookmark by id', () => {
                return pactum
                    .spec()
                    .get('/bookmarks/{id}')
                    .withPathParams('id', '$S{bookmarkId}')
                    .withHeaders({
                        Authorization: 'Bearer $S{userAt}',
                    })
                    .expectStatus(200)
                    .expectBodyContains('$S{bookmarkId}');
            });
        });
    });
});
