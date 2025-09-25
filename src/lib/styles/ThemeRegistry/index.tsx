// src/lib/styles/ThemeRegistry.tsx
'use client'; // ต้องเป็น Client Component

import * as React from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { ThemeProvider } from '@mui/material/styles';
import MainTheme from '@/lib/styles/MainStyle';

// สร้าง Emotion Cache สำหรับการทำ SSR
// ใช้ `stylisPlugins: []` หากใช้ Next.js 13+ และต้องการหลีกเลี่ยงปัญหา CSS order
// หรือใช้ตามที่ MUI แนะนำ
const createEmotionCache = () => {
  let cache = createCache({ key: 'mui' });
  // หากคุณใช้ `@emotion/server` ใน Pages Router, การตั้งค่านี้จะมีความซับซ้อนขึ้น
  // แต่สำหรับ App Router, การตั้งค่าพื้นฐานเช่นนี้มักจะเพียงพอ
  // อย่างไรก็ตาม เพื่อความมั่นใจ ควรใช้ key ที่แตกต่างกันสำหรับ Next.js เพื่อป้องกันการชนกันของลำดับ
  cache.compat = true; 
  return cache;
};

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [cache] = React.useState(() => createEmotionCache());

  // ใช้ useServerInsertedHTML เพื่อแทรก <style> tags ที่มี CSS ของ MUI/Emotion
  // ในระหว่างการเรนเดอร์ฝั่งเซิร์ฟเวอร์
  useServerInsertedHTML(() => {
    return (
      <style
        data-emotion={`${cache.key} ${Object.keys(cache.inserted).join(' ')}`}
        dangerouslySetInnerHTML={{
          __html: Object.values(cache.inserted).join(''),
        }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={MainTheme}>
        {/* CssBaseline เป็นสิ่งดีที่จะใส่เพื่อรีเซ็ต CSS */}
        {/* <CssBaseline /> */} 
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}