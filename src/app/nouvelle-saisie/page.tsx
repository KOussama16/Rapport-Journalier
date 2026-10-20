import { ComingSoon } from "@/components/coming-soon";

export default function NouvelleSaisiePage() {
  return (
    <ComingSoon
      title="Nouvelle saisie"
      description="Formulaire complet de saisie d'un rapport de production pour une équipe : produits, quantités réalisées, objectifs, pertes, arrêts et incidents qualité."
      features={[
        "Sélection de la date et de l'équipe (Matin / Après-midi / Nuit)",
        "Saisie des quantités produites par produit avec unité automatique",
        "Saisie des objectifs par produit",
        "Enregistrement des pertes par produit avec cause associée",
        "Saisie des arrêts de production (motif, durée, heure de début/fin)",
        "Déclaration des incidents qualité (type, description, action corrective)",
        "Validation ou enregistrement en brouillon",
      ]}
    />
  );
}
