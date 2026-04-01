/**
 * Gemini Service - Handles Gemini AI API calls
 */
import { storageService } from './storageService';

const API_BASE = 'http://localhost:3001/api';

class GeminiService {
  private baseUrl = API_BASE;

  getAuthHeaders(): HeadersInit {
    const token = storageService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async analyzeDocument(documentContent: string, caseContext: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/cases/analyze-document`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        document_content: documentContent,
        case_context: caseContext,
      }),
    });
    if (!response.ok) throw new Error('Failed to analyze document');
    const data = await response.json();
    return data.analysis;
  }

  async generateCreativeImage(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/gemini/generate-image`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) throw new Error('Failed to generate image');
    const data = await response.json();
    return data.image_url;
  }

  async generateContract(contractType: string, details: any): Promise<string> {
    const response = await fetch(`${this.baseUrl}/contracts/generate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        type: contractType,
        details,
      }),
    });
    if (!response.ok) throw new Error('Failed to generate contract');
    const data = await response.json();
    return data.contract_content;
  }

  async chatWithCaseDocument(caseId: string, message: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/cases/${caseId}/chat`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ message }),
    });
    if (!response.ok) throw new Error('Failed to chat with case document');
    const data = await response.json();
    return data.response;
  }

  async generateLegalTemplate(templateType: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/gemini/legal-template`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to generate template');
    const data = await response.json();
    return data.template;
  }
}

export const geminiService = new GeminiService();

// Export individual functions for backward compatibility
export async function analyzeDocument(content: string, context: string): Promise<string> {
  return geminiService.analyzeDocument(content, context);
}

export async function generateCreativeImage(prompt: string): Promise<string> {
  return geminiService.generateCreativeImage(prompt);
}

export async function generateContract(type: string, details: any): Promise<string> {
  return geminiService.generateContract(type, details);
}

export async function chatWithCaseDocument(caseId: string, message: string): Promise<string> {
  return geminiService.chatWithCaseDocument(caseId, message);
}
