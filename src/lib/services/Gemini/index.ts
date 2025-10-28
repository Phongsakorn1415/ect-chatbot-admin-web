// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import { GoogleGenAI, Type } from "@google/genai";

async function getDataFromImage(imageData: string, imageMimeType: string) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const config = {
    thinkingConfig: {
      thinkingBudget: -1,
    },
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      description: "Course data with separate arrays for each field",
      required: ["code", "name", "credit", "language", "year", "term"],
      properties: {
        code: {
          type: Type.ARRAY,
          description: "List of course codes",
          items: {
            type: Type.STRING,
          },
        },
        name: {
          type: Type.ARRAY,
          description: "List of course names",
          items: {
            type: Type.STRING,
          },
        },
        credit: {
          type: Type.ARRAY,
          description: "List of course credits",
          items: {
            type: Type.INTEGER,
          },
        },
        language: {
          type: Type.ARRAY,
          description: "List of course languages",
          items: {
            type: Type.STRING,
          },
        },
        year: {
          type: Type.ARRAY,
          description: "List of course years",
          items: {
            type: Type.INTEGER,
          },
        },
        term: {
          type: Type.ARRAY,
          description: "List of course terms",
          items: {
            type: Type.INTEGER,
          },
        },
      },
    },
    systemInstruction: [
      {
        text: `สกัดข้อมูลเฉพาะ รหัสวิชา ชื่อวิชา หน่วยกิต ภาษาที่วิชานั้นใช้สอน ปีการศึกษา และภาคการศึกษา 
โดยผลลัพธ์ต้องแยกข้อมูลตามประเภท และข้อมูลใน index เดียวกันของแต่ละประเภทต้องเป็นของวิชาเดียวกัน

ตัวอย่างการจัดรูปแบบผลลัพธ์:
{
  'code': [<รหัสวิชาที่ 1>, <รหัสวิชาที่ 2>, ...],
  'name': [<ชื่อวิชาที่ 1>, <ชื่อวิชาที่ 2>, ...],
  'credit': [<หน่วยกิตวิชาที่ 1>, <หน่วยกิตวิชาที่ 2>, ...],
  'language': [<ภาษาใช้สอนวิชาที่ 1>, <ภาษาใช้สอนวิชาที่ 2>, ...],
  'year': [<ปีการศึกษาวิชาที่ 1>, <ปีการศึกษาวิชาที่ 2>, ...],
  'term': [<ภาคการศึกษาวิชาที่ 1>, <ภาคการศึกษาวิชาที่ 1>, ...]
}

เงื่อนไขเพิ่มเติม:
1. code: รหัสวิชา ดึงเฉพาะตัวเลขรหัสวิชา 9 หลัก ถ้า 9 หลักนั้นไม่ใช่ตัวเลขทั้งหมด ไม่ต้องสกัดข้อมูลวิชานั้น
2. name: ชื่อวิชา ดึงชื่อวิชาภาษาไทย ไม่ต้องแปลหรือใช้ชื่อภาษาอังกฤษที่อยู่ในวงเล็บ
3. credit: หน่วยกิต ดึงเฉพาะตัวเลขด้านหน้าเครื่องหมายวงเล็บ เช่น 2 จาก '2(2-0-4)'
4. language: ภาษาที่ใช้สอน ถ้ามีเครื่องหมาย * หลังชื่อวิชา ให้กำหนดเป็น 'en' หากไม่มีให้กำหนดเป็น 'th'
5. year and term: ปีการศึกษา และภาคการศึกษา ระบุจากข้อมูลที่ปรากฏในหัวข้อ เช่น 'ปีที่ 1' และ 'ภาคการศึกษาที่ 2' แต่ถ้าเป็น 'ภาคการศึกษาฤดูร้อน' ให้เป็น 'ภาคการศึกษาที่ 3' แทน

ตัวอย่างผลลัพธ์:
{
  'code': [
    '030523107',
    '030523118',
    '030523124',
    '030523126',
    '030523207',
    '030523218',
    '030523224',
    '030523226',
    '030523250',
    '030523602',
    '030943112'
  ],
  'name': [
    'ระบบไมโครคอนโทรลเลอร์',
    'การโปรแกรมเชิงวัตถุ',
    'การพัฒนาโปรแกรมประยุกต์บนเว็บ',
    'ระบบปฏิบัติการลินุกซ์และการบริหารจัดการ',
    'ปฏิบัติการระบบไมโครคอนโทรลเลอร์',
    'ปฏิบัติการการโปรแกรมเชิงวัตถุ',
    'ปฏิบัติการการพัฒนาโปรแกรมประยุกต์บนเว็บ',
    'ปฏิบัติการระบบปฏิบัติการลินุกซ์และการบริหารจัดการ',
    'โครงสร้างข้อมูลและการวิเคราะห์อัลกอริทึม',
    'ปฏิบัติการโครงสร้างข้อมูลและการวิเคราะห์อัลกอริทึม',
    'เมทริกซ์และการวิเคราะห์เวกเตอร์'
  ],
  'credit': [2, 2, 2, 2, 1, 1, 1, 1, 2, 1, 3],
  'language': ['th', 'en', 'th', 'th', 'th', 'en', 'th', 'th', 'en', 'en', 'th'],
  'year': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  'term': [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
}`,
      },
    ],
  };
  const model = "gemini-2.5-flash";
  const contents = [
    {
      role: "user",
      parts: [
        {
          inlineData: {
            data: imageData,
            mimeType: imageMimeType,
          },
        },
      ],
    },
  ];

  const response = await ai.models.generateContent({
    model,
    config,
    contents,
  });
  // let fileIndex = 0;
  // for await (const chunk of response) {
  //   console.log(chunk.text);
  // }
  console.log(response.text);
  return JSON.parse(response.text || "{}");
}

async function getDataFromPDF(pdfData: string) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const config = {
    thinkingConfig: {
      thinkingBudget: -1,
    },
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      description: "Course data with separate arrays for each field",
      required: ["code", "name", "credit", "language", "year", "term"],
      properties: {
        code: {
          type: Type.ARRAY,
          description: "List of course codes",
          items: {
            type: Type.STRING,
          },
        },
        name: {
          type: Type.ARRAY,
          description: "List of course names",
          items: {
            type: Type.STRING,
          },
        },
        credit: {
          type: Type.ARRAY,
          description: "List of course credits",
          items: {
            type: Type.INTEGER,
          },
        },
        language: {
          type: Type.ARRAY,
          description: "List of course languages",
          items: {
            type: Type.STRING,
          },
        },
        year: {
          type: Type.ARRAY,
          description: "List of course years",
          items: {
            type: Type.INTEGER,
          },
        },
        term: {
          type: Type.ARRAY,
          description: "List of course terms",
          items: {
            type: Type.INTEGER,
          },
        },
      },
    },
    systemInstruction: [
      {
        text: `สกัดข้อมูลเฉพาะ รหัสวิชา ชื่อวิชา หน่วยกิต ภาษาที่วิชานั้นใช้สอน ปีการศึกษา และภาคการศึกษา เฉพาะของแขนงวิชาคอมพิวเตอร์
โดยผลลัพธ์ต้องแยกข้อมูลตามประเภท และข้อมูลใน index เดียวกันของแต่ละประเภทต้องเป็นของวิชาเดียวกัน

ตัวอย่างการจัดรูปแบบผลลัพธ์:
{
  'code': [<รหัสวิชาที่ 1>, <รหัสวิชาที่ 2>, ...],
  'name': [<ชื่อวิชาที่ 1>, <ชื่อวิชาที่ 2>, ...],
  'credit': [<หน่วยกิตวิชาที่ 1>, <หน่วยกิตวิชาที่ 2>, ...],
  'language': [<ภาษาใช้สอนวิชาที่ 1>, <ภาษาใช้สอนวิชาที่ 2>, ...],
  'year': [<ปีการศึกษาวิชาที่ 1>, <ปีการศึกษาวิชาที่ 2>, ...],
  'term': [<ภาคการศึกษาวิชาที่ 1>, <ภาคการศึกษาวิชาที่ 1>, ...]
}

เงื่อนไขเพิ่มเติม:
1. code: รหัสวิชา ดึงเฉพาะตัวเลขรหัสวิชา 9 หลัก ถ้า 9 หลักนั้นไม่ใช่ตัวเลขทั้งหมด ไม่ต้องสกัดข้อมูลวิชานั้น
2. name: ชื่อวิชา ดึงชื่อวิชาภาษาไทย ไม่ต้องแปลหรือใช้ชื่อภาษาอังกฤษที่อยู่ในวงเล็บ
3. credit: หน่วยกิต ดึงเฉพาะตัวเลขด้านหน้าเครื่องหมายวงเล็บ เช่น 2 จาก '2(2-0-4)'
4. language: ภาษาที่ใช้สอน ถ้ามีเครื่องหมาย * หลังชื่อวิชา ให้กำหนดเป็น 'en' หากไม่มีให้กำหนดเป็น 'th'
5. year and term: ปีการศึกษา และภาคการศึกษา ระบุจากข้อมูลที่ปรากฏในหัวข้อ เช่น 'ปีที่ 1' และ 'ภาคการศึกษาที่ 2' แต่ถ้าเป็น 'ภาคการศึกษาฤดูร้อน' ให้เป็น 'ภาคการศึกษาที่ 3' แทน

ตัวอย่างผลลัพธ์:
{
  'code': [
    '030523107',
    '030523118',
    '030523124',
    '030523126',
    '030523207',
    '030523218',
    '030523224',
    '030523226',
    '030523250',
    '030523602',
    '030943112'
  ],
  'name': [
    'ระบบไมโครคอนโทรลเลอร์',
    'การโปรแกรมเชิงวัตถุ',
    'การพัฒนาโปรแกรมประยุกต์บนเว็บ',
    'ระบบปฏิบัติการลินุกซ์และการบริหารจัดการ',
    'ปฏิบัติการระบบไมโครคอนโทรลเลอร์',
    'ปฏิบัติการการโปรแกรมเชิงวัตถุ',
    'ปฏิบัติการการพัฒนาโปรแกรมประยุกต์บนเว็บ',
    'ปฏิบัติการระบบปฏิบัติการลินุกซ์และการบริหารจัดการ',
    'โครงสร้างข้อมูลและการวิเคราะห์อัลกอริทึม',
    'ปฏิบัติการโครงสร้างข้อมูลและการวิเคราะห์อัลกอริทึม',
    'เมทริกซ์และการวิเคราะห์เวกเตอร์'
  ],
  'credit': [2, 2, 2, 2, 1, 1, 1, 1, 2, 1, 3],
  'language': ['th', 'en', 'th', 'th', 'th', 'en', 'th', 'th', 'en', 'en', 'th'],
  'year': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  'term': [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
}`,
      },
    ],
  };
  const model = "gemini-2.5-flash";
  
  const contents = [
    {
      role: "user",
      parts: [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: pdfData,
          },
        },
      ],
    },
  ];

  const response = await ai.models.generateContent({
    model,
    config,
    contents,
  });
  console.log(response.text);
  return JSON.parse(response.text || "{}");
}

export { getDataFromImage, getDataFromPDF };
