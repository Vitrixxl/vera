const isProduction = typeof location !== 'undefined' && location.port !== '4200';

export const environment = {
  production: isProduction,
  apiUrl: isProduction ? '/api' : 'http://localhost:3000',
};
