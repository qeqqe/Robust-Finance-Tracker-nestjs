import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class BankOverview {
  @IsString()
  @IsNotEmpty()
  token: string;
}
