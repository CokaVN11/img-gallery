import './App.css';
import all from './assets/data/all.json';
import FileExplorer from './components/FileExplorer';

function App() {
  return <FileExplorer data={all} />;
}

export default App;
