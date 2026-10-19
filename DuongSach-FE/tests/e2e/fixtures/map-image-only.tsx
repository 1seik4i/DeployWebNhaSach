import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { fetchMapHotspotsFromApi, getSharedMapPoints, saveSharedMapPoints } from '../../../src/services/mapService';

function Harness() {
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => { void fetchMapHotspotsFromApi().then(() => setReady(true)); }, []);
  return <>
    <button disabled={!ready} onClick={async () => {
      await saveSharedMapPoints(getSharedMapPoints().map(point => ({ ...point })), '/new-map.png');
      setSaved(true);
    }}>Save image</button>
    <output>{saved ? 'Saved' : 'Pending'}</output>
  </>;
}
createRoot(document.getElementById('root')!).render(<Harness />);
