import './App.css';
import file12A18 from './assets/data/drive_structure_12A18.json';
import all from './assets/data/all.json';
import { useEffect, useState } from 'react';
import FileExplorer from './components/FileExplorer';

function App() {
  return <FileExplorer data={all} />;
}

export default App;
