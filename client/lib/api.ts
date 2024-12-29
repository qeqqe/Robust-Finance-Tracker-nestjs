export const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "An unexpected error occurred",
    }));

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }

    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }
  return response;
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return handleApiError(response);
};
