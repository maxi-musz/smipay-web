import { useEffect, useRef } from "react";
import { useVtpassElectricityStore } from "@/store/vtpass/vtu/vtpass-electricity-store";

/**
 * Hook to fetch and access VTPass electricity service IDs (discos).
 * Automatically fetches if not cached or cache is expired.
 * Prevents multiple fetches during component mount.
 */
export function useVtpassElectricityServiceIds() {
  const { serviceIds, isLoading, error, fetchServiceIds } = useVtpassElectricityStore();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchServiceIds();
    }
  }, [fetchServiceIds]);

  return {
    serviceIds: serviceIds || [],
    isLoading,
    error,
    refetch: () => fetchServiceIds(true),
  };
}
