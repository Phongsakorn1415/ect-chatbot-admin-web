export interface DrawerMenuItem {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  // Optional nested submenu items
  children?: DrawerMenuItem[];
  // Optional click handler or route in future
  onClick?: () => void;
  // href?: string;
  selected?: boolean;
}

export interface PageDrawerProps {
  isOpen: boolean;
  drawerWidth: number;
  items: DrawerMenuItem[];
  showAddButton?: boolean;
  addButtonText?: string;
  onAddButtonClick?: () => void;
}
