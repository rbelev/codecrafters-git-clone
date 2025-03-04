import { promisify } from "node:util";
import { unzip } from "node:zlib";

export async function clone(args: string[]): Promise<void> {
    const [_clone, target, dir] = args;

    const sha = await getHeadRef(target);
    console.log(`head sha: ${sha}`);
    const pack = await getWantedShaPack(target, sha);
    breakdownPack(pack);
    // console.log(`blob: ${blob}`);
}

function breakdownPack(pack: ArrayBuffer): string {
    const header = Buffer.from(pack, 0, 12).toString('utf8');
    console.log(`header: ${header}`);
    return header;
}

async function getWantedShaPack(gitUrl: string, sha: string): Promise<ArrayBuffer> {
    const wantRequestBody = `0032want ${sha}\n00000009done\n`;

    const repo = await fetch(`${gitUrl}/git-upload-pack`, {
        method: 'post',
        body: wantRequestBody,
        headers: {
            // "Accept": "application/x-git-upload-pack-result",
            "accept-encoding": "gzip,deflate",
            "Content-Type": "application/x-git-upload-pack-request",
            // "Git-Protocol": "version=2",
            // "Range": "bytes=0-",
        },
    });
    if (!repo.ok) {
        const errorBody = await repo.text();
        throw new Error(`want fetch failed: ${repo.status} ${repo.statusText}: ${errorBody}`);
    }

    const pack = await repo.arrayBuffer();
    // const text = await promisify(unzip)(repoText);
    // console.log(pack.toString());

    return pack;
}

async function getHeadRef(gitUrl: string): Promise<string> {
    const pack = await fetch(`${gitUrl}/info/refs?service=git-upload-pack`, {
        headers: {
            Accept: 'application/x-git-upload-pack-advertisement',
        },
    });
    if (!pack.ok) {
        const errorBody = await pack.text();
        throw new Error(`fetch failed: ${errorBody}`);
    }
    const blob = await pack.text();
    // console.log(`blob: ${blob}`);
    const shaRegex = blob.match(/(?<sha>[0-9a-z]{40}) HEAD/);
    if (!shaRegex?.groups?.sha) {
        throw new Error('failed to find head');
    }

    return shaRegex.groups.sha;
}

// NOTE: This is the deprecated dumb protocol.
//   const repo = await fetch(`${target}.git/objects/${sha.slice(0, 2)}/${sha.slice(2)}`)
