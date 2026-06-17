import { IsUUID } from 'class-validator';

export class AddSessionMemberDto {
  @IsUUID()
  userId!: string;
}
