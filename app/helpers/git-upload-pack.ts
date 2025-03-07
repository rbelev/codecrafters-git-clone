export async function getRepoPack(gitUrl: string): Promise<ArrayBuffer> {
    const sha = await getHeadRef(gitUrl);
    const pack = await getWantedShaPack(gitUrl, sha);
    return pack;
}


export async function getWantedShaPack(gitUrl: string, sha: string): Promise<ArrayBuffer> {
    let wantCommand = Buffer.from(`want ${sha}\n`, 'ascii');
    const lengthPrefix = Buffer.from((wantCommand.byteLength + 4).toString(16).padStart(4, '0'));
    const wantLine = Buffer.concat([lengthPrefix, wantCommand]);

    const shallow = Buffer.from('deepen 1\n', 'ascii');
    const shallowLine = Buffer.concat([Buffer.from((shallow.byteLength + 4).toString(16).padStart(4, '0')), shallow]);

    const wantRequestBody = Buffer.concat([
        wantLine,
        shallowLine,
        Buffer.from('0000'),
        Buffer.from('0009done\n'),
    ]);
    // const wantRequestBody = `0032want ${sha}\n00000009done\n`;

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
    return pack;
    // return new Uint8Array(pack);
}

export async function getHeadRef(gitUrl: string): Promise<string> {
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
