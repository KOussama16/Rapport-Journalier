import { ComingSoon } from "@/components/coming-soon";

export default function ProductionParProduitPage() {
  return (
    <ComingSoon
      title="Production par produit"
      description="Analyse détaillée de la production pour chaque produit, avec historique, objectifs, taux de réalisation et tendances."
      features={[
        "Sélection d'un produit ou vue comparative de tous les produits",
        "Évolution de la production par produit sur la période",
        "Comparaison objectif vs réalisation par produit",
        "Classement des produits par volume et par taux de réalisation",
        "Filtres par période, équipe et unité de mesure",
      ]}
    />
  );
}
