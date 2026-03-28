import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority, TicketStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateTicketDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  description!: string;

  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  estimatedMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  equipmentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @ApiPropertyOptional({
    description:
      'Se true, aplica sugestões da IA sobre prioridade/categoria/tempo',
  })
  @IsOptional()
  @IsBoolean()
  applyAi?: boolean;
}
