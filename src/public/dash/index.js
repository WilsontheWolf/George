import george, { refreshData } from './data.js';
import { showFatal } from './ui.js';

try {
    george.main = document.getElementById('main');
    if (!george.main) { alert('No main element found. Dash cannot be loaded.'); }
    else {
        refreshData();
    }

} catch (e) {
    console.error(e)
    showFatal('There was an error while initializing the dash. Please try again later.');
}
