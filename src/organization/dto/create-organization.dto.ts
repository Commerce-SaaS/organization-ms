import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  IsUrl,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { OpeningHoursDto } from './opening-hours.dto';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  name: string;

  @IsString()
  @IsOptional()
  @Length(0, 100)
  address?: string;

  @IsUUID()
  ownerId: string;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsEmail()
  contactEmail: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsOptional()
  @IsIn([5, 10, 15, 30])
  orderSchedulingIntervalMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxDishesPerSlot?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => OpeningHoursDto)
  openingHours?: OpeningHoursDto;

  // IANA timezone name (e.g. "Europe/Madrid"). openingHours "HH:mm" values
  // are interpreted in this zone when generating/validating scheduled-order
  // slots.
  @IsOptional()
  @IsTimeZone()
  timezone?: string;
}
