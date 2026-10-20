import { ComingSoon } from "@/components/coming-soon";

export default function HistoriquePage() {
  return (
    <ComingSoon
      title="Historique des rapports"
      description="Recherche et consultation de tous les rapports de production archivés, avec filtres avancés et statuts de validation."
      features={[
        "Recherche par date, produit, équipe, opérateur, statut",
        "Tableau paginé avec tri sur chaque colonne",
        "Vue détaillée d'un rapport au clic",
        "Workflow de validation (valider, rejeter, demander modification)",
        "Export CSV / Excel de la sélection",
      ]}
    />
  );
}
