import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateOrganizationDto } from './create-organization.dto';
import { IsUUID, IsOptional, IsString} from 'class-validator';

export class UpdateOrganizationDto extends PartialType(
  OmitType(CreateOrganizationDto, ['ownerId'] as const),
) {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  stripeAccountId?: string;
}
