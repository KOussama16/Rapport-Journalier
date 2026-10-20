import { ComingSoon } from "@/components/coming-soon";

export default function PersonnelPage() {
  return (
    <ComingSoon
      title="Personnel"
      description="Gestion des équipes de production, planning des shifts et suivi des opérateurs."
      features={[
        "Annuaire des opérateurs et affectations",
        "Planning des équipes (Matin, Après-midi, Nuit)",
        "Suivi des présences et absences",
        "Rapports saisis par opérateur",
        "Gestion des postes et qualifications",
      ]}
    />
  );
}
