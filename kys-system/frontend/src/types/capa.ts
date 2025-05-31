// CAPA Types for Frontend
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface NonconformitySource {
  id: number;
  sourceName: string;
  description: string;
  isActive: boolean;
}

export type CapaType = 'CORRECTIVE' | 'PREVENTIVE';
export type CapaStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_VERIFICATION' | 'CLOSED' | 'CANCELLED';
export type CapaPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ActionItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface CapaRecord {
  id: number;
  capaNumber: string;
  capaType: CapaType;
  title: string;
  description: string;
  sourceId: number;
  sourceReference?: string;
  detectedDate: string;
  targetCompletionDate: string;
  actualCompletionDate?: string;
  detectedByUserId: number;
  responsibleUserId: number;
  verifiedByUserId?: number;
  priority: CapaPriority;
  status: CapaStatus;
  rootCauseAnalysis?: string;
  proposedActions?: string;
  effectivenessVerified?: boolean;
  verificationComments?: string;
  effectivenessCheckDate?: string;
  costEstimate?: number;
  actualCost?: number;
  recurrencePrevention?: string;
  lessonsLearned?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  detectedByUser: User;
  responsibleUser: User;
  verifiedByUser?: User;
  source: NonconformitySource;
  actionItems: CapaActionItem[];
  documents: CapaDocument[];
}

export interface CapaActionItem {
  id: number;
  capaId: number;
  actionDescription: string;
  assignedToUserId: number;
  dueDate: string;
  completionDate?: string;
  status: ActionItemStatus;
  completionNotes?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  assignedToUser: User;
}

export interface CapaDocument {
  id: number;
  capaId: number;
  documentType: string;
  documentName: string;
  filePath: string;
  uploadedByUserId: number;
  uploadedAt: string;

  // Relations
  uploadedByUser: User;
}

export interface CapaStatistics {
  totalCapas: number;
  openCapas: number;
  inProgressCapas: number;
  closedCapas: number;
  overdueCapas: number;
  correctiveActions: number;
  preventiveActions: number;
  completionRate: string;
}

export interface CapaListParams {
  page?: number;
  limit?: number;
  status?: CapaStatus;
  capaType?: CapaType;
  priority?: CapaPriority;
  responsibleUserId?: number;
  sourceId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface CapaListResponse {
  capas: CapaRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateCapaRequest {
  capaNumber: string;
  capaType: CapaType;
  title: string;
  description: string;
  sourceId: number;
  sourceReference?: string;
  detectedDate: string;
  targetCompletionDate: string;
  detectedByUserId: number;
  responsibleUserId: number;
  priority: CapaPriority;
  rootCauseAnalysis?: string;
  proposedActions?: string;
  costEstimate?: number;
  recurrencePrevention?: string;
}

export interface UpdateCapaRequest {
  title?: string;
  description?: string;
  targetCompletionDate?: string;
  actualCompletionDate?: string;
  responsibleUserId?: number;
  priority?: CapaPriority;
  status?: CapaStatus;
  rootCauseAnalysis?: string;
  proposedActions?: string;
  costEstimate?: number;
  actualCost?: number;
  recurrencePrevention?: string;
  lessonsLearned?: string;
  effectivenessVerified?: boolean;
  verificationComments?: string;
  verifiedByUserId?: number;
  effectivenessCheckDate?: string;
}

export interface CreateActionItemRequest {
  capaId: number;
  actionDescription: string;
  assignedToUserId: number;
  dueDate: string;
  status?: ActionItemStatus;
}

export interface UpdateActionItemRequest {
  actionDescription?: string;
  assignedToUserId?: number;
  dueDate?: string;
  completionDate?: string;
  status?: ActionItemStatus;
  completionNotes?: string;
}

export interface VerifyEffectivenessRequest {
  effectivenessVerified: boolean;
  verificationComments: string;
  effectivenessCheckDate: string;
}

export interface CloseCapaRequest {
  lessonsLearned?: string;
  actualCost?: number;
}

export interface UploadDocumentRequest {
  capaId: number;
  documentType: string;
  documentName: string;
  file: File;
}

// Form interfaces for UI components
export interface CapaFormData {
  capaNumber: string;
  capaType: CapaType;
  title: string;
  description: string;
  sourceId: number;
  sourceReference: string;
  detectedDate: Date;
  targetCompletionDate: Date;
  detectedByUserId: number;
  responsibleUserId: number;
  priority: CapaPriority;
  rootCauseAnalysis: string;
  proposedActions: string;
  costEstimate: string;
  recurrencePrevention: string;
}

export interface ActionItemFormData {
  actionDescription: string;
  assignedToUserId: number;
  dueDate: Date;
  status: ActionItemStatus;
}

export interface DocumentUploadFormData {
  documentType: string;
  documentName: string;
  file: File | null;
}

// Filter and sort interfaces
export interface CapaFilters {
  status: CapaStatus | '';
  capaType: CapaType | '';
  priority: CapaPriority | '';
  responsibleUserId: number | '';
  sourceId: number | '';
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  search: string;
}

export interface CapaSort {
  field: keyof CapaRecord;
  direction: 'asc' | 'desc';
}

// UI State interfaces
export interface CapaUIState {
  selectedCapas: number[];
  filters: CapaFilters;
  sort: CapaSort;
  viewMode: 'list' | 'grid' | 'timeline';
  sidebarOpen: boolean;
  currentPage: number;
  pageSize: number;
}

// Error handling
export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string>;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Utility types
export type CapaStatusDisplay = {
  [K in CapaStatus]: {
    label: string;
    color: string;
    icon: string;
  };
};

export type CapaPriorityDisplay = {
  [K in CapaPriority]: {
    label: string;
    color: string;
    icon: string;
  };
};

export type CapaTypeDisplay = {
  [K in CapaType]: {
    label: string;
    description: string;
    icon: string;
  };
};