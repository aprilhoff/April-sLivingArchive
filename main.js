const API_URL = 'https://api.are.na/v2/channels/april-s-living-archive';

const PER_PAGE = 100; // Are.na's max per request


// FETCH EVERY PAGE, THEN RETURN ALL BLOCKS
async function getArenaContent(onProgress) {

    const byId = new Map(); // dedupes blocks in case pages overlap
    let page = 1;
    let total = Infinity;
    let emptyPages = 0;

    while (byId.size < total) {

        const url = `${API_URL}?page=${page}&per=${PER_PAGE}`;

        console.log('Fetching:', url);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Are.na HTTP ${response.status}`);
        }

        const data = await response.json();

        // channel's total block count
        if (typeof data.length === 'number') {
            total = data.length;
        }

        const contents = data.contents || [];

        if (contents.length === 0) {
            // stop after an empty page
            break;
        }

        contents.forEach(block => byId.set(block.id, block));

        console.log(`Loaded ${byId.size} of ${total === Infinity ? '?' : total}`);

        if (onProgress) onProgress(byId.size, total);

        // NOTE: we do NOT stop on a short page, because Are.na can return
        // fewer than 100 items on a page and still have more pages after it.
        page++;

        // safety net so a bad response can never loop forever
        if (page > 200) break;

    }

    return Array.from(byId.values());

}


// SORT NEWEST → OLDEST (across ALL blocks)
function sortChronologically(blocks) {

    return blocks.slice().sort((a, b) => {

        const dateA = new Date(a.connected_at || a.created_at);
        const dateB = new Date(b.connected_at || b.created_at);

        return dateB - dateA;

    });

}


// CREATE IMAGE
function createImage(block) {

    const img = document.createElement('img');

    img.src =
        block.image?.display?.url ||
        block.image?.original?.url;

    img.alt = block.title || '';
    img.loading = 'lazy';

    return img;

}


// IMAGE / GIF
function renderImage(block, figure) {

    if (!block.image) return;

    figure.appendChild(createImage(block));

}


// TEXT
function renderText(block, figure) {

    const text = document.createElement('div');

    text.className = 'archive-text';
    text.innerHTML = block.content || '';

    figure.appendChild(text);

}


// VIDEO
function renderVideo(block, figure) {

    const video = document.createElement('video');

    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';

    if (block.image?.display?.url) {
        video.poster = block.image.display.url;
    }

    const source = document.createElement('source');

    source.src = block.embed?.url || block.url;

    video.appendChild(source);
    figure.appendChild(video);

}


// PDF / FILE
function renderFile(block, figure) {

    const link = document.createElement('a');

    // Are.na stores uploaded files under block.attachment
    const fileUrl =
        block.attachment?.url ||
        block.file?.url ||
        block.url ||
        `https://www.are.na/block/${block.id}`;

    link.href = fileUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    // Use Are.na's generated thumbnail if available
    if (block.image?.display?.url) {

        link.appendChild(createImage(block));

    } else {

        const label = document.createElement('div');

        label.className = 'archive-file';
        label.textContent =
            block.title ||
            block.attachment?.file_name ||
            'View file';

        link.appendChild(label);

    }

    figure.appendChild(link);

}


// LINK
function renderLink(block, figure) {

    // Are.na can store the original website URL in different fields
    const url =
        block.source?.url ||
        block.source?.source_url ||
        block.url ||
        block.source?.link;

    const link = document.createElement('a');

    // original website if found, otherwise the Are.na block
    link.href = url || `https://www.are.na/block/${block.id}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    // LINK PREVIEW IMAGE
    if (block.image?.display?.url) {
        link.appendChild(createImage(block));
    }

    // LINK TITLE
    const title = document.createElement('div');

    title.className = 'archive-link-title';
    title.textContent =
        block.title ||
        block.source?.title ||
        url ||
        'View link';

    link.appendChild(title);
    figure.appendChild(link);

}


// FALLBACK
function renderFallback(block, figure) {

    const link = document.createElement('a');

    link.href = block.url || `https://www.are.na/block/${block.id}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = block.title || 'View block on Are.na';

    figure.appendChild(link);

}


// DETERMINE WHAT TYPE OF BLOCK IT IS
function renderBlock(block) {

    const figure = document.createElement('figure');

    if (block.class === 'Image' && block.image) {

        renderImage(block, figure);

    } else if (block.class === 'Text') {

        renderText(block, figure);

    } else if (block.class === 'Media' && block.embed) {

        renderVideo(block, figure);

    } else if (
        block.class === 'Attachment' ||
        block.attachment ||
        block.file
    ) {

        renderFile(block, figure);

    } else if (block.class === 'Link') {

        renderLink(block, figure);

    } else {

        renderFallback(block, figure);

    }

    // TITLE / CAPTION
    if (block.title && block.class !== 'Text') {

        const caption = document.createElement('figcaption');

        caption.textContent = block.title;
        figure.appendChild(caption);

    }

    return figure;

}


// DISPLAY ARCHIVE
async function displayArchive() {

    const archive = document.getElementById('archive');
    const lastUpdated = document.getElementById('last-updated');

    archive.textContent = 'Loading…';

    let blocks = [];

    try {

        blocks = await getArenaContent((loaded, total) => {
            archive.textContent =
                total === Infinity
                    ? `Loading… ${loaded}`
                    : `Loading… ${loaded} / ${total}`;
        });

    } catch (error) {

        console.error('Are.na fetch failed:', error);

    }

    archive.innerHTML = '';

    if (blocks.length === 0) {
        archive.textContent = 'Could not load the Are.na archive.';
        return;
    }

    // SORT EVERYTHING ONCE, NEWEST → OLDEST
    const sorted = sortChronologically(blocks);

    // LAST UPDATED
    const latest = new Date(
        sorted[0].connected_at || sorted[0].created_at
    );

    lastUpdated.textContent = latest.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    // RENDER EVERY BLOCK
    const fragment = document.createDocumentFragment();

    sorted.forEach(block => {
        fragment.appendChild(renderBlock(block));
    });

    archive.appendChild(fragment);

}


// START
displayArchive();