import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { unzipSync, deflateSync } from "node:zlib";

const args = process.argv.slice(2);
const command = args[0];

enum Commands {
    Init = "init",
    CatFile = "cat-file",
    HashObject = "hash-object",
    LsTree = "ls-tree",
    WriteTree = "write-tree",
}

switch (command) {
    case Commands.Init:
        init();
        break;
    case Commands.CatFile:
        catFile(args);
        break;
    case Commands.HashObject:
        const [, , fileName] = args;
        hashObject(fileName);
        break;
    case Commands.LsTree:
       const tree = readLsTree(args);
        tree.blobs.forEach((blob) => {
            // console.log(`${blob.mode} tree ${blob.sha} ${blob.name}`);
            console.log(`${blob.name}`);
        });
       break;
   case Commands.WriteTree:
       writeTree();
       break;
    default:
        throw new Error(`Unknown command ${command}`);
}

type Sha = string & { _brand: 'sha' }
type LsTree = {
    size: number;
    blobs: {
        mode: string;
        name: string;
        sha: Sha;
    }[];
}


function writeTree(dirPath: string = '.'): Sha {
    const contents: LsTree["blobs"] = [];

    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const file of files) {
        const subPath = path.join(dirPath, file.name)
        if (file.isDirectory()) {
            let sha = writeTree(subPath);
            contents.push({mode: "mode", name: file.name, sha });
        } else {
            let sha = hashObject(subPath);
            contents.push({ mode: "mode", name: file.name, sha });
        }
    }

    return hashTree({ size: 0, blobs: contents })
}


function readLsTree(args: string[]): LsTree {
    const [_ls, _nameOnly, treeSha] = args;
    const treePath = objectPathFromSha(treeSha as Sha);
    const file = unzipSync(fs.readFileSync(treePath));
    return parseTreeFile(file);
}


function parseTreeFile(file: Buffer): LsTree {
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


function hashObject(fileName: string): Sha {
    const file = fs.readFileSync(fileName).toString();
    const sizeBytes = Buffer.byteLength(file);

    const content = `blob ${sizeBytes}\0${file}`;
    return writeObjectContents(content);
}


function writeObjectContents(content: string): Sha {
    const sha = createSha(content);
    const writePath = objectPathFromSha(sha);
    const dir = path.dirname(writePath);
    try {
        fs.mkdirSync(dir);
    } catch (error: unknown) {
        if (!(error instanceof Error)) throw error;
        console.log(`${error} ${error.name} ${JSON.stringify({ ...error })}`);
        if (error.name !== 'EEXIST') throw error;
    }

    const zlibContents = deflateSync(content);
    fs.writeFileSync(writePath, zlibContents);
    return sha;
}


function hashTree(tree: LsTree): Sha {
    const contents = [`tree ${tree.size}\0`]
    for (let blob of tree.blobs) {
        const blobTreeLine = `${blob.mode} ${blob.name}\0${binarySha(blob.sha)}`;
        contents.push(blobTreeLine);
    }
    const content = contents.join('');
    return writeObjectContents(content)
}


function createSha(contents: string): Sha {
    const sha = crypto.createHash('sha1').update(contents).digest('hex');
    return sha as Sha
}


function binarySha(sha: Sha): string {
   return Buffer.from(sha, 'hex').toString('binary')
}


function catFile(args: string[]): void {
   const [,, sha] = args;
   const path = objectPathFromSha(sha as Sha);
   const fileBuffer = fs.readFileSync(path);

   const fileUnzip = unzipSync(fileBuffer);
   const [, content] = splitBlob(fileUnzip);
    process.stdout.write(content);
}


function objectPathFromSha(sha: Sha): string {
    return path.join('.git', 'objects', sha.slice(0, 2), sha.slice(2));
}


function splitBlob(file: Buffer): [number, string] {
   const sizeLineDelimiter = file.indexOf(0);
   const blobSizeLine = file.toString('utf8', 0, sizeLineDelimiter);
   const size = Number.parseInt(blobSizeLine.slice(5), 10);

    const content = file.toString('utf8', sizeLineDelimiter + 1);

    return [size, content];
}


function init(): void {
    fs.mkdirSync(".git", { recursive: true });
    fs.mkdirSync(".git/objects", { recursive: true });
    fs.mkdirSync(".git/refs", { recursive: true });
    fs.writeFileSync(".git/HEAD", "ref: refs/heads/main\n");
    console.log("Initialized git directory");
}
