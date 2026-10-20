import { ComingSoon } from "@/components/coming-soon";

export default function AnalysesStatistiquesPage() {
  return (
    <ComingSoon
      title="Analyses et statistiques"
      description="Analyses approfondies de la production : tendances, corrélations, écarts type, comparaisons inter-périodes et indicateurs avancés."
      features={[
        "Analyse de tendance sur périodes personnalisables",
        "Comparaison entre deux périodes",
        "Calcul d'indicateurs avancés (TRS, taux de perte, productivité)",
        "Corrélation entre arrêts, pertes et production",
        "Rapports statistiques exportables",
      ]}
    />
  );
}
