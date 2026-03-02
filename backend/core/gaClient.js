import { BetaAnalyticsDataClient } from "@google-analytics/data";
import dotenv from "dotenv";
dotenv.config();

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.client_email,
    private_key: process.env.private_key.replace(/\\n/g, "\n"),
    apiKey: process.env.GOOGLE_API_KEY,
  },
});

export { analyticsDataClient };
