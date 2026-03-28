import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AnalyzeTicketDto {
  @ApiProperty({ description: 'Descrição do chamado para análise' })
  @IsString()
  @MinLength(5)
  description!: string;
}
