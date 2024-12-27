import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { BankService } from './bank.service';
import { PrismaClient } from '@prisma/client';
import { JwtGuard } from '../auth/guard/jwt.guard';
const prisma = new PrismaClient();

@Controller('bank')
@UseGuards(JwtGuard)
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Get('overview')
  getBankOverview(@Request() req) {
    return this.bankService.getBankOverview(req.user.id);
  }
}
