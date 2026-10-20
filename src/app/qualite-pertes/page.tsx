import { ComingSoon } from "@/components/coming-soon";

export default function QualitePertesPage() {
  return (
    <ComingSoon
      title="Qualité et pertes"
      description="Suivi des pertes de production, des non-conformités et des incidents qualité, avec analyse des causes et plan d'action."
      features={[
        "Tableau de bord qualité (taux de perte, non-conformités)",
        "Répartition des pertes par cause et par produit",
        "Suivi des incidents qualité avec gravité et action corrective",
        "Évolution du taux de perte dans le temps",
        "Plan d'action et suivi des mesures correctives",
      ]}
    />
  );
}
