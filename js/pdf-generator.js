export function asciiPdfText(value){
  return String(value??"")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[–—]/g,"-").replace(/[^\x20-\x7E]/g,"?")
    .replace(/([\\()])/g,"\\$1");
}

export function createTextPdf(pages){
  if(!Array.isArray(pages)||!pages.length)throw new Error("O PDF precisa ter ao menos uma página.");
  const objects=[],pageRefs=[];
  objects[1]="<< /Type /Catalog /Pages 2 0 R >>";
  objects[3]="<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>";
  pages.forEach((lines,pageIndex)=>{
    const pageObject=4+pageIndex*2,contentObject=pageObject+1;pageRefs.push(`${pageObject} 0 R`);
    const commands=["BT","/F1 8 Tf","36 555 Td"];
    lines.forEach((line,index)=>{if(index)commands.push("0 -12 Td");commands.push(`(${asciiPdfText(line)}) Tj`)});commands.push("ET");
    const stream=commands.join("\n");
    objects[pageObject]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObject} 0 R >>`;
    objects[contentObject]=`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });
  objects[2]=`<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pageRefs.length} >>`;
  let pdf="%PDF-1.4\n%77TEAM\n";const offsets=[0];
  for(let id=1;id<objects.length;id++){offsets[id]=pdf.length;pdf+=`${id} 0 obj\n${objects[id]}\nendobj\n`}
  const xrefOffset=pdf.length;pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for(let id=1;id<objects.length;id++)pdf+=`${String(offsets[id]).padStart(10,"0")} 00000 n \n`;
  pdf+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf],{type:"application/pdf"});
}
