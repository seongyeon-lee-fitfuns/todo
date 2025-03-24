const getAuthHeaders = () => {
	const token = sessionStorage.getItem('nakamaToken');
    if (!token) {
        throw new Error('No token found');
    }
	return {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${token}`
	};
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
	const headers = {
		...getAuthHeaders(),
		...(options.headers || {})
	};
	
	return fetch(url, {
		...options,
		headers
	});
};