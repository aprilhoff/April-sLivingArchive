const API_URL =
    'https://api.are.na/v2/channels/april-s-living-archive';




// GET ARE.NA CONTENT
async function getArenaContent() {

    const url = `${API_URL}?page=1&per=${PER_PAGE}`;

    console.log('Fetching:', url);

    try {

        const response = await fetch(url);

        console.log('Are.na response:', response.status);

        if (!response.ok) {
            throw new Error(`Are.na HTTP ${response.status}`);
        }

        const data = await response.json();

        console.log('Are.na data:', data);

        return data.contents || [];

    } catch (error) {

        console.error('Are.na fetch failed:', error);

        return [];

    }
}


// SORT NEWEST → OLDEST
function sortChronologically(blocks) {

    return blocks.slice().sort((a, b) => {

        const dateA = new Date(
            a.connected_at || a.created_at
        );

        const dateB = new Date(
            b.connected_at || b.created_at
        );

        return dateB - dateA;

    });

}


// CREATE IMAGE
function createImage(block) {

    const img =
        document.createElement('img');

    img.src =
        block.image?.display?.url ||
        block.image?.original?.url;

    img.alt =
        block.title || '';

    img.loading =
        'lazy';

    return img;

}


// IMAGE / GIF
function renderImage(block, figure) {

    if (!block.image) return;

    const img =
        createImage(block);

    figure.appendChild(img);

}


// TEXT
function renderText(block, figure) {

    const text =
        document.createElement('div');

    text.className =
        'archive-text';

    text.innerHTML =
        block.content || '';

    figure.appendChild(text);

}


// VIDEO
function renderVideo(block, figure) {

    const video =
        document.createElement('video');

    video.controls =
        true;

    video.playsInline =
        true;

    video.preload =
        'metadata';


    if (block.image?.display?.url) {

        video.poster =
            block.image.display.url;

    }


    const source =
        document.createElement('source');


    source.src =
        block.embed?.url ||
        block.url;


    video.appendChild(source);

    figure.appendChild(video);

}


// PDF / FILE
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

        const img = createImage(block);
        link.appendChild(img);

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

    /*
        Are.na can store the original
        website URL in different fields.

        Check each possible location.
    */

    const url =
        block.source?.url ||
        block.source?.source_url ||
        block.url ||
        block.source?.link;


    const link =
        document.createElement('a');


    /*
        If we found the original website,
        use it.

        Otherwise send the user to
        the Are.na block.
    */

    if (url) {

        link.href =
            url;

    }

    else {

        link.href =
            `https://www.are.na/block/${block.id}`;

    }


    link.target =
        '_blank';

    link.rel =
        'noopener noreferrer';


    // LINK PREVIEW IMAGE

    if (block.image?.display?.url) {

        const img =
            createImage(block);

        link.appendChild(img);

    }


    // LINK TITLE

    const title =
        document.createElement('div');

    title.className =
        'archive-link-title';


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

    const link =
        document.createElement('a');


    link.href =
        block.url ||
        `https://www.are.na/block/${block.id}`;


    link.target =
        '_blank';

    link.rel =
        'noopener noreferrer';


    link.textContent =
        block.title ||
        'View block on Are.na';


    figure.appendChild(link);

}


// DETERMINE WHAT TYPE OF BLOCK IT IS
function renderBlock(block) {

    const figure =
        document.createElement('figure');


    /*
        IMAGE / GIF
    */

    if (
        block.class === 'Image' &&
        block.image
    ) {

        renderImage(
            block,
            figure
        );

    }


    /*
        TEXT
    */

    else if (
        block.class === 'Text'
    ) {

        renderText(
            block,
            figure
        );

    }


    /*
        VIDEO
    */

    else if (
        block.class === 'Media' &&
        block.embed
    ) {

        renderVideo(
            block,
            figure
        );

    }


    /*
        PDF / FILE
    */

    else if (
    block.class === 'Attachment' ||
    block.attachment ||
    block.file
) {
    renderFile(block, figure);
}


    /*
        LINK
    */

    else if (
        block.class === 'Link'
    ) {

        renderLink(
            block,
            figure
        );

    }


    /*
        ANYTHING ELSE
    */

    else {

        renderFallback(
            block,
            figure
        );

    }


    /*
        TITLE / CAPTION
    */

    if (
        block.title &&
        block.class !== 'Text'
    ) {

        const caption =
            document.createElement('figcaption');

        caption.textContent =
            block.title;

        figure.appendChild(
            caption
        );

    }


    return figure;

}


// DISPLAY ARCHIVE
async function displayArchive() {

    const archive =
        document.getElementById('archive');


    const lastUpdated =
        document.getElementById(
            'last-updated'
        );


    archive.textContent =
        'Loading…';


    const blocks =
        await getArenaContent();


    archive.innerHTML =
        '';


    if (
        blocks.length === 0
    ) {

        archive.textContent =
            'Could not load the Are.na archive.';

        return;

    }


    /*
        SORT
        NEWEST → OLDEST
    */

    const sorted =
        sortChronologically(
            blocks
        );


    /*
        LAST UPDATED
    */

    const latestBlock =
        sorted[0];


    const latestDate =
        new Date(
            latestBlock.connected_at ||
            latestBlock.created_at
        );


    lastUpdated.textContent =
        latestDate.toLocaleString(
            'en-GB',
            {

                day: '2-digit',

                month: '2-digit',

                year: 'numeric',

                hour: '2-digit',

                minute: '2-digit',

                second: '2-digit',

                hour12: false

            }
        );


    /*
        RENDER EVERY BLOCK
    */

    sorted.forEach(
        block => {

            const element =
                renderBlock(
                    block
                );

            archive.appendChild(
                element
            );

        }
    );

}


// START
displayArchive();