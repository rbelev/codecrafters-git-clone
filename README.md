Shout out and credit to CodeCrafter for this challenge. Highly recommended.

This is a clone of my solution, as iterated through their cli and tests.

### TODO/Shortfalls:
 - [ ] fix eslint to get 2 space indent 
 - [ ] Improve helpers, esp fn names, to clarify read vs write vs file load
 - [ ] Actually handle REF-delta, not error and abandon rest of packfile
 - [x] Convert main and sloppy cmdline args to Commander
 - [ ] Remove console.logs from test runs without debugger
 - [ ] Improve Markdown skills 😅

---
## Example 1
1. Use real git to get the sha of HEAD.
```
git log -2
> commit bb832fb99979762dc876fe60e7fb549cc4e7f79b (HEAD, origin/main, origin/HEAD, main)
```
2. Inspect contents of that commit blob.
```
npm start -- cat-file bb832fb99979762dc876fe60e7fb549cc4e7f79b
> tree 9c3cc82b8715651709e08060c4d497a406f7e571
> parent d58487d7b464324ac8144502c67af24262548287
> author Ryan Belev <ryan.belev@gmail.com> 1741365655 -0800
> committer Ryan Belev <ryan.belev@gmail.com> 1741365655 -0800
> 
> docs: ack console.logs to be removed
```
3. Inspect contents of the commit's tree blob.
```
npm start -- ls-tree 9c3cc82b8715651709e08060c4d497a406f7e571
> 40000  tree       ceaa32026e6ed5b62e49602907acf6e84a371313 .codecrafters
> 100644 file       176a458f94e0ea5272ce67c36bf30b6be9caf623 .gitattributes
> 100644 file       9cf6fffa3721899fd47ac27afd5e6051e18e142e .gitignore
> 100644 file       635718467cd09d7d85c827f4b6f077738b46fc20 README.md
> 40000  tree       03fae9ded5c4331cd0fb20b7d04924d8c32dacb3 app
> 100644 file       a263216b54b95a17266ce03393005611a43213eb codecrafters.yml
> 100644 file       8b331f9a7014ded1e4992a122fd27b81c4778c20 eslint.config.mjs
> 100644 file       41de4d883ba6512616b94e4138c3059c17d1b6ce package-lock.json
> 100644 file       9c7092fc4bad00dfcda47d994fd633d93c459f04 package.json
> 100644 file       815a959bbde1933c8d1c9d2e090cb17f69835b0d tsconfig.json
> 100755 executable fcc2fd5faa528f966cbaa64c267df03332d890ed your_program.sh
```
---
[![progress-banner](https://backend.codecrafters.io/progress/git/8d79512b-ae04-4119-a028-33eecab83985)](https://app.codecrafters.io/users/codecrafters-bot?r=2qF)

This is a starting point for TypeScript solutions to the
["Build Your Own Git" Challenge](https://codecrafters.io/challenges/git).

In this challenge, you'll build a small Git implementation that's capable of
initializing a repository, creating commits and cloning a public repository.
Along the way we'll learn about the `.git` directory, Git objects (blobs,
commits, trees etc.), Git's transfer protocols and more.

**Note**: If you're viewing this repo on GitHub, head over to
[codecrafters.io](https://codecrafters.io) to try the challenge.

# Passing the first stage

The entry point for your Git implementation is in `app/main.ts`. Study and
uncomment the relevant code, and push your changes to pass the first stage:

```sh
git commit -am "pass 1st stage" # any msg
git push origin master
```

That's all!

# Stage 2 & beyond

Note: This section is for stages 2 and beyond.

1. Ensure you have `bun (1.1)` installed locally
1. Run `./your_program.sh` to run your Git implementation, which is implemented
   in `app/main.ts`.
1. Commit your changes and run `git push origin master` to submit your solution
   to CodeCrafters. Test output will be streamed to your terminal.

# Testing locally

The `your_program.sh` script is expected to operate on the `.git` folder inside
the current working directory. If you're running this inside the root of this
repository, you might end up accidentally damaging your repository's `.git`
folder.

We suggest executing `your_program.sh` in a different folder when testing
locally. For example:

```sh
mkdir -p /tmp/testing && cd /tmp/testing
/path/to/your/repo/your_program.sh init
```

To make this easier to type out, you could add a
[shell alias](https://shapeshed.com/unix-alias/):

```sh
alias mygit=/path/to/your/repo/your_program.sh

mkdir -p /tmp/testing && cd /tmp/testing
mygit init
```
