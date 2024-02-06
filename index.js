import { parse } from "./parser.js";

const path = process.argv[2];
const file = Bun.file(path);
const text = await file.text();

try {
    console.log(parse(text));
} catch (error) {
    console.error(error.message);
}
