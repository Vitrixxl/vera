import { treaty } from '@elysiajs/eden';
import type { Api } from '@shared';

export const api = treaty<Api>('http://localhost:3000');
