import fs from "node:fs";
import path from "node:path";
import {object, sha, type Sha} from "./index.ts";


export interface LsTree {
    size: number;
    blobs: {
        mode: string;
        fileType: string
        name: string;
        sha: Sha;
    }[];
}

export function parseTreeFile(file: Buffer, options?: { skipHeader: boolean }): LsTree {
    const headerEndIndex = options?.skipHeader ? -1 : file.indexOf(0, 0);
    const size = 0;
    if (!options?.skipHeader) {
        const [type] = file.toString('ascii', 0, headerEndIndex).split(' ');
        if (type !== 'tree') throw new Error("not a tree file");
    }

    const blobs: LsTree['blobs'] = []

    let startOfBlob = headerEndIndex + 1;
    while (true) {
        const endOfName = file.indexOf(0, startOfBlob);
        if (endOfName === -1) break;
        const fileInfo = file.toString('ascii', startOfBlob, endOfName);
        const modeIndex = fileInfo.indexOf(' ')
        const mode = fileInfo.substring(0, modeIndex);
        const name = fileInfo.substring(modeIndex + 1);

        const startOfSha = endOfName + 1;
        const endOfSha = startOfSha + 20;
        const sha = file.toString('hex', startOfSha, endOfSha) as Sha;

        blobs.push({
            mode,
            fileType: modeToType[mode as unknown as keyof typeof modeToType],
            name,
            sha,
        });

        startOfBlob = endOfSha;
    }

    return { size: +size, blobs };
}




export function hashTree(tree: LsTree["blobs"]): string | Buffer {
    const contents: Buffer[] = []
    for (const blob of tree) {
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
export async function readTree(dirPath = '.'): Promise<Sha> {
    const contents: LsTree["blobs"] = [];

    const files = fs.readdirSync(dirPath, { withFileTypes: true })
        .filter((file) => file.name !== '.git')
        .sort((a, b) => a.name.localeCompare(b.name));

    for (const file of files) {
        const subPath = path.join(dirPath, file.name)
        if (file.isDirectory()) {
            const treeSha = await readTree(subPath);
            // console.debug(`recursive writeTree returned: ${subPath} @ ${sha}`);
            contents.push({
                mode: "40000",
                fileType: modeToType['40000'],
                name: file.name,
                sha: treeSha,
            });
        } else {
            const objectSha = await object.writeObjectContents(await object.hashObject(subPath));
            const mode = ((file) => {
                if (file.isSymbolicLink()) return "120000";
                if (file.isFile()) return "100644";
                return "100755";
            })(file)
            contents.push({
                mode,
                fileType: modeToType[mode]!,
                name: file.name,
                sha: objectSha,
            });
        }
    }

    const tree = hashTree(contents);
    return object.writeObjectContents(tree);
}

const modeToType = {
    40000: 'tree',
    120000: 'symlink',
    100644: 'file',
    100755: 'executable'
} as const;
