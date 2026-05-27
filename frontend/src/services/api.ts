import { supabase } from "@/lib/supabase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthToken(): Promise<string | undefined> {
  // 1. Tenta pegar a sessão imediatamente
  let { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session?.access_token) {
    return sessionData.session.access_token;
  }

  // 2. Se for null, pode ser que o Supabase ainda esteja inicializando (lendo do localStorage)
  // Fazemos uma pequena espera/polamento de até 1 segundo (5x 200ms)
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const { data: retryData } = await supabase.auth.getSession();
    if (retryData?.session?.access_token) {
      return retryData.session.access_token;
    }
  }

  return undefined;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Buscar token da sessão atual com tratamento de condição de corrida (retry)
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || "Request failed");
  }

  return response.json();
}

export const pharmacyApi = {
  login: async (data: any) => {
    // Mock login para testes de UI
    return new Promise(resolve => setTimeout(() => resolve({ status: "success" }), 1000));
  },
  register: (data: { name: string; email: string; password: string }) => 
    apiFetch("/admin/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    
  getQRCode: (instanceName?: string) => 
    apiFetch(`/admin/instance/qrcode${instanceName ? `?instance_name=${instanceName}` : ''}`),
  getDashboardStats: () => apiFetch("/admin/dashboard/stats"),
  getInstanceStatus: (instanceName?: string) => 
    apiFetch(`/admin/instance/status${instanceName ? `?instance_name=${instanceName}` : ''}`),
  getShifts: () => apiFetch("/admin/shifts"),
  addShift: (date: string) => apiFetch("/admin/shifts", { method: "POST", body: JSON.stringify({ shift_date: date }) }),
  deleteShift: (id: string) => apiFetch(`/admin/shifts/${id}`, { method: "DELETE" }),
  
  // --- CRM ---
  getCRMBoard: () => apiFetch("/admin/crm/board"),
  updateDealStage: (dealId: string, status: string) => 
    apiFetch(`/admin/crm/deals/${dealId}/stage`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  
  getSettings: () => apiFetch("/admin/pharmacy/settings"),
  updateSettings: (data: { 
    system_prompt?: string; 
    rag_base?: string; 
    auto_response?: boolean;
    whatsapp_channel?: string;
    meta_token?: string;
    meta_phone_number_id?: string;
    meta_waba_id?: string;
  }) => 
    apiFetch("/admin/pharmacy/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    
  getPreFillData: () => apiFetch("/admin/pharmacy/pre-fill"),
  finalizeOnboarding: (data: {
    cnpj: string;
    razao_social: string;
    nome_responsavel: string;
    responsible_cpf: string;
    phone: string;
    email: string;
    cep: string;
    address: string;
    neighborhood: string;
    city_name: string;
    state: string;
  }) => 
    apiFetch("/admin/pharmacy/finalize-onboarding", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    
  getProfile: () => apiFetch("/admin/pharmacy/profile"),
  updateProfile: (data: {
    name?: string;
    razao_social?: string;
    cnpj?: string;
    address?: string;
    neighborhood?: string;
    cep?: string;
    state?: string;
    phone?: string;
    email?: string;
    nome_responsavel?: string;
  }) => 
    apiFetch("/admin/pharmacy/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    
  changePassword: (password: string) => 
    apiFetch("/admin/security/change-password", {
      method: "POST",
      body: JSON.stringify({ new_password: password }),
    }),
    
  getUsers: () => apiFetch("/admin/users"),
  addUser: (data: { name: string; email: string; password?: string; role: string }) => 
    apiFetch("/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteUser: (memberId: string) => 
    apiFetch(`/admin/users/${memberId}`, {
      method: "DELETE",
    }),
  changeUserPassword: (memberId: string, password: string) => 
    apiFetch(`/admin/users/${memberId}/change-password`, {
      method: "POST",
      body: JSON.stringify({ new_password: password }),
    }),
};

