import { PageDrawerProps } from "@/lib/types/PageDrawer";
import { Box, Collapse, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Tooltip } from "@mui/material";
import React from 'react'
import AddIcon from '@mui/icons-material/Add';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import PublicOffIcon from '@mui/icons-material/PublicOff';
import PublicIcon from '@mui/icons-material/Public';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import useBreakPointResolution from '@/lib/services/BreakPointResolusion';
import Divider from '@mui/material/Divider';

import { useRouter } from 'next/navigation';

// Page-scoped drawer: overlays on mobile/tablet; reserves space on desktop
const MenuDrawer: React.FC<PageDrawerProps> = ({ isOpen, drawerWidth, items, showAddButton = false, addButtonText, onAddButtonClick }) => {
  const router = useRouter();
  const { isMobile, isTablet } = useBreakPointResolution();
  const isOverlay = isMobile || isTablet;
  const width = drawerWidth;

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
        width: isOverlay ? 0 : (isOpen ? width : 0),
        flexShrink: 0,
        whiteSpace: 'nowrap',
        overflow: isOverlay ? 'visible' : 'hidden',
        position: 'relative',
        transition: isOverlay
          ? undefined
          : (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
        '& .MuiDrawer-paper': {
          position: isOverlay ? 'absolute' : 'relative',
          left: 0,
          top: 0,
          height: '100%',
          width: width,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          willChange: isOverlay ? 'transform' : undefined,
          transform: isOverlay ? `translateX(${isOpen ? 0 : -width}px)` : 'none',
          transition: isOverlay
            ? (theme) => theme.transitions.create('transform', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            })
            : (theme) => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
          zIndex: (theme) => (isOverlay ? theme.zIndex.drawer : 'auto'),
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
                  {/* {
                    item.status && (
                      <ListItemIcon>
                        {item.status === 'PUBLISHED' ? <PublicIcon color="success" /> : <PublicOffIcon color="disabled" />}
                      </ListItemIcon>
                    )
                  } */}
                  <ListItemText primary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                      {item.status && (
                        <Tooltip title={item.status === 'PUBLISHED' ? 'เผยแพร่แล้ว' : 'ยังไม่เผยแพร่'} placement="top">
                          {item.status === 'PUBLISHED' ? (
                            <PublicIcon color="success" sx={{ ml: 1, verticalAlign: 'middle', fontSize: '1.5rem', mr: 1 }} />
                          ) : (
                            <PublicOffIcon color="disabled" sx={{ ml: 1, verticalAlign: 'middle', fontSize: '1.5rem', mr: 1 }} />
                          )}
                        </Tooltip>
                      )}
                      {item.title}
                    </Box>
                  } />
                  {hasChildren ? (
                    <ListItemIcon
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOpen(item.id);
                      }}
                      sx={{ minWidth: 36, cursor: 'pointer' }}
                    >
                      <Tooltip title={isExpanded ? 'ย่อ' : 'ขยาย'}>
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </Tooltip>
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
        {showAddButton && (
          <ListItem>
            <ListItemButton sx={{ bgcolor: 'lightgray', borderRadius: '10px', '&:hover': { bgcolor: 'gray' } }} onClick={onAddButtonClick}>
              <ListItemIcon><AddIcon /></ListItemIcon>
              <ListItemText primary={addButtonText} />
            </ListItemButton>
          </ListItem>
        )}
      </List>
      <Divider />
      <Typography variant="h6" sx={{ pt: 2, pl: 2 }}>อื่น ๆ</Typography>
      <List>
        <ListItem>
          <ListItemButton onClick={() => router.push('/admin/courses/late-fee')}>
            <ListItemIcon sx={{ minWidth: 40 }}><WatchLaterIcon /></ListItemIcon>
            <ListItemText primary="ค่าปรับลงทะเบียนช้า" sx={{ textAlign: 'left' }} />      </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  )
}

export default MenuDrawer
