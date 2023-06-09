const defaultHeaders = {
    'Content-Type': 'application/json',
};

const getData = async (url, opts = {}) => {
    url = '/_api' + url;
    opts.headers = {
        ...defaultHeaders, ...(opts.headers || {})
    }
    if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
    const res = await fetch(url, opts);
    let json;
    try {
        json = await res.json();
    } catch (e) {
        throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText} ${e}`);
    }

    if (!res.ok)
        throw new Error(`Failed to fetch ${url}: ${res.status} ${json.msg || res.statusText}`);

    if (!json.ok)
        throw new Error(`Failed to fetch ${url}: ${json.msg || 'Unknown error'}`);
    return json.data;
};

const deleteRedirect = (slug) => getData('/redirects', {
    method: 'DELETE',
    body: {
        slug,
    },
});

const addRedirect = (slug, url, permanent, allowRegex) => getData('/redirects', {
    method: 'POST',
    body: {
        slug,
        url,
        permanent,
        allowRegex,
    },
});

const updateRedirect = (slug, url, permanent, allowRegex) => getData('/redirects', {
    method: 'PATCH',
    body: {
        url,
        permanent,
        allowRegex,
        slug,
    },
});

export {
    getData,
    addRedirect,
    deleteRedirect,
    updateRedirect,
}