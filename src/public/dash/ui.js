import george, { refreshData } from "./data.js";
import { addRedirect, deleteRedirect, updateRedirect } from "./requests.js";

const writeToMain = (html) => {
    if (george.main)
        george.main.innerHTML = html;
    else
        console.warn('Asked to write to main, but no main element found.');
};
const showLoading = (reason) => {
    writeToMain(`Please wait...<br>${reason}<br>`);
};
const showFatal = (reason) => {
    writeToMain(`Fatal error: ${reason}<br>Check the console for more info.<br><a href="javascript:location.reload()">Reload</button><br>`);
    alert(`Fatal error: ${reason}`);
};


const handleDelete = async (e) => {
    const slug = e.target.dataset.slug;
    if (!slug) return;

    const shouldContinue = confirm('Are you sure you want to delete this redirect?');
    if (!shouldContinue) return;

    try {
        await deleteRedirect(slug);
        await refreshData();
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
    const allowRegex = form.allowRegex.checked;

    if (!slug || !url) {
        alert('Please fill out all fields');
        return;
    }

    let patch = false;
    if (george.data.redirects.find(r => r.key === slug)) {
        const shouldContinue = confirm('A redirect with that slug already exists. Would you like to overwrite it?');
        if (!shouldContinue) return;
        patch = true;
    }


    try {
        if (patch) {
            await updateRedirect(slug, url, permanent, allowRegex);
        } else {
            await addRedirect(slug, url, permanent, allowRegex);
        }
        await refreshData();
    } catch (e) {
        alert(e.message);
    }
};

const handleFillIn = (e) => {
    const slug = e.target.dataset.slug;
    if (!slug) return;
    const redirect = george.data.redirects.find(r => r.key === slug);
    if (!redirect) return;
    const form = document.getElementById('add-redirect');
    form.slug.value = redirect.key;
    form.url.value = redirect.url;
    form.permanent.checked = redirect.permanent;
    form.allowRegex.checked = redirect.allowRegex;
};

const renderUI = () => {
    const { redirects, stats } = george.data;
    const html = `
        <h1>Redirects</h1>
        ${redirects.length === 0 ? 'No redirects yet' :
            `<table>
            <thead>
                <tr>
                    <th>Slug</th>
                    <th>URL</th>
                    <th>Permanent</th>
                    <th>Is Regex</th>
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
                    <td>${redirect.allowRegex ? 'Yes' : 'No'}</td>
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
                <label for="allowRegex">Allow Regex</label>
                <input type="checkbox" name="allowRegex" id="allowRegex">
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

export {
    writeToMain,
    showLoading,
    renderUI,
    showFatal,
}