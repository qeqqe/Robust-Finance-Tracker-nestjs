import {
  Controller,
  UseGuards,
  Get,
  Post,
  Request,
  Body,
  Param,
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { CreateBudgetDto } from './dto/budget.dto';

@Controller('budget')
@UseGuards(JwtGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get()
  async getBudgets(@Request() req) {
    return this.budgetService.getBudgets(req.user.id);
  }

  @Post()
  async createBudget(@Request() req, @Body() dto: CreateBudgetDto) {
    return this.budgetService.createBudget(req.user.id, dto);
  }

  @Get('progress/:id')
  async getBudgetProgress(@Request() req, @Param('id') id: string) {
    return this.budgetService.getBudgetProgress(req.user.id, id);
  }

  @Get('active')
  async getActiveBudgets(@Request() req) {
    try {
      const budgets = await this.budgetService.getActiveBudgets(req.user.id);
      return budgets;
    } catch (error) {
      console.error('Error fetching active budgets:', error);
      throw error;
    }
  }

  // ...other endpoints...
}
