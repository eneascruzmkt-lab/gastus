export async function sendNtfyNotification(
  topic: string,
  title: string,
  message: string
): Promise<boolean> {
  try {
    const res = await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: { Title: title },
      body: message,
    });
    return res.ok;
  } catch {
    return false;
  }
}
