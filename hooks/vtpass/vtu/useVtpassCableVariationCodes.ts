import { useEffect } from "react";
import { useVtpassCableVariationsStore } from "@/store/vtpass/vtu/vtpass-cable-variations-store";

/**
 * Hook to fetch and access VTPass cable TV variation codes (subscription plans) for a service.
 * Uses Zustand store with 3-day localStorage cache — cable plans rarely change.
 */
export function useVtpassCableVariationCodes(serviceID: string | null) {
  const {
    loadingServiceId,
    error,
    fetchVariationCodes,
    getCached,
  } = useVtpassCableVariationsStore();

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
