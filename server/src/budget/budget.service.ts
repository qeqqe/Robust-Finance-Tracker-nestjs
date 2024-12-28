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
      // Validate category ownership
      const category = await prisma.category.findFirst({
        where: {
          id: dto.categoryId,
          userId,
        },
      });

      if (!category) {
        throw new ForbiddenException('Category not found or access denied');
      }

      // Create budget with proper date handling
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

    // Get transactions within the budget period
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        categoryId: budget.categoryId,
        date: {
          gte: budget.startDate,
          lte: budget.endDate || new Date(),
        },
      },
    });

    const spent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const remaining = budget.amount - spent;
    const percentage = (spent / budget.amount) * 100;

    return {
      budget,
      spent,
      remaining,
      percentage,
      isOverBudget: spent > budget.amount,
      transactions,
    };
  }

  async getActiveBudgets(userId: string) {
    try {
      // Get active budgets within current period
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

      // Calculate remaining amounts for each budget
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
