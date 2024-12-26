import { Injectable, BadRequestException } from '@nestjs/common';
import { RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  register(body: RegisterDto) {
    try {
      return {
        status: 'success',
        message: 'Registration successful',
        email: body.email,
      };
    } catch (error) {
      throw new BadRequestException('Registration failed');
    }
  }
}
