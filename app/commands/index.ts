export * as cat_file from './cat-file.ts';
export * as commit_tree from './commit-tree.ts';
export * as clone from './clone.ts';
export * as hash_object from './hash-object.ts';
export * as init from './init.ts';
export * as ls_tree from './ls-tree.ts';
export * as write_tree from './write-tree.ts';

export const Commands = {
    Init: 'init',
    CatFile: 'cat-file',
    HashObject: 'hash-object',
    LsTree: 'ls-tree',
    WriteTree: 'write-tree',
    CommitTree: 'commit-tree',
    Clone: 'clone',
} as const;
