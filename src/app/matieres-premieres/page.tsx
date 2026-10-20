import { ComingSoon } from "@/components/coming-soon";

export default function MatieresPremieresPage() {
  return (
    <ComingSoon
      title="Matières premières et emballages"
      description="Suivi des consommations de matières premières et emballages liées à la production, avec stock et écarts."
      features={[
        "Inventaire des matières premières et emballages",
        "Consommation par produit et par jour",
        "Comparaison consommation théorique vs réelle",
        "Alertes de stock bas",
        "Lien avec les fiches techniques produits",
      ]}
    />
  );
}
