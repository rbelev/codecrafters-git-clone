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
}

switch (command) {
    case Commands.Init:
        init();
        break;
    case Commands.CatFile:
        catFile(args);
        break;
    case Commands.HashObject:
        hashObject(args);
        break;
    case Commands.LsTree:
       const tree = readLsTree(args);
        tree.blobs.forEach((blob) => {
            // console.log(`${blob.mode} tree ${blob.sha} ${blob.name}`);
            console.log(`${blob.name}`);
        });
       break;
    default:
        throw new Error(`Unknown command ${command}`);
}

type LsTree = {
    size: number;
    blobs: {
        mode: string;
        name: string;
        sha: string;
    }[];
}

function readLsTree(args: string[]): LsTree {
    const [_ls, _nameOnly, treeSha] = args;
    const treePath = objectPathFromSha(treeSha);
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
        const sha = file.toString('hex', startOfSha, endOfSha + 1);

        blobs.push({ mode, name, sha })

        startOfBlob = endOfSha;
    }

    return { size: +size, blobs };
}


function hashObject(args: string[]): void {
    const [,, fileName] = args;
    const file = fs.readFileSync(fileName).toString();
    const sizeBytes = Buffer.byteLength(file);

    const contents = `blob ${sizeBytes}\0${file}`;
    // console.log(`contents: ${contents}`);
    const sha = crypto.createHash('sha1').update(contents).digest('hex');
    const writePath = objectPathFromSha(sha);
    const dir = path.dirname(writePath);
    fs.mkdirSync(dir, { recursive: true });

    const zlibContents = deflateSync(contents);
    fs.writeFileSync(writePath, zlibContents);
    process.stdout.write(sha);
}


function catFile(args: string[]): void {
   const [,, sha] = args;
   const path = objectPathFromSha(sha);
   const fileBuffer = fs.readFileSync(path);

   const fileUnzip = unzipSync(fileBuffer);
   const [, content] = splitBlob(fileUnzip);
    process.stdout.write(content);
}


function objectPathFromSha(sha: string): string {
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
