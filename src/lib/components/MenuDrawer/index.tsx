import { PageDrawerProps } from "@/lib/types/PageDrawer";
import { Collapse, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import React from 'react'
import AddIcon from '@mui/icons-material/Add';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

// Page-scoped permanent drawer that reserves space within the page layout (not overlaying the global MainDrawer)
const MenuDrawer: React.FC<PageDrawerProps> = ({ isOpen, drawerWidth, items }) => {
  const width = isOpen ? drawerWidth : 0;

  // Track which parent items are expanded
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({});

  const toggleOpen = (id: string) => {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Drawer
      variant="permanent"
      open
      sx={{
        width,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        overflowX: 'hidden',
        transition: (theme) => theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.standard,
        }),
        '& .MuiDrawer-paper': {
          position: 'relative',
          width,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
          borderRight: width === 0 ? 'none' : undefined,
        },
      }}
    >
      <Typography variant="h6" sx={{ p: 2 }}>หลักสูตรทั้งหมด</Typography>
      <List>
        {items.map((item) => {
          const hasChildren = Array.isArray(item.children) && item.children.length > 0;
          const isExpanded = !!openMap[item.id];
          return (
            <React.Fragment key={item.id}>
              <ListItem disablePadding>
                <ListItemButton onClick={item.onClick}>
                  <ListItemText primary={item.title} />
                  {hasChildren ? (
                    <ListItemIcon
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOpen(item.id);
                      }}
                      sx={{ minWidth: 36, cursor: 'pointer' }}
                    >
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </ListItemIcon>
                  ) : null}
                </ListItemButton>
              </ListItem>
              {hasChildren && (
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children!.map((child) => (
                      <ListItem key={child.id} disablePadding sx={{ pl: 4 }}>
                        <ListItemButton onClick={child.onClick}>
                          <ListItemText primary={child.title} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          );
        })}
        <ListItem>
          <ListItemButton sx={{bgcolor: 'lightgray', borderRadius: '10px', '&:hover': {bgcolor: 'gray'}}}>
            <ListItemIcon><AddIcon /></ListItemIcon>
            <ListItemText primary="เพิ่มหลักสูตรใหม่" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  )
}

export default MenuDrawer
