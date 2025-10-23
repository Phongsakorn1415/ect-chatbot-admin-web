This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## การซิงก์ฐานข้อมูล (Prisma Migrate)

โปรเจกต์นี้ใช้ Prisma เป็น ORM สำหรับจัดการสคีมาฐานข้อมูลและการย้ายข้อมูล (migrations) หากต้องการซิงก์ฐานข้อมูลให้ตรงกับไฟล์สคีมา (`prisma/schema.prisma`) ให้ใช้คำสั่งต่อไปนี้:

### เงื่อนไขก่อนเริ่ม
- ตั้งค่าไฟล์ `.env` ให้มีตัวแปร `DATABASE_URL` ชี้ไปยังฐานข้อมูลที่ต้องการ
- ฐานข้อมูลปลายทางต้องสามารถเชื่อมต่อได้ (เช่น เปิด Docker/Postgres/MySQL อยู่ หรือใช้บริการคลาวด์)

### คำสั่งสำหรับซิงก์ฐานข้อมูล

รันในโฟลเดอร์รูทของโปรเจกต์:

```bash
npx prisma migrate dev --name init
```

สิ่งที่คำสั่งนี้ทำ:
- เปรียบเทียบสคีมาใน `prisma/schema.prisma` กับสถานะล่าสุดของฐานข้อมูล
- สร้างไฟล์ migration ใหม่ภายใต้โฟลเดอร์ `prisma/migrations` (เช่น `YYYYMMDDHHMMSS_init/`) หากมีการเปลี่ยนแปลง
- ใช้ migration เหล่านั้นกับฐานข้อมูลในโหมดพัฒนางาน (dev)
- อัปเดต Prisma Client อัตโนมัติให้ตรงกับสคีมา

หมายเหตุ:
- หากมีไฟล์ migration อยู่แล้ว (ตัวอย่างเช่น `prisma/migrations/20250923050311_init/`) คำสั่งจะพยายามนำไปใช้กับฐานข้อมูลให้ตรงตามสถานะล่าสุด
- ชื่อ `init` เป็นเพียงชื่ออธิบาย migration คุณสามารถเปลี่ยนเป็นชื่ออื่นที่สื่อความหมายได้ (เช่น `add_user_table`)

### ตรวจสอบผลลัพธ์เพิ่มเติม (ไม่บังคับ)
- เปิด Prisma Studio เพื่อดูข้อมูลในฐานข้อมูลแบบกราฟิก:

	```bash
	npx prisma studio
	```

- หากเกิดข้อผิดพลาดเกี่ยวกับการเชื่อมต่อ ให้ตรวจสอบค่า `DATABASE_URL` และสถานะของฐานข้อมูลอีกครั้ง

## สร้างผู้ใช้แรก (Prisma Seed)
### ตั้งค่าตัวแปรใน `.env`

เพิ่มตัวแปรต่อไปนี้ (ตัวอย่าง):

```
FIRST_USER_EMAIL=admin@example.com
FIRST_USER_PASSWORD=ChangeMe123!
FIRST_USER_TITLE=Mr.
FIRST_USER_FIRST_NAME=Admin
FIRST_USER_LAST_NAME=User
# เลือกได้: TEACHER | ADMIN | SUPER_ADMIN (ค่า default: SUPER_ADMIN)
FIRST_USER_ROLE=SUPER_ADMIN
```

### รันสคริปต์ Seed

หลังจากตั้งค่า `DATABASE_URL` และตัวแปรผู้ใช้แรกแล้ว ให้รัน:

```bash
npx prisma db seed
# หรือ
npm run seed
```

สคริปต์จะทำการ upsert ผู้ใช้จากอีเมล หากมีอยู่แล้วจะไม่เขียนทับข้อมูลเดิม (จะเพียงยืนยันให้มีผู้ใช้อยู่)

