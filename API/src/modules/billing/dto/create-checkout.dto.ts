import { IsIn, IsOptional, IsUrl } from 'class-validator';

export class CreateCheckoutDto {
  @IsIn(['pro'])
  planCode!: 'pro';

  @IsOptional()
  @IsUrl({ require_tld: false })
  successUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  cancelUrl?: string;
}
