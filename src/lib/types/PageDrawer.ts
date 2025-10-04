interface DrawerMenuItem {
    id: string;
    title: string;
    onClick: () => void;
}

export interface PageDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onTransitionEnd: () => void;
    items: DrawerMenuItem[];
}
