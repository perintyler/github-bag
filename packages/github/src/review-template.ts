const BARRY_AVATAR_URL = "https://barry.rocks/avatar.png";

export function formatReviewBody(body: string): string {
  return `<p align="center"><img width="56" height="56" alt="Barry" src="${BARRY_AVATAR_URL}" /><br /><sub>review by barry</sub></p>

---

${body}`;
}
