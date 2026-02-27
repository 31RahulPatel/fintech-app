// Scheduler Service - handles scheduled prompts API calls
// Supports both local Docker backend and AWS serverless

import { SCHEDULER_API_URL, USE_AWS_SCHEDULER } from '../config/api';

class SchedulerService {
  constructor() {
    this.baseUrl = SCHEDULER_API_URL;
    this.useAws = USE_AWS_SCHEDULER;
  }

  getAuthHeaders() {
    // Use Cognito ID token for AWS API Gateway, fall back to access token for local
    const idToken = localStorage.getItem('idToken');
    const token = idToken || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || error.error || 'Request failed');
    }
    return response.json();
  }

  // Create a new scheduled prompt
  async createSchedule(scheduleData) {
    const url = this.useAws ? `${this.baseUrl}/schedules` : this.baseUrl;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(scheduleData)
    });
    
    return this.handleResponse(response);
  }

  // Get all schedules for current user
  async getSchedules() {
    const url = this.useAws ? `${this.baseUrl}/schedules` : this.baseUrl;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    
    const data = await this.handleResponse(response);
    return data.schedules || data;
  }

  // Get a single schedule by ID
  async getSchedule(scheduleId) {
    const url = this.useAws 
      ? `${this.baseUrl}/schedules/${scheduleId}`
      : `${this.baseUrl}/${scheduleId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  // Update a schedule
  async updateSchedule(scheduleId, updates) {
    const url = this.useAws 
      ? `${this.baseUrl}/schedules/${scheduleId}`
      : `${this.baseUrl}/${scheduleId}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    
    return this.handleResponse(response);
  }

  // Delete a schedule
  async deleteSchedule(scheduleId) {
    const url = this.useAws 
      ? `${this.baseUrl}/schedules/${scheduleId}`
      : `${this.baseUrl}/${scheduleId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  // Toggle schedule active/paused state
  async toggleSchedule(scheduleId) {
    const url = this.useAws 
      ? `${this.baseUrl}/schedules/${scheduleId}/toggle`
      : `${this.baseUrl}/${scheduleId}/toggle`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  // Get execution results for a schedule
  async getResults(scheduleId, options = {}) {
    const { limit = 20, nextToken } = options;
    
    let url = this.useAws 
      ? `${this.baseUrl}/schedules/${scheduleId}/results`
      : `${this.baseUrl}/${scheduleId}/results`;
    
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (nextToken) params.append('nextToken', nextToken);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  // Run a schedule immediately (manual trigger)
  async runNow(scheduleId) {
    const url = this.useAws 
      ? `${this.baseUrl}/schedules/${scheduleId}/run`
      : `${this.baseUrl}/${scheduleId}/run`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();
export default schedulerService;
