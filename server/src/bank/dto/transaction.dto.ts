import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { TransactionType, TransactionStatus } from '@prisma/client';

export class CreateTransactionDto {
  @IsString()
  accountId: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsDateString()
  date: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;
}

export class UpdateTransactionDto extends CreateTransactionDto {
  @IsString()
  id: string;
}
