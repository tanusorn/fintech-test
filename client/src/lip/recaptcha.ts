const widgets = new Map<string, number>();

export function loadReCaptcha(
  siteKey: string,
  containerId: string,
  onToken: (token: string) => void
) {
  const interval = setInterval(() => {
    // @ts-ignore
    if (window.grecaptcha && window.grecaptcha.render) {
      clearInterval(interval);
      const el = document.getElementById(containerId);
      if (!el) return;

      // @ts-ignore
      const gre = window.grecaptcha;

      if (widgets.has(containerId)) {
        const id = widgets.get(containerId)!;
        gre.reset(id);
      } else {
        const id = gre.render(containerId, {
          sitekey: siteKey,
          callback: (token: string) => {
            sessionStorage.setItem("recaptcha", token);
            onToken(token);
          },
        });
        widgets.set(containerId, id);
      }
    }
  }, 300);
}
