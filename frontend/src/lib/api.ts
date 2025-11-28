import { treaty } from '@elysiajs/eden';
import type { Api } from '@shared';
import { environment } from '../environments/environment';

//@ts-expect-error
export const api = treaty<Api>(environment.apiUrl, {
  fetch: {
    credentials: 'include',
  },
}) as ReturnType<typeof treaty<Api>>['api'];
