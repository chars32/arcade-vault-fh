"use server";

// ===== app/acerca-de/actions.ts — Server Action de contacto =====
// Envía el formulario de "Acerca de" (references/templates/home-about/about.jsx)
// como un correo real vía Resend.

import { Resend } from "resend";

export type ContactFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CONTACT_FROM = "onboarding@resend.dev";
const CONTACT_TO = "chars24@gmail.com";

export async function sendContactMessage(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const msg = String(formData.get("msg") ?? "").trim();

  if (!name || !email || !msg) {
    return { status: "error", message: "Todos los campos son obligatorios." };
  }
  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "El correo electrónico no es válido." };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      subject: `Nuevo mensaje de contacto — ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${msg}`,
    });

    if (error) {
      return {
        status: "error",
        message: "No se pudo enviar tu mensaje. Intenta de nuevo.",
      };
    }

    return { status: "success" };
  } catch {
    return {
      status: "error",
      message: "No se pudo enviar tu mensaje. Intenta de nuevo.",
    };
  }
}
