import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AiService } from './ai.service';
import { AnalyzeTicketDto } from './dto/analyze-ticket.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.TECHNICIAN, Role.VIEWER)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('analyze-ticket')
  analyze(@Body() body: AnalyzeTicketDto) {
    return this.ai.analyzeTicketDescription(body.description);
  }

  @Get('recommendations')
  recommendations() {
    return this.ai.recommendations();
  }
}
