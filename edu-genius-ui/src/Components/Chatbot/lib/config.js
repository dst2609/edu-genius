/* commenting this block to run frontend using openai api directly
// Centralized config for provider choice and endpoints
export const APP_NAME = process.env.VITE_APP_NAME || "EduGenius";
export const USE_API_SERVER = (process.env.VITE_USE_API_SERVER || "false").toLowerCase() === "true";

// When using your future API server
export const API_SERVER_BASE = process.env.VITE_API_SERVER_BASE || "http://localhost:3001";
export const API_SERVER_CHAT_PATH = process.env.VITE_API_SERVER_CHAT_PATH || "/chat";

// When directly using a vendor (OpenAI) from the browser (dev only).
export const OPENAI_BASE_URL = process.env.VITE_OPENAI_BASE_URL || "https://api.openai.com/v1";
export const OPENAI_MODEL = process.env.VITE_OPENAI_MODEL || "gpt-4o-mini";
export const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || ""; // dev only; leave empty in prod
*/

// frontend/src/lib/config.js
export const APP_NAME = import.meta.env.VITE_APP_NAME || "EduGenius";
export const USE_API_SERVER = (import.meta.env.VITE_USE_API_SERVER || "false").toLowerCase() === "true";

// When using your future API server
export const API_SERVER_BASE = import.meta.env.VITE_API_SERVER_BASE || "http://localhost:3001";
export const API_SERVER_CHAT_PATH = import.meta.env.VITE_API_SERVER_CHAT_PATH || "/chat";

// Direct OpenAI (DEV ONLY)
export const OPENAI_BASE_URL = import.meta.env.VITE_OPENAI_BASE_URL || "https://api.openai.com/v1";
export const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ""; // dev only; never commit real keys

