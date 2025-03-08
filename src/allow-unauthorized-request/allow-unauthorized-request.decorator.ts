import { SetMetadata } from '@nestjs/common';

export const AllowUnauthorizedRequest = () =>
  SetMetadata('allowUnauthorizedRequests', true);
