import { object, trees, type LsTree, type Sha } from '../helpers/index.ts';

export async function readLsTree(treeSha: string): Promise<LsTree> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const [_ls, _nameOnly, treeSha] = args;
    const file = await object.loadObjectFile(treeSha as Sha);

    return trees.parseTreeFile(file);
}
