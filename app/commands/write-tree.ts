import { object, trees, type Sha } from "../helpers/index.ts";

export async function writeTree(dirPath: string = '.'): Promise<Sha> {
    return await trees.readTree(dirPath);
}


