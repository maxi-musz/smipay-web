import { useState, useEffect, useRef } from "react";
import { vtpassInternationalAirtimeApi } from "@/services/vtpass/vtu/vtpass-international-airtime-api";
import type {
  IntlAirtimeCountriesResponse,
  IntlAirtimeProductTypesResponse,
  IntlAirtimeOperatorsResponse,
  IntlAirtimeVariationsResponse,
} from "@/types/vtpass/vtu/vtpass-international-airtime";

interface State<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

const countriesCache: { data: IntlAirtimeCountriesResponse["data"] | null; timestamp: number | null } = {
  data: null,
  timestamp: null,
};

const productTypesCache = new Map<string, { data: IntlAirtimeProductTypesResponse["data"]; timestamp: number }>();
const operatorsCache = new Map<
  string,
  { data: IntlAirtimeOperatorsResponse["data"]; timestamp: number }
>();
const variationsCache = new Map<
  string,
  { data: IntlAirtimeVariationsResponse["data"]; timestamp: number }
>();

const CACHE_DURATION = 10 * 60 * 1000;

export function useIntlAirtimeCountries() {
  const [state, setState] = useState<State<IntlAirtimeCountriesResponse["data"]>>({
    data: countriesCache.data,
    isLoading: !countriesCache.data,
    error: null,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (
      countriesCache.data &&
      countriesCache.timestamp &&
      Date.now() - countriesCache.timestamp < CACHE_DURATION
    ) {
      setState({ data: countriesCache.data, isLoading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    vtpassInternationalAirtimeApi
      .getCountries()
      .then((response) => {
        if (response.success && response.data) {
          countriesCache.data = response.data;
          countriesCache.timestamp = Date.now();
          if (mountedRef.current) {
            setState({ data: response.data, isLoading: false, error: null });
          }
        } else if (mountedRef.current) {
          setState({
            data: null,
            isLoading: false,
            error: "Failed to load countries",
          });
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "An error occurred";
        if (mountedRef.current) {
          setState({ data: null, isLoading: false, error: msg });
        }
      });
  }, []);

  return state;
}

export function useIntlAirtimeProductTypes(code: string | null) {
  const [state, setState] = useState<State<IntlAirtimeProductTypesResponse["data"]>>({
    data: null,
    isLoading: false,
    error: null,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!code) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    const cached = productTypesCache.get(code);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setState({ data: cached.data, isLoading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    vtpassInternationalAirtimeApi
      .getProductTypes(code)
      .then((response) => {
        if (response.success && response.data) {
          productTypesCache.set(code, {
            data: response.data,
            timestamp: Date.now(),
          });
          if (mountedRef.current) {
            setState({ data: response.data, isLoading: false, error: null });
          }
        } else if (mountedRef.current) {
          setState({
            data: null,
            isLoading: false,
            error: "Failed to load product types",
          });
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "An error occurred";
        if (mountedRef.current) {
          setState({ data: null, isLoading: false, error: msg });
        }
      });
  }, [code]);

  return state;
}

export function useIntlAirtimeOperators(
  code: string | null,
  productTypeId: string | null
) {
  const [state, setState] = useState<State<IntlAirtimeOperatorsResponse["data"]>>({
    data: null,
    isLoading: false,
    error: null,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!code || !productTypeId) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    const key = `${code}-${productTypeId}`;
    const cached = operatorsCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setState({ data: cached.data, isLoading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    vtpassInternationalAirtimeApi
      .getOperators(code, productTypeId)
      .then((response) => {
        if (response.success && response.data) {
          operatorsCache.set(key, {
            data: response.data,
            timestamp: Date.now(),
          });
          if (mountedRef.current) {
            setState({ data: response.data, isLoading: false, error: null });
          }
        } else if (mountedRef.current) {
          setState({
            data: null,
            isLoading: false,
            error: "Failed to load operators",
          });
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "An error occurred";
        if (mountedRef.current) {
          setState({ data: null, isLoading: false, error: msg });
        }
      });
  }, [code, productTypeId]);

  return state;
}

export function useIntlAirtimeVariations(
  operatorId: string | null,
  productTypeId: string | null
) {
  const [state, setState] = useState<State<IntlAirtimeVariationsResponse["data"]>>({
    data: null,
    isLoading: false,
    error: null,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!operatorId || !productTypeId) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    const key = `${operatorId}-${productTypeId}`;
    const cached = variationsCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setState({ data: cached.data, isLoading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    vtpassInternationalAirtimeApi
      .getVariations(operatorId, productTypeId)
      .then((response) => {
        if (response.success && response.data) {
          variationsCache.set(key, {
            data: response.data,
            timestamp: Date.now(),
          });
          if (mountedRef.current) {
            setState({ data: response.data, isLoading: false, error: null });
          }
        } else if (mountedRef.current) {
          setState({
            data: null,
            isLoading: false,
            error: "Failed to load plans",
          });
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "An error occurred";
        if (mountedRef.current) {
          setState({ data: null, isLoading: false, error: msg });
        }
      });
  }, [operatorId, productTypeId]);

  return state;
}

