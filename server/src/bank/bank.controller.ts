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
import { BulkTransactionDto } from './dto/bulk-transaction.dto';
import { CreateAccountDto } from './dto/account.dto';

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

  @Get('accounts')
  getAccounts(@Request() req) {
    return this.bankService.getAccounts(req.user.id);
  }

  @Post('transactions')
  createTransaction(@Request() req, @Body() dto: CreateTransactionDto) {
    return this.bankService.createTransaction(req.user.id, dto);
  }

  @Post('accounts')
  createAccount(@Request() req, @Body() dto: CreateAccountDto) {
    return this.bankService.createAccount(req.user.id, dto);
  }

  @Post('transactions/import')
  async importTransactions(@Request() req, @Body() dto: BulkTransactionDto) {
    try {
      console.log('Received import request:', {
        userId: req.user.id,
        accountId: dto.accountId,
        transactionCount: dto.transactions?.length,
      });

      return await this.bankService.importTransactions(req.user.id, dto);
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
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
