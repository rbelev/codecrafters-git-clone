import { promisify } from "node:util";
import { unzip } from "node:zlib";

const EntryTypeMapping = {
    "001": "Commit",
    "010": "Tree",
    "011": "Blob",
    "100": "Tag",
    "110": "OFS-delta", // (delta against an offset in the pack)
    "111": "REF-delta", // (delta against another object referenced by SHA-1)
} as const;
type EntryType = typeof EntryTypeMapping[keyof typeof EntryTypeMapping];

type EntryPointer = { type: EntryType; size: number; position: number };

export type PackItem = { content: Buffer; type: EntryType };


export async function breakdownPack(pack: ArrayBuffer): Promise<Array<PackItem>> {
    // Cheating to skip echo & NACK to get to PACK.
    // CONFIRM: new UInt8Array seems to be a view of the underlying ArrayBuffer--no copying.
    const headerStart = new Uint8Array(pack).indexOf('\n'.charCodeAt(0)) + 1;

    const header = Buffer.from(pack, headerStart + 0, 4).toString('ascii');
    const version = Buffer.from(pack, headerStart + 4, 4).readUInt32BE(0);
    const itemsContained = Buffer.from(pack, headerStart + 8, 4).readUint32BE();

    console.log(`breakdownPack: ${header} v${version} #${itemsContained} len:${pack.byteLength}`);

    let cursor = headerStart + 12;
    const entries: PackItem[] = [];
    for (let i = 0; i < itemsContained; i += 1) {

        const pointer = extractPackEntryTypeAndSize(pack, cursor);
        console.log(`breakdownPack: ${pointer.type} ${pointer.size} ${pointer.position}/${pack.byteLength}`)
        try {
            const entry = await getNextEntry(pack, pointer);
            entries[i] = { content: entry.content, type: pointer.type };
            cursor = pointer.position + entry.bytesConsumed;
        } catch (error: unknown) {
            break;
        }
    }
    return entries;
}

export function extractPackEntryTypeAndSize(buffer: ArrayBuffer, position: number): EntryPointer {
    const leadingByte = Buffer.from(buffer, position, 1)[0];
    // const typeCode = leadingByte.toString(2).padStart(8, '0').substring(0, 3);
    const typeCode = (leadingByte & 0b0111_0000).toString(2).padStart(8, '0').slice(1, 4);
    let type: EntryType = EntryTypeMapping[typeCode as keyof typeof EntryTypeMapping];
    if (!type) {
        type = typeCode as EntryType;
    }

    let hasAnotherByte = (leadingByte & 0b1000_0000) === 128; // !== 0
    // const lsb = leadingByte & 0b0000_1111;
    const lsb = leadingByte.toString(2).padStart(4, '0').slice(-4);
    const binaryPieces = [lsb];

    let index = position + 1;
    while (hasAnotherByte) {
        const nextByte = Buffer.from(buffer, index, 1)[0];
        hasAnotherByte = (nextByte & 0b1000_0000) !== 0;
        const next7Bits= nextByte & 0b0111_1111;
        binaryPieces.unshift(next7Bits.toString(2).padStart(7, '0'));
        index += 1;
    }
    const fullLengthBinary = binaryPieces.join('');
    const size = Number.parseInt(fullLengthBinary, 2);

    return { type, size, position: index };
}


async function getNextEntry(buffer: ArrayBuffer, pointer: EntryPointer): Promise<{ type: EntryType; sha?: string; content: Buffer; bytesConsumed: number }> {
    if (pointer.size === 0) {
        return { type: pointer.type, content: Buffer.from(''), bytesConsumed: 0 };
    }

    let zipContent = Buffer.from(buffer, pointer.position);
    let sha: string | undefined = undefined;
    let bytesConsumed = 0;

    if (pointer.type === 'OFS-delta' || pointer.type === 'REF-delta') {
        // TODO: base object name, not SHA?
        const nullByte = zipContent.indexOf('\0');
        const baseObjectName = zipContent.subarray(0, nullByte).toString('ascii');
        console.log(`getNextEntry: got ${nullByte}->'${baseObjectName}'`);
        bytesConsumed += nullByte + 1;


        // sha = zipContent.subarray(0, 20).toString('hex');
        // console.log(`getNextEntry: got ${pointer.type} sha: ${sha}`);
        // zipContent = zipContent.subarray(20);
        // bytesConsumed += 20;

        // return { type: pointer.type, sha, content: zipContent.subarray(0, pointer.size), bytesConsumed: bytesConsumed + pointer.size };
        // return zipContent;
    }

    const { buffer: content, engineBytesConsumed } = await unzipOutputBytes(zipContent, pointer);

    return { type: pointer.type, sha, content, bytesConsumed: bytesConsumed + engineBytesConsumed };
}


async function unzipOutputBytes(buffer: ArrayBuffer, pointer: EntryPointer): Promise<{ buffer: Buffer; engineBytesConsumed: number }> {
    const result = (await promisify(unzip)(buffer, { info: true, maxOutputLength: pointer.size })) as unknown as { buffer: Buffer; engine: { bytesWritten: number } };
    return { buffer: result.buffer, engineBytesConsumed: result.engine.bytesWritten};
}
