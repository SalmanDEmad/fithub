import { QueryClient } from '@tanstack/react-query';

export const mobileQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
    },
  },
});
