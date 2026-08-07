import { Controller, Get, Query } from '@nestjs/common';
import { Permissions } from '../common/decorators/permissions.decorator';
import { AuditRepository } from './audit.repository';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditRepository: AuditRepository) {}

  @Get()
  @Permissions('audit:read')
  list(@Query() query: ListAuditLogsDto) {
    return this.auditRepository.findRecent(query.limit);
  }
}
