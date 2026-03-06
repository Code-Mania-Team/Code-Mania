import { analyticsDataClient } from "../core/gaClient.js";

const propertyId = process.env.property_id;

class GAService {
  async getActiveUsers() {
    const [response] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: "activeUsers" }],
    });

    return response.rows?.[0]?.metricValues?.[0]?.value || 0;
  }

  async getTraffic() {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "activeUsers" },
        { name: "newUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
      orderBys: [
        {
          dimension: { dimensionName: "date" },
        },
      ],
    });

    return response.rows.map((row) => ({
      date: row.dimensionValues[0].value,
      activeUsers: Number(row.metricValues[0].value),
      newusers: Number(row.metricValues[1].value),
      sessions: Number(row.metricValues[2].value),
      screenPageViews: Number(row.metricValues[3].value),
    }));
  }
}

export default GAService;
