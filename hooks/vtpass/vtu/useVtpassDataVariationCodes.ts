import { useEffect } from "react";
import { useVtpassDataVariationsStore } from "@/store/vtpass/vtu/vtpass-data-variations-store";

/**
 * Hook to fetch and access VTPass data variation codes (plans) for a service.
 * Uses Zustand store with 3-day localStorage cache — network plans rarely change.
 */
export function useVtpassDataVariationCodes(serviceID: string | null) {
  const {
    loadingServiceId,
    error,
    fetchVariationCodes,
    getCached,
  } = useVtpassDataVariationsStore();

  useEffect(() => {
    if (!serviceID) return;
    if (getCached(serviceID)) return;
    fetchVariationCodes(serviceID);
  }, [serviceID, getCached, fetchVariationCodes]);

  const variationCodes = serviceID ? getCached(serviceID) : null;
  const isLoading = serviceID ? loadingServiceId === serviceID : false;

  return {
    variationCodes,
    isLoading,
    error,
    refetch: () => serviceID && fetchVariationCodes(serviceID, true),
  };
}
