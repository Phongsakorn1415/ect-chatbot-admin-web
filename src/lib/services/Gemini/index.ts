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
      type: Type.ARRAY,
      description: "Course data as array of objects",
      items: {
        type: Type.OBJECT,
        required: ["code", "name", "credit", "language", "year", "term"],
        properties: {
          code: {
            type: Type.STRING,
            description: "Course code",
          },
          name: {
            type: Type.STRING,
            description: "Course name",
          },
          credit: {
            type: Type.INTEGER,
            description: "Course credit",
          },
          language: {
            type: Type.STRING,
            description: "Course language",
          },
          year: {
            type: Type.INTEGER,
            description: "Course year",
          },
          term: {
            type: Type.INTEGER,
            description: "Course term",
          },
        },
      },
    },
    systemInstruction: [
      {
        text: `สกัดข้อมูลเฉพาะ รหัสวิชา ชื่อวิชา หน่วยกิต ภาษาที่วิชานั้นใช้สอน ปีการศึกษา และภาคการศึกษา 
โดยผลลัพธ์ต้องเป็น array ของ object โดยแต่ละ object จะประกอบด้วยข้อมูลของวิชาหนึ่งๆ

ตัวอย่างการจัดรูปแบบผลลัพธ์:
[
    {
        'code': <รหัสวิชาที่ 1>,
        'name': <ชื่อวิชาที่ 1>,
        'credit': <หน่วยกิตวิชาที่ 1>,
        'language': <ภาษาที่ใช้สอนวิชาที่ 1>,
        'year': <ปีการศึกษาวิชาที่ 1>,
        'term': <ภาคการศึกษาวิชาที่ 1>
    },
    {
        'code': <รหัสวิชาที่ 2>,
        'name': <ชื่อวิชาที่ 2>,
        'credit': <หน่วยกิตวิชาที่ 2>,
        'language': <ภาษาที่ใช้สอนวิชาที่ 2>,
        'year': <ปีการศึกษาวิชาที่ 2>,
        'term': <ภาคการศึกษาวิชาที่ 2>
    }, ...
]

เงื่อนไขเพิ่มเติม:
1. code: รหัสวิชา ดึงเฉพาะตัวเลขรหัสวิชา 9 หลัก ถ้า 9 หลักนั้นไม่ใช่ตัวเลขทั้งหมด ไม่ต้องสกัดข้อมูลวิชานั้น
2. name: ชื่อวิชา ดึงชื่อวิชาภาษาไทย ไม่ต้องแปลหรือใช้ชื่อภาษาอังกฤษที่อยู่ในวงเล็บ
3. credit: หน่วยกิต ดึงเฉพาะตัวเลขด้านหน้าเครื่องหมายวงเล็บ เช่น 2 จาก '2(2-0-4)'
4. language: ภาษาที่ใช้สอน ถ้ามีเครื่องหมาย * หลังชื่อวิชา ให้กำหนดเป็น 'eng' หากไม่มีให้กำหนดเป็น 'thai'
5. year and term: ปีการศึกษา และภาคการศึกษา ระบุจากข้อมูลที่ปรากฏในหัวข้อ เช่น 'ปีที่ 1' และ 'ภาคการศึกษาที่ 2' แต่ถ้าเป็น 'ภาคการศึกษาฤดูร้อน' ให้เป็น 'ภาคการศึกษาที่ 0' แทน

ตัวอย่างผลลัพธ์:
[
  {
    'code': '030523107',
    'name': 'ระบบไมโครคอนโทรลเลอร์',
    'credit': 2,
    'language': 'thai',
    'year': 1,
    'term': 2
  },
  {
    'code': '030523118',
    'name': 'การโปรแกรมเชิงวัตถุ',
    'credit': 2,
    'language': 'eng',
    'year': 1,
    'term': 2
  },
  {
    'code': '030523124',
    'name': 'การพัฒนาโปรแกรมประยุกต์บนเว็บ',
    'credit': 2,
    'language': 'thai',
    'year': 1,
    'term': 2
  }
]`,
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
  return JSON.parse(response.text || "[]");
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
      type: Type.ARRAY,
      description: "Course data as array of objects",
      items: {
        type: Type.OBJECT,
        required: ["code", "name", "credit", "language", "year", "term"],
        properties: {
          code: {
            type: Type.STRING,
            description: "Course code",
          },
          name: {
            type: Type.STRING,
            description: "Course name",
          },
          credit: {
            type: Type.INTEGER,
            description: "Course credit",
          },
          language: {
            type: Type.STRING,
            description: "Course language",
          },
          year: {
            type: Type.INTEGER,
            description: "Course year",
          },
          term: {
            type: Type.INTEGER,
            description: "Course term",
          },
        },
      },
    },
    systemInstruction: [
      {
        text: `สกัดข้อมูลเฉพาะ รหัสวิชา ชื่อวิชา หน่วยกิต ภาษาที่วิชานั้นใช้สอน ปีการศึกษา และภาคการศึกษา เฉพาะของแขนงวิชาคอมพิวเตอร์
โดยผลลัพธ์ต้องเป็น array ของ object โดยแต่ละ object จะประกอบด้วยข้อมูลของวิชาหนึ่งๆ

ตัวอย่างการจัดรูปแบบผลลัพธ์:
[
    {
        'code': <รหัสวิชาที่ 1>,
        'name': <ชื่อวิชาที่ 1>,
        'credit': <หน่วยกิตวิชาที่ 1>,
        'language': <ภาษาที่ใช้สอนวิชาที่ 1>,
        'year': <ปีการศึกษาวิชาที่ 1>,
        'term': <ภาคการศึกษาวิชาที่ 1>
    },
    {
        'code': <รหัสวิชาที่ 2>,
        'name': <ชื่อวิชาที่ 2>,
        'credit': <หน่วยกิตวิชาที่ 2>,
        'language': <ภาษาที่ใช้สอนวิชาที่ 2>,
        'year': <ปีการศึกษาวิชาที่ 2>,
        'term': <ภาคการศึกษาวิชาที่ 2>
    }, ...
]

เงื่อนไขเพิ่มเติม:
1. code: รหัสวิชา ดึงเฉพาะตัวเลขรหัสวิชา 9 หลัก ถ้า 9 หลักนั้นไม่ใช่ตัวเลขทั้งหมด ไม่ต้องสกัดข้อมูลวิชานั้น
2. name: ชื่อวิชา ดึงชื่อวิชาภาษาไทย ไม่ต้องแปลหรือใช้ชื่อภาษาอังกฤษที่อยู่ในวงเล็บ
3. credit: หน่วยกิต ดึงเฉพาะตัวเลขด้านหน้าเครื่องหมายวงเล็บ เช่น 2 จาก '2(2-0-4)'
4. language: ภาษาที่ใช้สอน ถ้ามีเครื่องหมาย * หลังชื่อวิชา ให้กำหนดเป็น 'eng' หากไม่มีให้กำหนดเป็น 'thai'
5. year and term: ปีการศึกษา และภาคการศึกษา ระบุจากข้อมูลที่ปรากฏในหัวข้อ เช่น 'ปีที่ 1' และ 'ภาคการศึกษาที่ 2' แต่ถ้าเป็น 'ภาคการศึกษาฤดูร้อน' ให้เป็น 'ภาคการศึกษาที่ 0' แทน

ตัวอย่างผลลัพธ์:
[
  {
    'code': '030523107',
    'name': 'ระบบไมโครคอนโทรลเลอร์',
    'credit': 2,
    'language': 'thai',
    'year': 1,
    'term': 2
  },
  {
    'code': '030523118',
    'name': 'การโปรแกรมเชิงวัตถุ',
    'credit': 2,
    'language': 'eng',
    'year': 1,
    'term': 2
  },
  {
    'code': '030523124',
    'name': 'การพัฒนาโปรแกรมประยุกต์บนเว็บ',
    'credit': 2,
    'language': 'thai',
    'year': 1,
    'term': 2
  }
]`,
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
  return JSON.parse(response.text || "[]");
}

export { getDataFromImage, getDataFromPDF };
