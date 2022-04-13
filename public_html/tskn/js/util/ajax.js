const TIMEOUT = 3000;

/**
 * @param {string} method
 * @param {string} url
 * @param {FormData} [data]
 * @returns {Promise<Response>}
 */
const request = async (method, url, formData = null) => {
    if (method !== 'GET' && method !== 'POST') {
        throw new TypeError(`"${method}" method is not supported`);
    }
    if (!(formData instanceof FormData) && formData !== null) {
        throw new TypeError('Invalid type of data');
    }
    const abortController = new AbortController();
    setTimeout(() => {
        abortController.abort();
    }, TIMEOUT);
    const params = {
        signal: abortController.signal,
        method: method.toUpperCase(),
        //mode: 'cors',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    };
    if (method === 'POST') {
        params.body = formData;
    }
    try {
        const response = await fetch(url, params);
        return response;
    } catch (error) {
        throw new Error(`Request failed: ${error.toString()}`);
    }
};

const get = async (url) => {
    return request('GET', url);
};

const post = async (url, formData = null) => {
    return request('POST', url, formData);
};

export const Ajax = {
    get,
    post,
};
