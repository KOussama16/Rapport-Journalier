import { ComingSoon } from "@/components/coming-soon";

export default function RapportJournalierPage() {
  return (
    <ComingSoon
      title="Rapport journalier"
      description="Consultation détaillée du rapport de production d'une journée donnée, avec synthèse par équipe, par produit et indicateurs de la journée."
      features={[
        "Sélection de date avec navigation jour par jour",
        "Synthèse globale de la journée (KPIs, production, pertes, arrêts)",
        "Détail par équipe (Matin, Après-midi, Nuit)",
        "Détail par produit avec objectifs et réalisations",
        "Liste des incidents qualité de la journée",
        "Export PDF du rapport journalier",
      ]}
    />
  );
}
