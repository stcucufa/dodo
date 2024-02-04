import { parse } from "./parser.js";

const path = process.argv[2];
const file = Bun.file(path);
const text = await file.text();
console.log(parse(text));
