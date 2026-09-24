import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const sourcePath = path.resolve("LTP + Lesson slides/0509_Y10T1_文化认同_优化教学版_修订版.pptx");
const outDir = path.resolve(".ppt_build/source-inspection");
await fs.mkdir(outDir, { recursive: true });
const presentation = await PresentationFile.importPptx(await FileBlob.load(sourcePath));
const snapshot = await presentation.inspect({
  kind: "deck,slide,textbox,shape,image,table,chart,notes,layout",
  maxChars: 45000,
});
await fs.writeFile(path.join(outDir, "inspect.ndjson"), snapshot.ndjson);
for (const n of [15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]) {
  const slide = presentation.slides.getItem(n - 1);
  const png = await slide.export({ format: "png", scale: 1.5 });
  await fs.writeFile(path.join(outDir, `slide-${n}.png`), new Uint8Array(await png.arrayBuffer()));
}
console.log(snapshot.ndjson);
