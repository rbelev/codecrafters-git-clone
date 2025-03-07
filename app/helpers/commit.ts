export type CommitTreeParams = Parameters<typeof formatCommitTree>[0];


export function formatCommitTree(args: { treeSha: string; parents: string | string[], message: string }): string {
    const contents = `\
tree ${args.treeSha}
parent ${args.parents}
author My Name <my_name@gmail.com> 946684800 -0800
committer My Name <my_name@gmail.com> 946684800 -0800

${args.message}
`;
    const size = Buffer.byteLength(contents);
    const fullBuffer = `commit ${size}\0${contents}`;
    return fullBuffer;
    // return writeObjectContents(fullBuffer);
}

export function extractTreeShaFromCommit(commitBlob: Buffer): string {
    const match = commitBlob.toString('utf8').match(/tree (?<sha>[0-9a-z]{40})\n/);
    if (!match?.groups?.sha) throw new Error('no tree sha in commit');

    return match.groups.sha;
}