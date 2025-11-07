/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPORTSDATAIO_API_KEY?: string;
  readonly VITE_SPORTSRADAR_MASTER_API_KEY?: string;
  readonly VITE_THEODDSAPI_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
