import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient, PeriodType } from '@prisma/client';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';

const prisma = new PrismaClient();

@Injectable()
export class BudgetService {
  async getBudgets(userId: string) {
    return prisma.budget.findMany({
      where: { userId },
      include: {
        category: true,
      },
    });
  }

  async createBudget(userId: string, dto: CreateBudgetDto) {
    try {
      if (dto.amount <= 0) {
        throw new BadRequestException('Budget amount must be greater than 0');
      }

      if (
        dto.alertThreshold &&
        (dto.alertThreshold < 0 || dto.alertThreshold > 100)
      ) {
        throw new BadRequestException(
          'Alert threshold must be between 0 and 100',
        );
      }

      const category = await prisma.category.findFirst({
        where: {
          id: dto.categoryId,
          userId,
        },
      });

      if (!category) {
        throw new ForbiddenException('Category not found or access denied');
      }

      const existingBudget = await prisma.budget.findFirst({
        where: {
          userId,
          categoryId: dto.categoryId,
          period: dto.period,
          startDate: { lte: dto.startDate },
          OR: [{ endDate: null }, { endDate: { gte: dto.startDate } }],
        },
      });

      if (existingBudget) {
        throw new BadRequestException(
          'A budget already exists for this category in the specified period',
        );
      }

      return await prisma.budget.create({
        data: {
          userId,
          categoryId: dto.categoryId,
          amount: dto.amount,
          period: dto.period,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          alerts: dto.alerts ?? true,
          alertThreshold: dto.alertThreshold ?? 80,
        },
        include: {
          category: true,
        },
      });
    } catch (error) {
      console.error('Budget creation error:', error);
      throw new BadRequestException(error.message || 'Failed to create budget');
    }
  }

  async getBudgetProgress(userId: string, budgetId: string) {
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
      include: { category: true },
    });

    if (!budget) throw new NotFoundException('Budget not found');

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        categoryId: budget.categoryId,
        type: 'EXPENSE',
        date: {
          gte: budget.startDate,
          lte: budget.endDate || new Date(),
        },
      },
    });

    const spent = Math.abs(
      transactions.reduce((sum, tx) => sum + tx.amount, 0),
    );
    const remaining = Math.max(budget.amount - spent, 0);
    const percentage = (spent / budget.amount) * 100;

    return {
      budget,
      spent,
      remaining,
      percentage: Math.min(percentage, 100),
      isOverBudget: spent > budget.amount,
      transactions,
    };
  }

  async getActiveBudgets(userId: string) {
    try {
      const budgets = await prisma.budget.findMany({
        where: {
          userId,
          startDate: { lte: new Date() },
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
        include: {
          category: true,
        },
      });

      const budgetsWithProgress = await Promise.all(
        budgets.map(async (budget) => {
          const progress = await this.getBudgetProgress(userId, budget.id);
          return {
            id: budget.id,
            categoryId: budget.categoryId,
            amount: budget.amount,
            remaining: budget.amount - progress.spent,
            spent: progress.spent,
            category: budget.category,
          };
        }),
      );

      return budgetsWithProgress;
    } catch (error) {
      console.error('Error getting active budgets:', error);
      throw error;
    }
  }
}
