import type { AcceptRequest, AcceptResponse, AISuggestionsAcceptService } from './acceptService';

// Real Accept Service implementation
class RealAISuggestionsAcceptService implements AISuggestionsAcceptService {
  private baseURL: string;
  private getAuthToken: () => string | null;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
    this.getAuthToken = () => {
      return localStorage.getItem('authToken') || null;
    };
  }

  async acceptSuggestion(suggestionId: string, request: AcceptRequest): Promise<AcceptResponse> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    try {
      const response = await fetch(`${this.baseURL}/api/ai-suggestions/${suggestionId}/status`, {
        method: 'PATCH', // NOT POST
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'accepted',
          selected_slot_index: request.selected_slot_index,
          schedule_entry_id: request.schedule_entry_id
        })
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      
      // Backend trả schedule_entry_id trực tiếp, KHÔNG có created_items[]
      return {
        id: data.id || suggestionId,
        status: data.status || 1,
        selected_slot_index: data.selected_slot_index || request.selected_slot_index,
        schedule_entry_id: data.schedule_entry_id,
        message: data.message || 'Suggestion accepted successfully',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString()
      };

    } catch (error: any) {
      console.error('RealAISuggestionsAcceptService error:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      
      if (error.message) {
        throw error;
      }
      
      throw new Error('Failed to accept suggestion');
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = 'Failed to accept suggestion';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    const error: any = new Error(errorMessage);
    error.status = response.status;
    error.response = response;
    
    throw error;
  }
}

export const realAcceptService = new RealAISuggestionsAcceptService();
