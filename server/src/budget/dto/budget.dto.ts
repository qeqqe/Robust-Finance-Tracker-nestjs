import {
  IsString,
  IsNumber,
  IsEnum,
  IsDate,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { PeriodType } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateBudgetDto {
  @IsString()
  categoryId: string;

  @IsNumber()
  amount: number;

  @IsEnum(PeriodType)
  period: PeriodType;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  startDate: Date;

  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @IsBoolean()
  @IsOptional()
  alerts?: boolean;

  @IsNumber()
  @IsOptional()
  alertThreshold?: number;
}

export class UpdateBudgetDto extends CreateBudgetDto {
  @IsString()
  id: string;
}
