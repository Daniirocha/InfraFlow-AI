import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.TECHNICIAN, Role.VIEWER)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('weekly')
  weekly(@Query('weekStart') weekStart?: string) {
    return this.reports.weekly(weekStart);
  }

  @Get('export')
  async export(
    @Query('format') format: 'json' | 'csv' = 'json',
    @Res() res: Response,
  ) {
    const snapshot = await this.reports.exportSnapshot();
    if (format === 'csv') {
      const csv = this.reports.toCsv(snapshot);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="infraflow-export.csv"',
      );
      return res.send(csv);
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.send(JSON.stringify(snapshot, null, 2));
  }
}
