const baseUrl = 'http://localhost'

const api = axios.create({
    baseURL: `${baseUrl}:3000/`,
    headers: {
        'Content-Type': 'application/json',
    },
});

function getAxiosInstance() {
    return api;
}