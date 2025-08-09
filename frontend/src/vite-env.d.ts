/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string
  readonly VITE_SAPPHIRE_RPC_URL: string
  readonly VITE_CONTRACT_ADDRESS: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
