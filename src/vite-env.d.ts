/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_APP_VERSION?: string
  readonly VITE_BLAZE_API_URL?: string
  readonly VITE_BLAZE_CLIENT_ID?: string
  readonly VITE_BLAZE_CLIENT_SECRET?: string
  readonly VITE_BLAZE_API_KEY?: string
  readonly MODE: string
  readonly PROD: boolean
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
