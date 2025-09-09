// Simple API client for making HTTP requests
export async function fetchData<T>(url: string, options?: RequestInit): Promise<T> {
const response = await fetch(url, {
    headers: {
    'Content-Type': 'application/json',
    ...options?.headers,
    },
    ...options,
});

if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
}

return response.json();
}

export async function postData<T>(url: string, data: any): Promise<T> {
return fetchData<T>(url, {
    method: 'POST',
    body: JSON.stringify(data),
});
}

export async function putData<T>(url: string, data: any): Promise<T> {
return fetchData<T>(url, {
    method: 'PUT',
    body: JSON.stringify(data),
});
}

export async function deleteData<T>(url: string): Promise<T> {
return fetchData<T>(url, {
    method: 'DELETE',
});
}
