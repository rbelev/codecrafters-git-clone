import { trees, type Sha } from "../helpers/index.ts";

export async function writeTree(dirPath = '.'): Promise<Sha> {
    return await trees.readTree(dirPath);
}


