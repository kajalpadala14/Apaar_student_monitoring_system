/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_APPS_SCRIPT_URL?: string;
  readonly VITE_DEFAULT_DISTRICT_NAME?: string;
  readonly VITE_DEFAULT_DISTRICT_CODE?: string;
  readonly VITE_DEFAULT_STATE_NAME?: string;
  readonly VITE_DEFAULT_DEPARTMENT?: string;
  readonly VITE_APP_TITLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
