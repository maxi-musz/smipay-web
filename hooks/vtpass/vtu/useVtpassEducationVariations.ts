import { useEffect } from "react";
import { useVtpassEducationVariationsStore } from "@/store/vtpass/vtu/vtpass-education-variations-store";

/**
 * Hook to fetch and access VTPass education variations (WAEC, JAMB plans) for a service.
 * Uses Zustand store with 3-day localStorage cache — education plans rarely change.
 */
export function useVtpassEducationVariations(serviceID: string | null) {
  const {
    loadingServiceId,
    error,
    fetchVariations,
    getCached,
  } = useVtpassEducationVariationsStore();

  useEffect(() => {
    if (!serviceID) return;
    if (getCached(serviceID)) return;
    fetchVariations(serviceID);
  }, [serviceID, getCached, fetchVariations]);

  const variations = serviceID ? getCached(serviceID) : null;
  const isLoading = serviceID ? loadingServiceId === serviceID : false;

  return {
    variations,
    isLoading,
    error,
    refetch: () => serviceID && fetchVariations(serviceID, true),
  };
}
