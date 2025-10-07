import helmet from "helmet";
import cors from "cors";
import { RequestHandler } from "express";

//ฟังก์ชันนี้จะรับ app (Express application) เป็นพารามิเตอร์
//แล้วตั้งค่ามิดเดิลแวร์ด้านความปลอดภัยต่าง ๆ ให้กับแอปพลิเคชันนั้น

export const useSecurity = (app: any) => {
  //ป้องกันการโจมตีแบบ XSS
  app.use(helmet());
  //ป้องกันการโจมตีแบบ Clickjacking
  app.use(helmet.frameguard({ action: "deny" }));
  //ป้องกันการโจมตีแบบ MIME-sniffing
  app.use(helmet.noSniff());
  //ป้องกันการโจมตีแบบ Cross-site scripting (XSS)
  app.use(helmet.xssFilter());
  //ป้องกันการโจมตีแบบ HSTS
  app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));
  //ป้องกันการโจมตีแบบ Referrer-Policy
  app.use(helmet.referrerPolicy({ policy: "no-referrer" }));
  //ตั้งค่า HSTS (HTTP Strict Transport Security)
  //app.use(hsts({ maxAge: 15552000 })); // 180 วัน

  //ตั้งค่า CORS (Cross-Origin Resource Sharing)
  app.use(cors({ origin: true, credentials: true }));
};

export const notFound: RequestHandler = (req: any, res: any, next: any) => {
  res.status(404).json({ message: "Not Found" });
};
//ฟังก์ชันนี้จะส่งสถานะ 404 และข้อความ "Not Found" เมื่อไม่มีเส้นทาง (route) ที่ตรงกับคำขอ (request) ที่เข้ามา
