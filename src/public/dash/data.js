import { getData } from "./requests.js";
import { renderUI, showFatal, showLoading, writeToMain } from "./ui.js";

const george = {
    data: {},
};

const refreshData = async () => {
    try {
        showLoading('Fetching redirects...');
        const redirects = await getData('/redirects');
        if (!redirects) {
            console.log('No redirects found.', redirects);
            showFatal('No redirects found. Dash cannot be loaded.');
            return;
        }

        george.data.redirects = redirects;

        showLoading('Fetching stats...');

        const stats = await getData('/stats');

        if (!stats) {
            console.log('No stats found.', stats);
            showFatal('No stats found. Dash cannot be loaded.');
            return;
        }

        george.data.stats = stats;

        showLoading('Rendering dash...');

        renderUI();
    } catch(e) {
        console.error(e);
        showFatal('There was an error while initializing the dash. Please try again later.');
    }
}


export default george;
export {
    refreshData,
}