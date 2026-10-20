import { LayoutDashboard, FileText, FilePlus as FilePlus2, Factory as History, Package, Boxes, TriangleAlert as AlertTriangle, Wrench, Users, ChartBar as BarChart3, Settings } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/", icon: LayoutDashboard },
  { label: "Rapport journalier", href: "/rapport-journalier", icon: FileText },
  { label: "Nouvelle saisie", href: "/nouvelle-saisie", icon: FilePlus2 },
  { label: "Historique des rapports", href: "/historique", icon: History },
  { label: "Production par produit", href: "/production-par-produit", icon: Package },
  { label: "Matières premières et emballages", href: "/matieres-premieres", icon: Boxes },
  { label: "Qualité et pertes", href: "/qualite-pertes", icon: AlertTriangle },
  { label: "Maintenance et arrêts", href: "/maintenance-arrets", icon: Wrench },
  { label: "Personnel", href: "/personnel", icon: Users },
  { label: "Analyses et statistiques", href: "/analyses-statistiques", icon: BarChart3 },
  { label: "Paramètres", href: "/parametres", icon: Settings },
];
