const isProduction = typeof location !== 'undefined' && location.port !== '4200';

export const environment = {
  production: isProduction,
  apiUrl: isProduction ? 'https://verabien.duckdns.org/api' : 'http://localhost:3000/',
};
