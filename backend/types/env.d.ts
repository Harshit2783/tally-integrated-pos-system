declare namespace NodeJS {
  interface ProcessEnv {
    TALLY_URL: string;
    COMPANY_NAME?: string; 
    PORT?: string
    // Add more env vars as needed
  }
}
