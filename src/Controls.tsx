import React from 'react';
import Draggable from './Draggable';
import styles from './Controls.module.scss';
import { useStores } from './State/store';
import { observer } from 'mobx-react-lite';
import { CullMode } from './State/types';

const Controls: React.FC = observer(() => {
  const { graph } = useStores();

  type SizeInfo = { x: number, y: number };

  const [position, setPosition] = React.useState<SizeInfo>({ x: 100, y: 100 });

  const handleMove = (x: number, y: number) => {
    setPosition((prev) => ({ x, y }));
  }

  React.useEffect(() => {
    const positionItem = localStorage.getItem('controls')

    if (positionItem) {
      const pos = JSON.parse(positionItem);
      setPosition(pos);
    }

  }, []);

  React.useEffect(() => {
    const timer  = setInterval(() => {
      localStorage.setItem('controls', JSON.stringify(position))
    }, 5000)

    return () => {
      clearInterval(timer);
    }
  }, [position]);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    graph.setTransparency(event.target.checked)
  }

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
  }

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
  }

  const handleCullChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    console.log(event.target.value)
    graph.setCullMode(event.target.value as CullMode)
  }

  return (
    <Draggable onMove={handleMove} position={position} >
      <div className={styles.wrapper}  onClick={handleClick}>
        <div>Controls</div>
        <div className={styles.controls}>
          <label>
            <input
              type="checkbox"
              checked={graph.transparent}
              onChange={handleChange}
              onPointerDown={handlePointerDown}
              onKeyDown={handleKeyDown}
            />
            Transparent
          </label>
          <label>
            Cull Mode
            <select value={graph.cullMode} onChange={handleCullChange}>
              <option value="none">None</option>
              <option value="back">Back</option>
              <option value="front">Front</option>
            </select>
          </label>
        </div>
      </div>
    </Draggable>
  )
})

export default Controls;
