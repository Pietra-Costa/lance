import { Controller, Get, Param } from '@nestjs/common';
import { AuditService } from './audit.service';
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}
  @Get()
  history() {
    return this.audit.history();
  }

  @Get('lots/:lotId') lotHistory(@Param('lotId') lotId: string) {
    return this.audit.lotHistory(lotId);
  }
  @Get('verify') verify() {
    return this.audit.verify();
  }
}
