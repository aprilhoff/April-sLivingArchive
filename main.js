const API_URL =
    'https://api.are.na/v2/channels/april-s-living-archive';

const PER_PAGE = 100;

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




async function displayArchive() {

    const archive =
        document.getElementById('archive');

    const lastUpdated =
        document.getElementById('last-updated');


    archive.textContent = 'Loading…';


    const blocks =
        await getArenaContent();



    archive.innerHTML = '';


    if (blocks.length === 0) {

        archive.textContent =
            'Could not load the Are.na archive.';

        return;

    }


    const sorted =
        sortChronologically(blocks);

    const latestBlock =
        sorted[0];

    const latestDate =
        new Date(
            latestBlock.connected_at ||
            latestBlock.created_at
        );

    lastUpdated.textContent =
        latestDate.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });




    sorted.forEach(block => {

        if (
            block.class === 'Image' &&
            block.image
        ) {

            const figure =
                document.createElement('figure');

            const img =
                document.createElement('img');

            img.src =
                block.image.display?.url ||
                block.image.original?.url;

            img.alt =
                block.title || '';

            img.loading = 'lazy';

            figure.appendChild(img);


            if (block.title) {

                const caption =
                    document.createElement('figcaption');

                caption.textContent =
                    block.title;

                figure.appendChild(caption);

            }

            archive.appendChild(figure);

        }

    });

}



displayArchive();