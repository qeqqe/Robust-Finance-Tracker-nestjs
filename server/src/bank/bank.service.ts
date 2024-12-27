import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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
}
