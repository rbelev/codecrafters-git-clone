import fs from "node:fs/promises";
import { promisify } from "node:util";
import { deflateSync, unzip } from "node:zlib";
import path from "node:path";

import { sha, type Sha } from "../helpers/index.ts";

export type Object = {
    type: string;
    size: number;
    content: string | Buffer;
};


export async function loadObjectFile(sha: Sha): Promise<Buffer> {
    const objectPath = objectPathFromSha(sha);
    const zlibFile = await fs.readFile(objectPath);
    const file = await promisify(unzip)(zlibFile);
    return file;
}


export function objectPathFromSha(sha: Sha): string {
    return path.join('.git', 'objects', sha.slice(0, 2), sha.slice(2));
}


/**
 * TODO: Bad name, loading file and formatting the blob.
 * @param fileName
 */
export async function hashObject(fileName: string | Buffer): Promise<string> {
    const contents = await fs.readFile(fileName, { encoding: 'ascii' });
    const sizeBytes = Buffer.byteLength(contents);

    const object = `blob ${sizeBytes}\0${contents}`;
    return object;
    // return writeObjectContents(content);
}


export async function writeObjectContents(content: string | Buffer): Promise<Sha> {
    const objectSha = sha.createSha(content);
    const writePath = objectPathFromSha(objectSha);

    try {
        const dir = path.dirname(writePath);
        await fs.mkdir(dir);
    } catch (error: unknown) {
        if (!(error instanceof Error)) throw error;
        if (!('code' in error) || error.code !== 'EEXIST') throw error;
    }

    const zlibContents = deflateSync(content);
    await fs.writeFile(writePath, zlibContents);
    return objectSha;
}


export function splitBlob(file: Buffer): Object {
    const headerEnd = file.indexOf(0);
    const [type, strSize] = file.toString('ascii', 0, headerEnd).split(' ');
    const size = Number.parseInt(strSize, 10);

    const content = file.subarray(headerEnd + 1);

    return { type, size, content };
}
