import { ComingSoon } from "@/components/coming-soon";

export default function MaintenanceArretsPage() {
  return (
    <ComingSoon
      title="Maintenance et arrêts"
      description="Suivi des arrêts de production et de la maintenance, avec analyse des motifs, durées et impact sur la production."
      features={[
        "Registre des arrêts de production par motif et par ligne",
        "Suivi de la maintenance préventive et corrective",
        "Calcul du TRS (Taux de Rendement Synthétique)",
        "Évolution des temps d'arrêt dans le temps",
        "Planification des interventions de maintenance",
      ]}
    />
  );
}
