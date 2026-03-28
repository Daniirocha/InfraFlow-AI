import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EquipmentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateEquipmentDto {
  @ApiProperty({ example: 'PAT-1001' })
  @IsString()
  @MinLength(2)
  patrimonyNumber!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'computer' })
  @IsString()
  type!: string;

  @ApiProperty({ enum: EquipmentStatus })
  @IsEnum(EquipmentStatus)
  status!: EquipmentStatus;

  @ApiProperty({ example: 'Produção' })
  @IsString()
  sector!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
