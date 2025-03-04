import { object, trees, type LsTree, type Sha } from '../helpers/index.ts';

export async function readLsTree(args: string[]): Promise<LsTree> {
    const [_ls, _nameOnly, treeSha] = args;
    const file = await object.loadObjectFile(treeSha as Sha);

    return trees.parseTreeFile(file);
}
