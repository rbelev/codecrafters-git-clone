import { commit, object, type Sha } from '../helpers/index.ts';

export async function commitTree(args: string[]): Promise<Sha> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_cmd, treeSha, _p, parentSha, _m, message] = args;
    const tree = commit.formatCommitTree({
        treeSha,
        parents: parentSha,
        message,
    });

    return await object.writeObjectContents(tree);
}
