import george, { refreshData } from './data.js';
import { showFatal } from './ui.js';

window.addEventListener('load', async () => {
    try {
        george.main = document.getElementById('main');
        if (!george.main) return alert('No main element found. Dash cannot be loaded.');

        refreshData();

    } catch (e) {
        console.error(e)
        showFatal('There was an error while initializing the dash. Please try again later.');
    }

});