import ExcelJS from "exceljs";

export type SheetData = {
  name: string;
  rows: (string | number)[][];
};

export async function buildWorkbookBuffer(sheets: SheetData[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "UniWai CRM";
  workbook.created = new Date();

  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name.slice(0, 31));
    for (const row of sheet.rows) {
      ws.addRow(row);
    }
    if (sheet.rows[0]?.length) {
      ws.getRow(1).font = { bold: true };
    }
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export async function parseContactsFromExcel(buffer: Buffer): Promise<
  Array<{ phone: string; name?: string }>
> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const rows: Array<{ phone: string; name?: string }> = [];
  const headerRow = sheet.getRow(1);
  const headers = headerRow.values as (string | number | undefined)[];
  const phoneIdx = headers.findIndex((h) =>
    String(h ?? "").toLowerCase().match(/telefono|teléfono|phone|celular|whatsapp/),
  );
  const nameIdx = headers.findIndex((h) =>
    String(h ?? "").toLowerCase().match(/nombre|name|cliente/),
  );

  const pCol = phoneIdx > 0 ? phoneIdx : 1;
  const nCol = nameIdx > 0 ? nameIdx : 2;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const phone = String(row.getCell(pCol).value ?? "").trim().replace(/\s/g, "");
    if (!phone || phone.length < 6) return;
    const nameVal = row.getCell(nCol).value;
    const name = nameVal ? String(nameVal).trim() : undefined;
    rows.push({ phone, name });
  });

  return rows;
}
