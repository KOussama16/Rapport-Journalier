import { ComingSoon } from "@/components/coming-soon";

export default function ParametresPage() {
  return (
    <ComingSoon
      title="Paramètres"
      description="Configuration de l'application : produits, objectifs, équipes, unités de mesure et préférences d'affichage."
      features={[
        "Gestion du catalogue produits (ajout, modification, désactivation)",
        "Définition des objectifs de production par produit",
        "Configuration des équipes et shifts",
        "Gestion des unités de mesure",
        "Préférences d'affichage et thème",
      ]}
    />
  );
}
