import api from './api';
import type {
  CapaRecord,
  CapaListParams,
  CapaListResponse,
  CapaStatistics,
  NonconformitySource,
  CreateCapaRequest,
  UpdateCapaRequest,
  CreateActionItemRequest,
  UpdateActionItemRequest,
  VerifyEffectivenessRequest,
  CloseCapaRequest,
  CapaActionItem,
  CapaDocument,
  ApiResponse,
} from '../types/capa';

// Base URL for CAPA endpoints
const CAPA_BASE_URL = '/capa';

export const capaService = {
  // Get CAPA statistics
  getStatistics: async (): Promise<CapaStatistics> => {
    const response = await api.get<ApiResponse<CapaStatistics>>(`${CAPA_BASE_URL}/statistics`);
    if (!response.success) throw new Error(response.error);
    return response.data;
  },

  // Get nonconformity sources
  getNonconformitySources: async (): Promise<NonconformitySource[]> => {
    const response = await api.get<ApiResponse<NonconformitySource[]>>(`${CAPA_BASE_URL}/sources`);
    if (!response.success) throw new Error(response.error);
    return response.data;
  },

  // Get all CAPA records with filtering and pagination
  getCapas: async (params: CapaListParams = {}): Promise<CapaListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const url = `${CAPA_BASE_URL}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<ApiResponse<CapaListResponse>>(url);
    if (!response.success) throw new Error(response.error);
    return response.data;
  },

  // Get CAPA by ID
  getCapaById: async (id: number): Promise<CapaRecord> => {
    const response = await api.get<ApiResponse<CapaRecord>>(`${CAPA_BASE_URL}/${id}`);
    if (!response.success) throw new Error(response.error);
    return response.data;
  },

  // Create new CAPA record
  createCapa: async (data: CreateCapaRequest): Promise<CapaRecord> => {
    const response = await api.post<ApiResponse<CapaRecord>>(CAPA_BASE_URL, data);
    if (!response.success) throw new Error(response.error);
    return response.data;
  },

  // Update CAPA record
  updateCapa: async (id: number, data: UpdateCapaRequest): Promise<CapaRecord> => {
    const response = await api.put<ApiResponse<CapaRecord>>(`${CAPA_BASE_URL}/${id}`, data);
    if (!response.success) throw new Error(response.error);
    return response.data;
  },

  // Verify CAPA effectiveness
  verifyEffectiveness: async (id: number, data: VerifyEffectivenessRequest): Promise<CapaRecord> => {
    const response = await api.post<ApiResponse<CapaRecord>>(`${CAPA_BASE_URL}/${id}/verify`, data);
    if (!response.success) throw new Error(response.error);
    return response.data;
  },

  // Close CAPA record
  closeCapa: async (id: number, data: CloseCapaRequest): Promise<CapaRecord> => {
    const response = await api.post<ApiResponse<CapaRecord>>(`${CAPA_BASE_URL}/${id}/close`, data);
    if (!response.success) throw new Error(response.error);
    return response.data;
  },

  // Action Items
  createActionItem: async (data: CreateActionItemRequest): Promise<CapaActionItem> => {
    const response = await api.post<ApiResponse<CapaActionItem>>(`${CAPA_BASE_URL}/action-items`, data);
    if (!response.success) throw new Error(response.error);
    return response.data;
  },

  updateActionItem: async (id: number, data: UpdateActionItemRequest): Promise<CapaActionItem> => {
    const response = await api.put<ApiResponse<CapaActionItem>>(`${CAPA_BASE_URL}/action-items/${id}`, data);
    if (!response.success) throw new Error(response.error);
    return response.data;
  },

  // Document management
  uploadDocument: async (file: File, capaId: number, documentType: string, documentName: string): Promise<CapaDocument> => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('capaId', capaId.toString());
    formData.append('documentType', documentType);
    formData.append('documentName', documentName);

    const response = await api.upload<ApiResponse<CapaDocument>>(`${CAPA_BASE_URL}/documents`, formData);
    if (!response.success) throw new Error(response.error);
    return response.data;
  },

  downloadDocument: async (documentId: number, filename: string): Promise<void> => {
    await api.download(`${CAPA_BASE_URL}/documents/${documentId}/download`, filename);
  },

  viewDocument: async (documentId: number): Promise<void> => {
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'}${CAPA_BASE_URL}/documents/${documentId}/view`;
    window.open(url, '_blank');
  },

  // Bulk operations
  bulkUpdateStatus: async (capaIds: number[], status: string): Promise<void> => {
    const response = await api.post<ApiResponse<void>>(`${CAPA_BASE_URL}/bulk/status`, {
      capaIds,
      status,
    });
    if (!response.success) throw new Error(response.error);
  },

  bulkDelete: async (capaIds: number[]): Promise<void> => {
    const response = await api.post<ApiResponse<void>>(`${CAPA_BASE_URL}/bulk/delete`, {
      capaIds,
    });
    if (!response.success) throw new Error(response.error);
  },

  // Export operations
  exportToExcel: async (params: CapaListParams = {}): Promise<void> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const url = `${CAPA_BASE_URL}/export/excel${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    await api.download(url, `capa-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  exportToPdf: async (capaId: number): Promise<void> => {
    await api.download(`${CAPA_BASE_URL}/${capaId}/export/pdf`, `capa-${capaId}.pdf`);
  },

  // Reports and analytics
  getOverdueCapas: async (): Promise<CapaRecord[]> => {
    const response = await api.get<ApiResponse<CapaRecord[]>>(`${CAPA_BASE_URL}/reports/overdue`);
    if (!response.success) throw new Error(response.error);
    return response.data;
  },

  getCapasByResponsible: async (userId: number): Promise<CapaRecord[]> => {
    const response = await api.get<ApiResponse<CapaRecord[]>>(`${CAPA_BASE_URL}/reports/by-responsible/${userId}`);
    if (!response.success) throw new Error(response.error);
    return response.data;
  },

  getCompletionTrends: async (period: 'month' | 'quarter' | 'year' = 'month'): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`${CAPA_BASE_URL}/reports/trends?period=${period}`);
    if (!response.success) throw new Error(response.error);
    return response.data;
  },

  // Search and filters
  searchCapas: async (query: string, limit: number = 10): Promise<CapaRecord[]> => {
    const response = await api.get<ApiResponse<CapaRecord[]>>(`${CAPA_BASE_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.success) throw new Error(response.error);
    return response.data;
  },

  // Comments and history
  addComment: async (capaId: number, comment: string): Promise<void> => {
    const response = await api.post<ApiResponse<void>>(`${CAPA_BASE_URL}/${capaId}/comments`, {
      comment,
    });
    if (!response.success) throw new Error(response.error);
  },

  getHistory: async (capaId: number): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(`${CAPA_BASE_URL}/${capaId}/history`);
    if (!response.success) throw new Error(response.error);
    return response.data;
  },

  // Notifications
  getNotifications: async (): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(`${CAPA_BASE_URL}/notifications`);
    if (!response.success) throw new Error(response.error);
    return response.data;
  },

  markNotificationRead: async (notificationId: number): Promise<void> => {
    const response = await api.put<ApiResponse<void>>(`${CAPA_BASE_URL}/notifications/${notificationId}/read`);
    if (!response.success) throw new Error(response.error);
  },
};

export default capaService;