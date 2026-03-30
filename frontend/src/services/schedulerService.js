// Scheduler Service - handles scheduled prompts API calls
// Supports both local Docker backend and AWS serverless

import { SCHEDULER_API_URL, USE_AWS_SCHEDULER } from '../config/api';

class SchedulerService {
  constructor() {
    this.baseUrl = SCHEDULER_API_URL;
    this.useAws = USE_AWS_SCHEDULER;
  }

  getAuthHeaders() {
    // For AWS API Gateway, use the access token from Cognito
    const token = localStorage.getItem('token');
    const idToken = localStorage.getItem('idToken');
    
    if (!token && !idToken) {
      console.warn('No authentication token found');
    }
    
    return {
      'Content-Type': 'application/json',
      // Use access token for API Gateway authorization
      ...(token && { 'Authorization': `Bearer ${token}` }),
      // Also include user info if available
      ...(idToken && { 'X-ID-Token': idToken })
    };
  }

  async handleResponse(response) {
    if (!response.ok) {
      if (response.status === 401) {
        console.error('Scheduler API: Unauthorized - check authentication');
        // Optionally redirect to login or refresh token
      }
      const error = await response.json().catch(() => ({ message: `HTTP ${response.status}: ${response.statusText}` }));
      throw new Error(error.message || error.error || `Request failed with status ${response.status}`);
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
    // Temporary mock data for presentation
    if (!localStorage.getItem('token')) {
      return [];
    }
    
    try {
      const url = this.useAws ? `${this.baseUrl}/schedules` : this.baseUrl;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      const data = await this.handleResponse(response);
      return data.schedules || data;
    } catch (error) {
      console.warn('Scheduler API unavailable, using mock data:', error.message);
      // Return mock data for presentation
      return [
        {
          _id: 'mock-1',
          prompt: 'Daily market analysis for NIFTY 50',
          frequency: 'daily',
          time: '09:00',
          isActive: true,
          emailResults: true,
          runCount: 15,
          lastRun: new Date().toISOString()
        },
        {
          _id: 'mock-2', 
          prompt: 'Weekly portfolio performance summary',
          frequency: 'weekly',
          days: ['monday'],
          time: '18:00',
          isActive: false,
          emailResults: true,
          runCount: 4,
          lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    }
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
