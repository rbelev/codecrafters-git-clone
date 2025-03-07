import * as commands from './commands/index.ts';
import type { Sha } from './helpers/index.ts';

import { Command } from 'commander';
const program = new Command();
program.version('0.1.0');

program
    .command('init')
    .description('Create .git and subdirectories')
    .action(async () => {
        await commands.init.init();
    });

program
    .command('cat-file <sha>')
    .description('Print file contents at sha')
    .option('-p', 'pretty print contents based on type')
    .action(async (sha: string, cmdObj: Command) => {
        const file = await commands.cat_file.catFile(sha as Sha);
        process.stdout.write(file);
    });

program
    .command('hash-object <fileName>')
    .description('Save file within .git/objects, printing sha')
    .action(async (fileName: string, cmdObj: Command) => {
        const sha = await commands.hash_object.hashObject(fileName);
        console.log(sha);
    });

program
    .command('ls-tree <sha>')
    .description('List contents of tree sha')
    .option('--name-only', 'Print name only')
    .action(async (sha: string, cmdObj) => {
        const tree = await commands.ls_tree.readLsTree(sha);
        tree.blobs.forEach((blob) => {
            if (cmdObj.nameOnly) {
                console.log(`${blob.name}`);
            } else {
                // TODO: Improve slapdash spacing.
                console.log(`${blob.mode.padEnd(6, ' ')} ${blob.fileType.padEnd('executable'.length, ' ')} ${blob.sha} ${blob.name}`);
            }
        });
    })

program
    .command('write-tree')
    .description('Write working directory into .git')
    .action(async (cmdObj: Command) => {
        const sha = await commands.write_tree.writeTree();
        console.log(`${sha}`);
    });

program
    .command('commit-tree <treeSha>')
    .description('Create git commit')
    .requiredOption('-p, --parent <parentSha>', 'Parent to the tree')
    .requiredOption('-m, --message <message>', 'Message for commit')
    .action(async (treeSha: string, cmdObj: any) => {

        // const [_cmd, treeSha, _p, parentSha, _m, message] = args;
        const sha = await commands.commit_tree.commitTree({
            treeSha,
            parentSha: cmdObj.parentSha as Sha,
            message: cmdObj.message,
        });
        console.log(`${sha}`);
    })

program
    .command('clone <remote> <some_dir>')
    .description('Clone a remote git repository locally')
    .action(async (remote: string, someDir: string, cmdObj) => {
        await commands.clone.clone(remote, someDir)
    })

await program.parseAsync(process.argv);
