const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
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
  register: (data: { cnpj: string; name: string; city_id: string; address: string }) => 
    apiFetch("/admin/pharmacy/registration", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    
  getQRCode: () => apiFetch("/admin/instance/qrcode"),
};
