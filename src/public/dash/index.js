let main;
let data = {};

const writeToMain = (html) => {
    main.innerHTML = html;
};
const showLoading = (reason) => {
    writeToMain(`Please wait...<br>${reason}<br>`);
};

const getData = async (url, opts = {}) => {
    url = '/_api' + url;
    const res = await fetch(url, opts);
    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }
    return await res.json();
};

const deleteRedirect = async (slug) => {
    const res = await fetch('/_api/redirects/' + slug, {
        method: 'DELETE',
    });

    if (!res.ok) {
        throw new Error(`Failed to delete redirect ${slug}: ${res.status} ${res.statusText}`, { cause: res });
    }
};

const addRedirect = async (slug, url, permanent) => {
    const res = await fetch('/_api/redirects/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            slug,
            url,
            permanent,
        }),
    });

    if (!res.ok) {
        throw new Error(`Failed to add redirect ${slug}: ${res.status} ${res.statusText}`, { cause: res });
    }
};

const updateRedirect = async (slug, url, permanent) => {
    const res = await fetch('/_api/redirects/' + slug, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            url,
            permanent,
        }),
    });

    if (!res.ok) {
        throw new Error(`Failed to update redirect ${slug}: ${res.status} ${res.statusText}`, { cause: res });
    }
};

const handleDelete = async (e) => {
    const slug = e.target.dataset.slug;
    if (!slug) return;

    const shouldContinue = confirm('Are you sure you want to delete this redirect?');
    if (!shouldContinue) return;

    try {
        await deleteRedirect(slug);
        // await refreshData();
        location.reload();
    } catch (e) {
        alert(e.message);
    }

};

const handleAdd = async (e) => {
    e.preventDefault();
    const form = e.target;
    const slug = form.slug.value;
    const url = form.url.value;
    const permanent = form.permanent.checked;

    if (!slug || !url) {
        alert('Please fill out all fields');
        return;
    }

    let patch = false;
    if (data.redirects.find(r => r.key === slug)) {
        const shouldContinue = confirm('A redirect with that slug already exists. Would you like to overwrite it?');
        if (!shouldContinue) return;
        patch = true;
    }


    try {
        if (patch) {
            await updateRedirect(slug, url, permanent);
        } else {
            await addRedirect(slug, url, permanent);
        }
        // await refreshData();
        location.reload();
    } catch (e) {
        alert(e.message);
    }
};

const handleFillIn = (e) => {
    const slug = e.target.dataset.slug;
    if (!slug) return;
    const redirect = data.redirects.find(r => r.key === slug);
    if (!redirect) return;
    const form = document.getElementById('add-redirect');
    form.slug.value = redirect.key;
    form.url.value = redirect.url;
    form.permanent.checked = redirect.permanent;
};

const renderUI = () => {
    const { redirects, stats } = data;
    const html = `
        <h1>Redirects</h1>
        ${redirects.length === 0 ? 'No redirects yet' :
            `<table>
            <thead>
                <tr>
                    <th>Slug</th>
                    <th>URL</th>
                    <th>Permanent</th>
                    <th>Clicks</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${redirects.map(redirect => `
                <tr>
                    <td><a href="/_api/redirect/${redirect.key}">${redirect.key}</a></td>
                    <td><a href="${redirect.url}">${redirect.url}</a></td>
                    <td>${redirect.permanent ? 'Yes' : 'No'}</td>
                    <td>${stats[redirect.key] || 0}</td>
                    <td>
                        <button class="delete" data-slug="${redirect.key}">Delete</button>
                        <button class="edit" data-slug="${redirect.key}">Fill In</button>
                    </td>
                </tr>
                `).join('')}
            </tbody>
        </table>`}
        <h1>Add redirect</h1>
        <form id="add-redirect">
            <p>
                <label for="slug">Slug (use "_default" for the / route)</label>
                <input type="text" name="slug" id="slug" placeholder="Slug" required>
            </p>
            <p>
                <label for="url">URL</label>
                <input type="url" name="url" id="url" placeholder="URL" required>
            </p>
            <p>
                <label for="permanent">Permanent</label>
                <input type="checkbox" name="permanent" id="permanent">
            </p>
            <p>
                <button type="submit">Add</button>
            </p>
        </form>
    `;

    writeToMain(html);

    const deleteButtons = document.querySelectorAll('.delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', handleDelete);
    });

    const editButtons = document.querySelectorAll('.edit');
    editButtons.forEach(button => {
        button.addEventListener('click', handleFillIn);
    });

    const addRedirectForm = document.getElementById('add-redirect');
    addRedirectForm.addEventListener('submit', handleAdd);
};

window.addEventListener('load', async () => {
    try {
        main = document.getElementById('main');
        if (!main) return alert('No main element found. Dash cannot be loaded.');

        showLoading('Fetching redirects...');
        const redirects = await getData('/redirects');
        if (!redirects) return alert('No redirects found. Dash cannot be loaded.');

        data.redirects = redirects;

        showLoading('Fetching stats...');

        const stats = await getData('/stats');

        if (!stats) return alert('No stats found. Dash cannot be loaded.');

        data.stats = stats;

        showLoading('Rendering dash...');

        renderUI();

    } catch (e) {
        console.error(e)
        alert('There was an error while initializing the dash. Please try again later.');
        writeToMain('There was an error while initializing the dash. Please try again later.');
    }

});