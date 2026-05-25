import { NextResponse } from "next/server";

export async function POST() {
  // Rota temporária apenas para absorver os webhooks antigos da Evolution API 
  // e parar de gerar erro 404 no console do Next.js.
  // Em produção, os webhooks vão para o Backend Python na porta 8000.
  return NextResponse.json({ status: "ignored", message: "Webhook redirecionado com sucesso." });
}
