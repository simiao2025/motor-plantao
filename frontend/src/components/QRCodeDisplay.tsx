"use client";

import { useEffect, useState } from "react";
import { pharmacyApi } from "@/services/api";
import { Loader2, RefreshCw, CheckCircle2 } from "lucide-react";

export default function QRCodeDisplay() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");

  const fetchQRCode = async () => {
    setLoading(true);
    try {
      const data = await pharmacyApi.getQRCode();
      if (data.base64) {
        setQrCode(data.base64);
      }
    } catch (err) {
      console.error("Erro ao buscar QR Code", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRCode();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="relative w-64 h-64 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden group">
        {loading ? (
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        ) : qrCode ? (
          <img src={qrCode} alt="WhatsApp QR Code" className="w-full h-full p-4" />
        ) : (
          <div className="text-center p-4">
            <p className="text-sm text-slate-500">Erro ao carregar QR Code</p>
          </div>
        )}
        
        {/* Scan animation overlay */}
        {!loading && qrCode && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-[2px] bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-scan"></div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={fetchQRCode}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
        <div className="px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-bold flex items-center gap-2">
          {status === "connected" ? (
            <><CheckCircle2 className="w-4 h-4" /> CONECTADO</>
          ) : (
            "AGUARDANDO LEITURA..."
          )}
        </div>
      </div>
    </div>
  );
}
