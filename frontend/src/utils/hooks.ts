import { useEffect, useRef } from 'react';
import axios from 'axios';
import type { AxiosInstance } from 'axios';

import { useKeycloak } from '@react-keycloak/web';

export const useAxios = (baseURL: string) => {
  const axiosInstance = useRef<AxiosInstance>();
  const { keycloak, initialized } = useKeycloak();
  const kcToken = keycloak?.token ?? '';

  useEffect(() => {
    axiosInstance.current = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': initialized ? `Bearer ${kcToken}` : undefined,
      },
      withCredentials: true
    });

    return () => {
      axiosInstance.current = undefined;
    };
  }, [baseURL, initialized, kcToken]);

  return axiosInstance;
};