"use client";

import { useEffect, useRef } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintableReport } from "@/components/printable-report";
import type { PrintableReportData } from "@/lib/print-report-types";

interface PrintPreviewModalProps {
  data: PrintableReportData | null;
  onClose: () => void;
}

export function PrintPreviewModal({ data, onClose }: PrintPreviewModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [data]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && data) onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [data, onClose]);

  if (!data) return null;

  function handlePrint() {
    window.print();
  }

  return (
    <div
      ref={scrollRef}
      className="print-report-root print-preview-mode"
      role="dialog"
      aria-modal="true"
      aria-label="Aperçu du rapport avant impression"
    >
      {/* Barre d'outils — masquée à l'impression via visibility:hidden hérité puis visible:false ici */}
      <div className="print-toolbar no-print" style={{ display: "flex" }}>
        <div className="print-toolbar-info">
          <Printer className="h-4 w-4" />
          <span>Aperçu du rapport — format A4</span>
        </div>
        <div className="print-toolbar-actions">
          <Button variant="secondary" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Imprimer / Exporter PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" /> Fermer
          </Button>
        </div>
      </div>

      <PrintableReport data={data} />
    </div>
  );
}
