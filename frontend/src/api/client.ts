export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async getJson(path: string) {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
    }
    return res.json();
  }

  async getProfile(userId: string) {
    return this.getJson(`/profile?userId=${encodeURIComponent(userId)}`);
  }

  async getTransactions(userId: string) {
    return this.getJson(`/transactions?userId=${encodeURIComponent(userId)}`);
  }

  async getGoals(userId: string) {
    return this.getJson(`/goals?userId=${encodeURIComponent(userId)}`);
  }

  async getInsights(userId: string) {
    return this.getJson(`/insights?userId=${encodeURIComponent(userId)}`);
  }

  async chat(body: { userId: string; sessionId: string; message: string }) {
    const res = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
    }
    return res.json();
  }

  async getRecommendationsLog(userId: string) {
    return this.getJson(`/recommendations-log?userId=${encodeURIComponent(userId)}`);
  }

  async computeRisk(userId: string, answers: Record<string, any>) {
    const res = await fetch(`${this.baseUrl}/profile/risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, answers }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
    }
    return res.json();
  }
}
