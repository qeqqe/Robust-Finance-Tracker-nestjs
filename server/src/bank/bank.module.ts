import { Module, forwardRef } from '@nestjs/common';
import { BankService } from './bank.service';
import { BankController } from './bank.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [BankService],
  controllers: [BankController],
  exports: [BankService],
})
export class BankModule {}
