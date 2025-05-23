import axios from "axios";

const BASE_URL = "https://patient-management-backend-nine.vercel.app";

export const fetchWithRetry = async (
  method = "get",
  endpoint,
  cacheKey,
  body,
  transformResponse = (data) => data,
  retries = 3,
  delay = 500
) => {
  let attempt = 1;

  // Ensure endpoint doesn't include the base URL
  const cleanEndpoint = endpoint.startsWith("http")
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  while (attempt <= retries) {
    try {
      const response = await axios({
        method,
        url: cleanEndpoint,
        data: body,
        timeout: 5000, // 5s timeout
      });

      const data = transformResponse(response.data);
      return data;
    } catch (error) {
      const errorDetails = {
        status: error.response?.status,
        message: error.message,
        url: cleanEndpoint,
        attempt,
        retries,
        cacheKey,
      };

      console.error(`Error ${method} ${cacheKey}:`, errorDetails);

      if (attempt === retries) {
        throw new Error(`Failed to ${method} ${cacheKey}: ${error.message}`);
      }

      console.log(`Retrying ${cacheKey} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt++;
      delay *= 2; // Exponential backoff
    }
  }
};