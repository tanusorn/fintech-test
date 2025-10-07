import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

declare global {
  interface Window {
    grecaptcha?: any;
  }
}

type Props = {
  open: boolean;
  siteKey: string;
  onVerified: (token: string) => void;
  onClose: () => void;
  title?: string;
};

export default function ReCaptchaDialog({
  open,
  siteKey,
  onVerified,
  onClose,
  title = "ยืนยันตัวตนด้วย ReCAPTCHA",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [widgetId, setWidgetId] = useState<number | null>(null);
  const [containerKey, setContainerKey] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  // บังคับ remount container ทุกครั้งที่เปิด
  useEffect(() => {
    if (open) setContainerKey((k) => k + 1);
  }, [open]);

  // สร้าง widget เมื่อ dialog เปิด + script พร้อม + container พร้อม
  useEffect(() => {
    if (!open) return;
    setErr(null);

    // รอให้ script พร้อม (โหลดจาก index.html)
    const waitReady = () =>
      new Promise<void>((resolve) => {
        const t = setInterval(() => {
          if (window.grecaptcha && window.grecaptcha.render) {
            clearInterval(t);
            resolve();
          }
        }, 120);
      });

    let cancelled = false;
    (async () => {
      await waitReady();
      if (cancelled || !containerRef.current) return;

      // Delay 1 tick กัน StrictMode/double mount
      setTimeout(() => {
        try {
          if (!containerRef.current) return;
          // ถ้ายังมี widget เก่าค้าง ให้ reset ก่อน
          if (widgetId !== null && window.grecaptcha?.reset) {
            try {
              window.grecaptcha.reset(widgetId);
            } catch {}
            setWidgetId(null);
          }
          const id = window.grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            theme: "dark",
            size: "normal",
            callback: (token: string) => {
              try {
                sessionStorage.setItem("recaptcha", token);
              } catch {}
              onVerified(token);
            },
            "error-callback": () => setErr("ไม่สามารถโหลด ReCAPTCHA ได้"),
            "expired-callback": () =>
              setErr("ReCAPTCHA หมดอายุ โปรดยืนยันอีกครั้ง"),
          });
          setWidgetId(id);
        } catch (e: any) {
          setErr(e?.message || "ReCAPTCHA render ล้มเหลว");
        }
      }, 0);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, siteKey, onVerified, containerKey]); // ไม่ใส่ widgetId ที่นี่เพื่อกัน loop

  // ปิด dialog → reset + ล้าง widgetId (เพื่อให้เปิดครั้งหน้าสร้างใหม่)
  useEffect(() => {
    if (!open && widgetId !== null && window.grecaptcha?.reset) {
      try {
        window.grecaptcha.reset(widgetId);
      } catch {}
      setWidgetId(null);
    }
  }, [open, widgetId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {err && (
          <Typography color="error" className="mb-2">
            {err}
          </Typography>
        )}
        <div
          key={containerKey}
          ref={containerRef}
          style={{ minHeight: 86 }}
          className="flex justify-center items-center my-4"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          ยกเลิก
        </Button>
      </DialogActions>
    </Dialog>
  );
}
