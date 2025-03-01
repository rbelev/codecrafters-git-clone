import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { unzip } from "node:zlib";

const args = process.argv.slice(2);
const command = args[0];

enum Commands {
    Init = "init",
    CatFile = "cat-file",
}

switch (command) {
    case Commands.Init:
        init();
        break;
    case Commands.CatFile:
        await catFile(args);
        break;
    default:
        throw new Error(`Unknown command ${command}`);
}

async function catFile(args: string[]): Promise<void> {
   const [,, sha] = args;
   const path = objectPathFromSha(sha);
   const fileBuffer = fs.readFileSync(path);

   const fileUnzip = await promisify(unzip)(fileBuffer);
   const [, content] = splitBlob(fileUnzip);
    process.stdout.write(content);
}

function objectPathFromSha(sha: string): string {
    return path.join('.git', 'objects', sha.slice(0, 2), sha.slice(2));
}

function splitBlob(file: Buffer): [number, string] {
   const sizeLineDelimiter = file.indexOf('\0');
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
