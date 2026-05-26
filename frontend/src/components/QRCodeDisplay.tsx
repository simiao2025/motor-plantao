"use client";

import { useEffect, useState } from "react";
import { pharmacyApi } from "@/services/api";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

interface QRCodeDisplayProps {
  instanceName?: string;
  onConnected?: () => void;
}

export default function QRCodeDisplay({ instanceName, onConnected }: QRCodeDisplayProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [error, setError] = useState<string | null>(null);

  const fetchQRCode = async () => {
    if (!instanceName) return;
    setLoading(true);
    setError(null);
    try {
      const data = await pharmacyApi.getQRCode(instanceName);
      if (data.base64) {
        setQrCode(data.base64);
      } else if (data.status === "error") {
        setError(data.message || "Erro na Evolution API ao obter QR Code.");
      } else {
        setError("Não foi possível gerar o código QR.");
      }
    } catch (err: any) {
      console.error("Erro ao buscar QR Code", err);
      setError(err.message || "Falha de rede ao buscar QR Code.");
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!instanceName) return;
    try {
      const res = await pharmacyApi.getInstanceStatus(instanceName);
      const state = res?.instance?.state || res?.state;
      if (state === "open" || state === "connected") {
        setStatus("connected");
        if (onConnected) onConnected();
      } else {
        setStatus("disconnected");
      }
    } catch (err) {
      console.error("Erro ao verificar status do WhatsApp", err);
    }
  };

  // Carrega QR Code inicial
  useEffect(() => {
    if (instanceName) {
      fetchQRCode();
      checkStatus();
    }
  }, [instanceName]);

  // Polling de status a cada 5 segundos enquanto desconectado
  useEffect(() => {
    if (!instanceName || status === "connected") return;

    const interval = setInterval(() => {
      checkStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [instanceName, status]);

  if (!instanceName) {
    return (
      <div className="text-center p-6 text-slate-400 bg-white/5 rounded-2xl border border-white/10">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-sm">Carregando dados da instância WhatsApp...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="relative w-64 h-64 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden group">
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <span className="text-xs text-slate-500">Gerando QR Code...</span>
          </div>
        ) : error ? (
          <div className="text-center p-4">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">{error}</p>
          </div>
        ) : qrCode ? (
          <img src={qrCode} alt="WhatsApp QR Code" className="w-full h-full p-4 object-contain" />
        ) : (
          <div className="text-center p-4">
            <p className="text-sm text-slate-500">Nenhum QR Code gerado</p>
          </div>
        )}

        {/* Scan animation overlay */}
        {!loading && qrCode && status !== "connected" && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-[2px] bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-scan"></div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={fetchQRCode}
          disabled={loading}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 transition-all disabled:opacity-50"
          title="Recarregar QR Code"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
        <div
          className={`px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 border transition-all ${
            status === "connected"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-amber-500/10 border-amber-500/20 text-amber-500"
          }`}
        >
          {status === "connected" ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> CONECTADO
            </>
          ) : (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> AGUARDANDO LEITURA...
            </>
          )}
        </div>
      </div>
      
      <p className="text-xs text-slate-500 text-center max-w-xs">
        Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e escaneie o código acima.
      </p>
    </div>
  );
}
