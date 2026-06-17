import { IsUUID } from 'class-validator';

export class MergeContactDto {
  @IsUUID()
  sourceContactId!: string;
}
