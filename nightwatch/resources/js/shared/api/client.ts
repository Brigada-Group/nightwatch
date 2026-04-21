import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = document.querySelector<HTMLMetaElement>(
        'meta[name="csrf-token"]',
    );

    if (token) {
        config.headers['X-CSRF-TOKEN'] = token.content;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        if (status === 401) {
            window.location.href = '/login';
        }

        if (status === 419) {
            window.location.reload();
        }

        return Promise.reject(error);
    },
);

export { api };
