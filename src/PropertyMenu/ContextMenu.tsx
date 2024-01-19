import React from 'react';
import styles from './ContextMenu.module.scss';
import { menuItems } from './MenuItems';
import MenuItem from './MenuItem';

type PropsType = {
  x: number,
  y: number,
  onClose: () => void,
}

const ContextMenu: React.FC<PropsType> = ({
  x,
  y,
  onClose,
}) => {
  const handleClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
    onClose();
  }

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
  }

  return (
    <div className={styles.wrapper} onClick={handleClick} onPointerDown={handlePointerDown}>
      <div className={styles.contextmenu} style={{ left: x, top: y }}>
        {
          menuItems.map((m) => (
            <MenuItem key={m.name} item={m} x={x} y={y} />
          ))
        }
      </div>
    </div>
  )
}

export default ContextMenu;