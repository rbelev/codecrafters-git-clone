import { object, type Sha } from'../helpers/index.ts';

export async function catFile(sha: Sha): Promise<Buffer | string> {
    const file = await object.loadObjectFile(sha as Sha);

    const { content } = object.splitBlob(file);
    return content;
}
