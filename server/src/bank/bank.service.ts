import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
} from './dto/transaction.dto';
import { BulkTransactionDto } from './dto/bulk-transaction.dto';
import { CreateAccountDto } from './dto/account.dto';

const prisma = new PrismaClient();

@Injectable()
export class BankService {
  async getBankOverview(userId: string) {
    const accounts = await prisma.account.findMany({
      where: { userId },
      include: {
        transactions: {
          take: 5,
          orderBy: { date: 'desc' },
        },
      },
    });

    const investments = await prisma.investment.findMany({
      where: { userId },
      include: {
        performance: {
          take: 1,
          orderBy: { date: 'desc' },
        },
      },
    });

    const totalBalance = accounts.reduce(
      (sum, account) => sum + account.balance,
      0,
    );
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalInvestmentValue = investments.reduce((sum, inv) => {
      const currentValue = inv.performance?.[0]?.value ?? inv.amount;
      return sum + currentValue;
    }, 0);

    const investmentGrowth = totalInvestmentValue - totalInvested;
    const investmentGrowthPercentage =
      totalInvested > 0
        ? ((totalInvestmentValue - totalInvested) / totalInvested) * 100
        : 0;

    return {
      accounts: {
        list: accounts,
        total: totalBalance,
        count: accounts.length,
      },
      investments: {
        list: investments,
        invested: totalInvested,
        currentValue: totalInvestmentValue,
        growth: investmentGrowth,
        growthPercentage: investmentGrowthPercentage,
      },
      totalNetWorth: totalBalance + totalInvestmentValue,
    };
  }

  async getTransactions(userId: string) {
    return prisma.transaction.findMany({
      where: { userId },
      include: {
        category: true,
        account: true,
        receipt: true,
        recurringRule: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async createTransaction(userId: string, dto: CreateTransactionDto) {
    try {
      // verify account ownership
      const account = await prisma.account.findFirst({
        where: { id: dto.accountId, userId },
      });

      if (!account) {
        throw new ForbiddenException('Account not found or access denied');
      }

      // Create the transaction
      const transaction = await prisma.$transaction(async (tx) => {
        // Create transaction
        const newTransaction = await tx.transaction.create({
          data: {
            ...dto,
            userId,
            date: new Date(dto.date), // Ensure date is properly parsed
          },
          include: {
            category: true,
            account: true,
          },
        });

        // Update account balance
        await tx.account.update({
          where: { id: dto.accountId },
          data: {
            balance: {
              increment: dto.type === 'EXPENSE' ? -dto.amount : dto.amount,
            },
          },
        });

        return newTransaction;
      });

      return transaction;
    } catch (error) {
      console.error('Transaction creation error:', error);
      throw error;
    }
  }

  async updateTransaction(
    userId: string,
    id: string,
    dto: UpdateTransactionDto,
  ) {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return prisma.transaction.update({
      where: { id },
      data: dto,
      include: {
        category: true,
        account: true,
      },
    });
  }

  async deleteTransaction(userId: string, id: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await prisma.account.update({
      where: { id: transaction.accountId },
      data: {
        balance: {
          decrement:
            transaction.type === 'EXPENSE'
              ? -transaction.amount
              : transaction.amount,
        },
      },
    });

    return prisma.transaction.delete({
      where: { id },
    });
  }

  async importTransactions(userId: string, dto: BulkTransactionDto) {
    // verify account ownership
    const account = await prisma.account.findFirst({
      where: { id: dto.accountId, userId },
    });

    if (!account) {
      throw new ForbiddenException('Account not found or access denied');
    }

    // Calculate total change to account balance
    const totalChange = dto.transactions.reduce((sum, tx) => {
      const amount = tx.type === 'EXPENSE' ? -tx.amount : tx.amount;
      return sum + amount;
    }, 0);

    // create all transactions and update account balance in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // create all transactions
      const createdTransactions = await Promise.all(
        dto.transactions.map((tx) =>
          prisma.transaction.create({
            data: {
              ...tx,
              userId,
              accountId: dto.accountId,
            },
            include: {
              category: true,
              account: true,
            },
          }),
        ),
      );

      // update account balance
      await prisma.account.update({
        where: { id: dto.accountId },
        data: {
          balance: {
            increment: totalChange,
          },
        },
      });

      return createdTransactions;
    });

    return result;
  }

  async getAccounts(userId: string) {
    return prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAccount(userId: string, dto: CreateAccountDto) {
    // if this is the first account for the user
    const accountCount = await prisma.account.count({
      where: { userId },
    });

    return prisma.account.create({
      data: {
        ...dto,
        userId,
        isDefault: accountCount === 0, // first account is default
      },
    });
  }
}
