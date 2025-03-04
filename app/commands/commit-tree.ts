import { trees, object, type Sha } from '../helpers/index.ts';

export async function commitTree(args: string[]): Promise<Sha> {
    const [_cmd, treeSha, _p, parentSha, _m, message] = args;
    const tree = trees.formatCommitTree({
        treeSha,
        parents: parentSha,
        message,
    });

    return await object.writeObjectContents(tree);
}
