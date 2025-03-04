import fs from "node:fs";
import path from "node:path";
import {object, sha, type Sha} from "./index.ts";

export type LsTree = {
    size: number;
    blobs: {
        mode: string;
        name: string;
        sha: Sha;
    }[];
}

export function parseTreeFile(file: Buffer): LsTree {
    const headerEndIndex = file.indexOf(0, 0);
    const [type, size] = file.toString('ascii', 0, headerEndIndex).split(' ');
    if (type !== 'tree') throw new Error("not a tree file");

    const blobs: LsTree['blobs'] = []

    let startOfBlob = headerEndIndex + 1;
    while (true) {
        let endOfName = file.indexOf(0, startOfBlob);
        if (endOfName === -1) break;
        const fileInfo = file.toString('ascii', startOfBlob, endOfName);
        const modeIndex = fileInfo.indexOf(' ')
        const mode = fileInfo.substring(0, modeIndex);
        const name = fileInfo.substring(modeIndex + 1);

        const startOfSha = endOfName + 1;
        const endOfSha = startOfSha + 20;
        const sha = file.toString('hex', startOfSha, endOfSha + 1) as Sha;

        blobs.push({ mode, name, sha })

        startOfBlob = endOfSha;
    }

    return { size: +size, blobs };
}


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


export function hashTree(tree: LsTree["blobs"]): string | Buffer {
    const contents: Buffer[] = []
    for (let blob of tree) {
        contents.push(Buffer.from(`${blob.mode} ${blob.name}\0`, 'ascii'));
        contents.push(Buffer.from(sha.binarySha(blob.sha), 'binary'));
    }

    const size = contents.reduce((length, buffer) => {
        return length + buffer.byteLength;
    }, 0);
    contents.unshift(Buffer.from(`tree ${size}\0`, 'ascii'));

    const fullBuffer = Buffer.concat(contents);
    return fullBuffer;
}


/**
 * TODO: Poorly named, as it is writing new blobs for all files & subDirs encountered.
 * @param dirPath
 */
export async function readTree(dirPath: string = '.'): Promise<Sha> {
    const contents: LsTree["blobs"] = [];

    const files = fs.readdirSync(dirPath, { withFileTypes: true })
        .filter((file) => file.name !== '.git')
        .sort((a, b) => a.name.localeCompare(b.name));

    for (const file of files) {
        const subPath = path.join(dirPath, file.name)
        if (file.isDirectory()) {
            let treeSha = await readTree(subPath);
            // console.debug(`recursive writeTree returned: ${subPath} @ ${sha}`);
            contents.push({ mode: "40000", name: file.name, sha: treeSha });
        } else {
            let objectSha = await object.writeObjectContents(await object.hashObject(subPath));
            const mode = ((file) => {
                if (file.isSymbolicLink()) return "120000";
                if (file.isFile()) return "100644";
                return "100755";
            })(file)
            contents.push({ mode, name: file.name, sha: objectSha });
        }
    }

    const tree = hashTree(contents);
    return object.writeObjectContents(tree);
}
