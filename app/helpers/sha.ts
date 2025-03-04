import crypto from "node:crypto";

export type Sha = string & { _brand: 'sha' };


export function createSha(contents: string | Buffer): Sha {
    const sha = crypto.createHash('sha1').update(contents).digest('hex');
    return sha as Sha
}


export function binarySha(sha: Sha): string {
    return Buffer.from(sha, 'hex').toString('binary');
}

