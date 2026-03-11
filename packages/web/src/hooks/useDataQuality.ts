import { useQuery } from '@tanstack/react-query';
import { getDataQualityDashboard } from '@/services/dataQuality';

export const dataQualityKeys = {
  all: ['data-quality'] as const,
  dashboard: () => [...dataQualityKeys.all, 'dashboard'] as const,
};

export function useDataQualityDashboard() {
  return useQuery({
    queryKey: dataQualityKeys.dashboard(),
    queryFn: getDataQualityDashboard,
  });
}