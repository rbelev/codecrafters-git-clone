import fs from "node:fs/promises";

export async function init(): Promise<void> {
    await fs.mkdir(".git", { recursive: true });
    await fs.mkdir(".git/objects", { recursive: true });
    await fs.mkdir(".git/refs", { recursive: true });
    await fs.writeFile(".git/HEAD", "ref: refs/heads/main\n");
    // console.log("Initialized git directory");
}
