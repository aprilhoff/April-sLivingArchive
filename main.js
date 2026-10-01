// COLOR CHANGE
const colors = [
    '#FF0055',
    '#FF0099',
    '#FF00FF',
    '#CC00FF',
    '#6600FF',
    '#3300FF',
    '#0055FF',
    '#00AAFF',
    '#00FFFF',
    '#00FFCC',
    '#00FF66',
    '#00FF00',
    '#66FF00',
    '#CCFF00',
    '#FFFF00',
    '#FFCC00',
    '#FF6600',
    '#FF3300',
    '#FF0033',
    '#FF0088'
];

const randomColor = colors[Math.floor(Math.random() * colors.length)];

document.body.style.color = randomColor;


document.querySelectorAll('a').forEach(link => {
    link.style.color = randomColor;
});
document.body.style.color = randomColor;

// CONNECTING ARE.NA
const CHANNEL_SLUG = 'april-s-living-archive';
const API_URL = `https://api.are.na/v2/channels/${CHANNEL_SLUG}`;
const PER_PAGE = 100;

async function getArenaContent() {
    let allBlocks = [];
    let page = 1;
    let totalPages = 1;

    try {
        do {
            const response = await fetch(`${API_URL}?page=${page}&per=${PER_PAGE}`);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            allBlocks = allBlocks.concat(data.contents || []);

            totalPages = data.total_pages || 1;
            page++;
        } while (page <= totalPages);

        return allBlocks;
    } catch (error) {
        console.error('Could not fetch Are.na data:', error);
        return [];
    }
}

function sortChronologically(blocks) {
    return blocks.slice().sort((a, b) => {
        const dateA = new Date(a.connected_at);
        const dateB = new Date(b.connected_at);
        return dateB - dateA;
    });
}
async function displayArchive() {
    const archive = document.getElementById('archive');
    const lastUpdated = document.getElementById('last-updated');


    const blocks = await getArenaContent();

    if (blocks.length === 0) {
        archive.textContent = 'No blocks found (or the channel could not be reached).';
        return;
    }

    const sorted = sortChronologically(blocks);

    const latestBlock = sorted[0];
    const latestDate = new Date(latestBlock.connected_at);

    lastUpdated.textContent = latestDate.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    sorted.forEach(block => {
        if (block.class === 'Image' && block.image) {
            const figure = document.createElement('figure');

            const img = document.createElement('img');
            img.src = block.image.display?.url || block.image.original.url;
            img.alt = block.title || '';
            img.loading = 'lazy';

            figure.appendChild(img);

            if (block.title) {
                const caption = document.createElement('figcaption');
                caption.textContent = block.title;
                figure.appendChild(caption);
            }

            archive.appendChild(figure);
        }
    });
}

displayArchive();