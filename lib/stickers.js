const { v2: cloudinary } = require('cloudinary');

const FOLDERS = {
    aibe_stickers: 'aibe stickers',
    mochamilk: 'mochamilk',
    aibesopretty: 'aibesopretty'
};

let stickersCache = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

function configureCloudinary() {
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;

    if (!cloud_name || !api_key || !api_secret) {
        throw new Error('Thiếu biến môi trường Cloudinary');
    }

    cloudinary.config({ cloud_name, api_key, api_secret });
}

function mapImage(resource, folderKey) {
    const id = resource.public_id;
    return {
        id,
        folder: folderKey,
        url: cloudinary.url(id, {
            width: 200,
            height: 200,
            crop: 'fill',
            gravity: 'auto',
            quality: 'auto',
            format: 'webp',
            secure: true
        }),
        urlIcon: cloudinary.url(id, {
            width: 64,
            height: 64,
            crop: 'fill',
            gravity: 'auto',
            quality: 'auto',
            format: 'webp',
            secure: true
        }),
        urlFrame: cloudinary.url(id, {
            width: 500,
            height: 500,
            crop: 'fill',
            gravity: 'auto',
            quality: 'auto',
            format: 'webp',
            secure: true
        }),
        urlFull: cloudinary.url(id, {
            width: 600,
            quality: 'auto',
            format: 'webp',
            secure: true
        })
    };
}

async function fetchFolder(folderKey, folderPath) {
    const resources = [];
    let nextCursor;

    do {
        let query = cloudinary.search
            .expression(`folder:"${folderPath}" AND resource_type:image`)
            .sort_by('created_at', 'desc')
            .max_results(500);

        if (nextCursor) {
            query = query.next_cursor(nextCursor);
        }

        const result = await query.execute();
        resources.push(...result.resources);
        nextCursor = result.next_cursor;
    } while (nextCursor);

    return resources.map(r => mapImage(r, folderKey));
}

async function getStickers(refresh = false) {
    configureCloudinary();

    if (refresh) {
        stickersCache = null;
        cacheTime = 0;
    }

    if (stickersCache && Date.now() - cacheTime < CACHE_TTL) {
        return stickersCache;
    }

    const [aibeStickers, mochamilk, aibesopretty] = await Promise.all([
        fetchFolder('aibe_stickers', FOLDERS.aibe_stickers),
        fetchFolder('mochamilk', FOLDERS.mochamilk),
        fetchFolder('aibesopretty', FOLDERS.aibesopretty)
    ]);

    const images = [...aibeStickers, ...mochamilk, ...aibesopretty];

    stickersCache = {
        success: true,
        count: images.length,
        images,
        categories: {
            aibe_stickers: aibeStickers,
            mochamilk,
            aibesopretty
        }
    };
    cacheTime = Date.now();
    return stickersCache;
}

module.exports = { getStickers };
