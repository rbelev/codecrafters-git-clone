import fs from "node:fs/promises";

import { init } from './index.ts';
import { commit, gitUploadPack, object, pack, trees } from '../helpers/index.ts';


export async function clone(target: string, dir: string): Promise<void> {
    // const [, target, dir] = args;

    const packBuffer = await gitUploadPack.getRepoPack(target);
    const entries = await pack.breakdownPack(packBuffer);

    // git init at target dir. chdir for successive file writes.
    await fs.mkdir(dir, {recursive: true});
    process.chdir(dir);
    await init.init();

    const shaToContents = await writeEntriesIntoGit(entries);
    await reconstructFileTreeFromPackEntries(entries, shaToContents);
}


async function reconstructFileTreeFromPackEntries(entries: pack.PackItem[], shaMap: Map<string, Buffer>): Promise<void> {
    const commitEntry = entries.find((entry) => entry.type === 'Commit');
    if (!commitEntry) {
        console.error(`reconstruct: no Commit entry`);
        return;
    }
    const commitTreeSha = commit.extractTreeShaFromCommit(commitEntry.content);
    await reconstructTree(commitTreeSha, shaMap);
}


async function reconstructTree(treeSha: string, shaMap: Map<string, Buffer>): Promise<void> {
    // console.log(`reconstructTree: ${treeSha} @ ${process.cwd()}`);

    const treeBlob = shaMap.get(treeSha);
    if (!treeBlob) {
        console.error(`reconstructTree: tree blob does not exist`);
        return;
    }

    const { blobs } = trees.parseTreeFile(treeBlob);
    for (const blob of blobs) {
        if (blob.mode === '100644') {
            const fileBlob = shaMap.get(blob.sha);
            if (!fileBlob) {
                console.error('reconstructTree: file blob does not exist');
                continue;
            }
            const { content } = object.splitBlob(fileBlob);
            await fs.writeFile(blob.name, content);
            continue;
        }

        if (blob.mode === '100755') {
            const fileBlob = shaMap.get(blob.sha);
            if (!fileBlob) {
                console.error('reconstructTree: executable blob does not exist');
                continue;
            }
            const { content } = object.splitBlob(fileBlob);
            await fs.writeFile(blob.name, content, { mode: 0o777 });
            continue;
        }

        if (blob.mode === '40000') {
            const cwd = process.cwd();
            await fs.mkdir(blob.name, { recursive: true });
            process.chdir(blob.name);
            await reconstructTree(blob.sha, shaMap);
            process.chdir(cwd);
            continue;
        }

        console.log(`reconstructTree: ignoring ${blob.mode} ${blob.name}`);
    }
}


async function writeEntriesIntoGit(entries: pack.PackItem[]): Promise<Map<string, Buffer>> {
    const shaToContent = new Map<string, Buffer>();

    // Save all objects into .git
    for (const entry of entries) {
        switch (entry.type) {
            case "Blob": {
                const formatContent = object.formBlob('blob', entry.content);
                const sha = await object.writeObjectContents(formatContent);
                shaToContent.set(sha, formatContent);
                break;
            }
            case "Commit": {
                const formatContent = object.formBlob('commit', entry.content);
                const sha = await object.writeObjectContents(formatContent);
                shaToContent.set(sha, formatContent);
                break;
            }
            case "Tree": {
                const formatContent = object.formBlob('tree', entry.content);
                const sha = await object.writeObjectContents(formatContent);
                shaToContent.set(sha, formatContent);
            }
        }
    }

    return shaToContent;
}
