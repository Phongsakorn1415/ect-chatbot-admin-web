export interface DrawerMenuItem {
    id: string;
    title: string;
    // Optional nested submenu items
    children?: DrawerMenuItem[];
    // Optional click handler or route in future
    onClick?: () => void;
    // href?: string;
}

export interface PageDrawerProps {
    isOpen: boolean;
    drawerWidth: number;
    items: DrawerMenuItem[];
}
