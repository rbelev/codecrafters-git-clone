// import * as fs from 'node:fs/promises';

import { object, type Sha } from '../helpers/index.ts';

export async function hashObject(fileName: string): Promise<Sha> {
    // const file = await fs.readFile(fileName, { encoding: 'ascii' });
    const something = await object.hashObject(fileName);
    return await object.writeObjectContents(something);
}