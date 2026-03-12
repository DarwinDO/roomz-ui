import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dataQualityKeys } from '@/hooks/useDataQuality';
import {
  createCrawlSource,
  deleteCrawlSource,
  getCrawlJobs,
  getCrawlSources,
  getLocationCrawlReviewQueue,
  getPartnerCrawlReviewQueue,
  previewCrawlSource,
  promoteLocationCrawlIngestion,
  promotePartnerCrawlIngestion,
  refreshLocationCrawlClassification,
  refreshPartnerCrawlClassification,
  rejectLocationCrawlIngestion,
  rejectPartnerCrawlIngestion,
  runCrawlSource,
  syncCrawlJob,
  updateLocationCrawlIngestion,
  updatePartnerCrawlIngestion,
  updateCrawlSource,
  uploadCrawlRecords,
  type CrawlEntityType,
} from '@/services/ingestionReview';

export const ingestionReviewKeys = {
  all: ['ingestion-review'] as const,
  partners: () => [...ingestionReviewKeys.all, 'partners'] as const,
  locations: () => [...ingestionReviewKeys.all, 'locations'] as const,
  sources: (entityType?: CrawlEntityType) => [...ingestionReviewKeys.all, 'sources', entityType ?? 'all'] as const,
  jobs: (entityType?: CrawlEntityType) => [...ingestionReviewKeys.all, 'jobs', entityType ?? 'all'] as const,
};

export function usePartnerCrawlReviewQueue() {
  return useQuery({
    queryKey: ingestionReviewKeys.partners(),
    queryFn: getPartnerCrawlReviewQueue,
  });
}

export function useLocationCrawlReviewQueue() {
  return useQuery({
    queryKey: ingestionReviewKeys.locations(),
    queryFn: getLocationCrawlReviewQueue,
  });
}

export function useCrawlSources(entityType?: CrawlEntityType) {
  return useQuery({
    queryKey: ingestionReviewKeys.sources(entityType),
    queryFn: () => getCrawlSources(entityType),
  });
}

export function useCrawlJobs(entityType?: CrawlEntityType) {
  return useQuery({
    queryKey: ingestionReviewKeys.jobs(entityType),
    queryFn: () => getCrawlJobs(entityType),
  });
}

export function usePromotePartnerCrawlIngestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: promotePartnerCrawlIngestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.partners() });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.jobs('partner') });
    },
  });
}

export function usePromoteLocationCrawlIngestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: promoteLocationCrawlIngestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.locations() });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.jobs('location') });
    },
  });
}

export function useRejectPartnerCrawlIngestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      rejectPartnerCrawlIngestion(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.partners() });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.jobs('partner') });
    },
  });
}

export function useRejectLocationCrawlIngestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      rejectLocationCrawlIngestion(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.locations() });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.jobs('location') });
    },
  });
}

export function useRefreshPartnerCrawlClassification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refreshPartnerCrawlClassification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.partners() });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.jobs('partner') });
    },
  });
}

export function useRefreshLocationCrawlClassification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refreshLocationCrawlClassification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.locations() });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.jobs('location') });
    },
  });
}

export function useUpdatePartnerCrawlIngestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updatePartnerCrawlIngestion>[1] }) =>
      updatePartnerCrawlIngestion(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.partners() });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.jobs('partner') });
      queryClient.invalidateQueries({ queryKey: dataQualityKeys.dashboard() });
    },
  });
}

export function useUpdateLocationCrawlIngestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateLocationCrawlIngestion>[1] }) =>
      updateLocationCrawlIngestion(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.locations() });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.jobs('location') });
      queryClient.invalidateQueries({ queryKey: dataQualityKeys.dashboard() });
    },
  });
}

export function useCreateCrawlSource(entityType?: CrawlEntityType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCrawlSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.sources(entityType) });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.sources() });
    },
  });
}

export function useUpdateCrawlSource(entityType?: CrawlEntityType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateCrawlSource>[1] }) =>
      updateCrawlSource(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.sources(entityType) });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.sources() });
    },
  });
}

export function useDeleteCrawlSource(entityType?: CrawlEntityType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCrawlSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.sources(entityType) });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.sources() });
    },
  });
}

export function useRunCrawlSource(entityType?: CrawlEntityType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runCrawlSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.sources(entityType) });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.jobs(entityType) });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.jobs() });
    },
  });
}

export function usePreviewCrawlSource(entityType?: CrawlEntityType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: previewCrawlSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.sources(entityType) });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.sources() });
    },
  });
}

export function useSyncCrawlJob(entityType?: CrawlEntityType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncCrawlJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.jobs(entityType) });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.jobs() });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.partners() });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.locations() });
    },
  });
}

export function useUploadCrawlRecords(entityType?: CrawlEntityType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadCrawlRecords,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.jobs(entityType) });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.jobs() });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.partners() });
      queryClient.invalidateQueries({ queryKey: ingestionReviewKeys.locations() });
    },
  });
}
