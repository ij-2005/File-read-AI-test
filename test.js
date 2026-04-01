const fs = require("fs");
const pdfParse = require("pdf-parse");

(async () => {
  const dataBuffer = fs.readFileSync("demo.pdf");
  const data = await pdfParse(dataBuffer);
  console.log(data.text);
})();
