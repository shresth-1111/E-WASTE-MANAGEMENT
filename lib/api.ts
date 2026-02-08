export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Bin management
export async function getBins() {
  const response = await fetch(`${API_URL}/admin/bins`);
  if (!response.ok) {
    throw new Error("Failed to fetch bins");
  }
  const data = await response.json();
  return data.bins || [];
}

export async function getNearbyBins(userLat: number, userLng: number, radiusKm: number = 3.0) {
  const bins = await getBins();
  
  // Haversine distance calculation
  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return bins.map((bin: any) => ({
    ...bin,
    distance: haversine(userLat, userLng, bin.latitude, bin.longitude)
  })).filter((bin: any) => bin.distance <= radiusKm);
}

// AI Prediction
export async function predictImage(file: File, token?: string, binId?: string, userLat?: number, userLng?: number) {
  const formData = new FormData();
  formData.append("file", file);
  
  if (binId) formData.append("bin_id", binId);
  if (userLat !== undefined) formData.append("user_lat", userLat.toString());
  if (userLng !== undefined) formData.append("user_lng", userLng.toString());

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/predict`, {
    method: "POST",
    body: formData,
    headers: headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to predict");
  }

  return response.json();
}

// Admin functions
export async function adminLogin(email: string, password: string) {
  const response = await fetch(`${API_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Login failed");
  }

  return response.json();
}

export async function createBin(data: any) {
  const response = await fetch(`${API_URL}/admin/bins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create bin");
  }

  return response.json();
}

export async function updateBin(binId: string, data: any) {
  const response = await fetch(`${API_URL}/admin/bins/${binId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update bin");
  }

  return response.json();
}

export async function deleteBin(binId: string) {
  const response = await fetch(`${API_URL}/admin/bins/${binId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to delete bin");
  }

  return response.json();
}

