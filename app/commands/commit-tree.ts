import { commit, object, type CommitTreeParams, type Sha } from '../helpers/index.ts';

export async function commitTree(args:  CommitTreeParams): Promise<Sha> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const [_cmd, treeSha, _p, parentSha, _m, message] = args;
    const tree = commit.formatCommitTree(args);

    return await object.writeObjectContents(tree);
}
