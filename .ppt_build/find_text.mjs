import { FileBlob, PresentationFile } from "@oai/artifact-tool";
const p = await PresentationFile.importPptx(await FileBlob.load("LTP + Lesson slides/0509_Y10T1_文化认同_优化教学版_修订版.pptx"));
console.log((await p.inspect({ kind: "slide,textbox,shape", search: "回应概括性写作", maxChars: 5000 })).ndjson);
