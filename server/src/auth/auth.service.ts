import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as argon2 from 'argon2';
import { BankService } from 'src/bank/bank.service';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => BankService))
    private bankService: BankService,
  ) {}

  async register(body: RegisterDto) {
    try {
      const hashedPassword = await argon2.hash(body.password);
      const user = await prisma.user.create({
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          password: hashedPassword,
        },
      });

      // Create default categories for new user
      await this.bankService.createDefaultCategories(user.id);

      return this.signToken(user.id, user.email, user.firstName);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Email already exists');
      }
      throw new BadRequestException('Registration failed');
    }
  }

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.password, dto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        firstName: user.firstName,
      },
      {
        secret: process.env.JWT_SECRET || 'super-secret',
      },
    );

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
      },
    };
  }

  private async signToken(userId: string, email: string, firstName: string) {
    const payload = {
      sub: userId,
      email,
      firstName,
    };

    try {
      const token = await this.jwtService.signAsync(payload, {
        expiresIn: '1d',
        secret: process.env.JWT_SECRET,
      });

      return {
        access_token: token,
        user: { email, firstName },
      };
    } catch (error) {
      console.error('Token signing error:', error);
      throw new UnauthorizedException('Token generation failed');
    }
  }
}
