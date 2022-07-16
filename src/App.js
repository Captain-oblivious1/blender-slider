import logo from './logo.svg';
import './App.css';
import BlenderSplitter from './BlenderSplitter';

function App() {
	return (
		<div className="App">
			<header className="App-header">
				<BlenderSplitter>
					<button>Click me again!</button>
					<button>Click me yet again!</button>
				</BlenderSplitter>
			</header>
		</div>
	);
}

export default App;
