import { IsUUID, IsEnum } from 'class-validator';
import { UserAuthzRefreshReason } from '../enums/user_authz_refresh_reason.enum';

export class UserAuthzRefreshDto {
  @IsUUID()
  userId: string;

  @IsEnum(UserAuthzRefreshReason)
  reason: UserAuthzRefreshReason;

  @IsUUID()
  organizationId: string;
}
