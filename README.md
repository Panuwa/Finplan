# แผนปลดหนี้และสร้างรายได้

เว็บแอปไฟล์เดียว (`index.html`) ไม่มี backend ไม่ใช้ไลบรารีภายนอก
ข้อมูลเก็บใน localStorage ของเบราว์เซอร์ และซิงค์ขึ้น Firebase (Google sign-in + Firestore) เมื่อตั้งค่าและเข้าสู่ระบบ
สำรอง/นำกลับด้วยไฟล์ JSON ได้ในแท็บ "ข้อมูล"

## ฟีเจอร์
- ใส่หนี้ได้ไม่จำกัดก้อน จัดลำดับโปะแบบ Avalanche (ดอกเบี้ยสูงสุดก่อน)
- งบรายเดือน คำนวณเงินเหลือไปโปะ และปรับยอดโปะเพิ่มเองได้
- สรุป: ปลอดหนี้อีกกี่เดือน/เมื่อไหร่ ดอกเบี้ยรวม ดอกเบี้ยที่ประหยัดเทียบจ่ายขั้นต่ำ กราฟยอดหนี้
- ไอเดียรายได้เสริม (คำนวณบาท/ชั่วโมง) และบันทึกรายได้จริงรายเดือน

## เผยแพร่บน GitHub Pages
1. สร้าง repository ใหม่บน GitHub (เช่น `debt-plan`)
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้นไปที่ branch `main`
3. Settings > Pages > Source เลือก "Deploy from a branch" > Branch `main` / `/ (root)` > Save
4. รอ 1-2 นาที เปิด `https://<ชื่อผู้ใช้>.github.io/debt-plan/`

## ตั้งค่า Firebase (ซิงค์ข้อมูลข้ามอุปกรณ์)
1. https://console.firebase.google.com > Add project (หรือใช้โปรเจกต์เดิม)
2. Project settings > Your apps > เพิ่ม Web app (`</>`) > คัดลอกค่า `firebaseConfig` มาวางแทนใน `firebase-config.js`
3. Build > Authentication > Get started > Sign-in method > เปิด **Google**
4. Authentication > Settings > Authorized domains > เพิ่ม `<ชื่อผู้ใช้>.github.io`
5. Build > Firestore Database > Create database (เลือก region ใกล้ไทย เช่น asia-southeast1)
6. Firestore > Rules > วางเนื้อหาจาก `firestore.rules` > Publish
7. อัปโหลดไฟล์ที่แก้แล้วขึ้น GitHub แล้วเปิดแอป ไปแท็บ "ข้อมูล" > เข้าสู่ระบบด้วย Google

ข้อมูลของแต่ละคนอยู่ที่ `users/{uid}` และ Rules ให้เจ้าของบัญชีอ่าน/เขียนได้คนเดียว
การซิงค์เป็นแบบ "บันทึกล่าสุดชนะ" ถ้าแก้พร้อมกันหลายเครื่อง ให้เปิดทีละเครื่อง
