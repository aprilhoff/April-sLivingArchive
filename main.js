const CHANNEL_SLUG = 'april-s-living-archive';

// Are.na's real API is v2, and the channel endpoint itself returns
// the "contents" array — there's no separate /contents route.
const API_URL = `https://api.are.na/v2/channels/${CHANNEL_SLUG}`;
const PER_PAGE = 100; // max allowed per page

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

            // data.contents holds the blocks (data.data was the wrong key,
            // and only existed for the nonexistent /contents endpoint anyway)
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
    // connected_at = when the block was added to this channel
    return blocks.slice().sort((a, b) => {
        const dateB = new Date(a.connected_at || a.created_at);
        const dateA = new Date(b.connected_at || b.created_at);
        return dateA - dateB;
    });
}

async function displayArchive() {
    const archive = document.getElementById('archive');
    archive.innerHTML = 'Loading…';

    const blocks = await getArenaContent();
    const sorted = sortChronologically(blocks);

    archive.innerHTML = '';

    if (sorted.length === 0) {
        archive.textContent = 'No blocks found (or the channel could not be reached).';
        return;
    }

    sorted.forEach(block => {
        // Only display image blocks
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