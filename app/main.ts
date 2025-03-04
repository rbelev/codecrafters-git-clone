import * as commands from './commands/index.ts';
import { Commands } from './commands/index.ts';
import type { Sha } from './helpers/index.ts';

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case Commands.Init:
        await commands.init.init();
        break;
    case Commands.CatFile: {
        const file = await commands.cat_file.catFile(args.at(-1) as Sha);
        process.stdout.write(file);
        break;
    }
    case Commands.HashObject: {
        const [, , fileName] = args;
        const sha = await commands.hash_object.hashObject(fileName);
        console.log(sha);
        break;
    }
    case Commands.LsTree:
       const tree = await commands.ls_tree.readLsTree(args);
        tree.blobs.forEach((blob) => {
            // console.log(`${blob.mode} tree ${blob.sha} ${blob.name}`);
            console.log(`${blob.name}`);
        });
       break;
   case Commands.WriteTree: {
       const sha = await commands.write_tree.writeTree();
       console.log(`${sha}`);
       break;
   }
   case Commands.CommitTree: {
       const sha = await commands.commit_tree.commitTree(args);
       console.log(`${sha}`);
       break;
   }
   case Commands.Clone: {
       await commands.clone.clone(args);
       break;
   }
   default:
       throw new Error(`Unknown command ${command}`);
}
