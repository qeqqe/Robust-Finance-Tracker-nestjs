import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { BankService } from './bank.service';
import { PrismaClient } from '@prisma/client';
import { JwtGuard } from '../auth/guard/jwt.guard';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
} from './dto/transaction.dto';
const prisma = new PrismaClient();

@Controller('bank')
@UseGuards(JwtGuard)
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Get('overview')
  getBankOverview(@Request() req) {
    return this.bankService.getBankOverview(req.user.id);
  }

  @Get('transactions')
  getTransactions(@Request() req) {
    return this.bankService.getTransactions(req.user.id);
  }

  @Post('transactions')
  createTransaction(@Request() req, @Body() dto: CreateTransactionDto) {
    return this.bankService.createTransaction(req.user.id, dto);
  }

  @Patch('transactions/:id')
  updateTransaction(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.bankService.updateTransaction(req.user.id, id, dto);
  }

  @Delete('transactions/:id')
  deleteTransaction(@Request() req, @Param('id') id: string) {
    return this.bankService.deleteTransaction(req.user.id, id);
  }
}
