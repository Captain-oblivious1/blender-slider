import logo from './logo.svg';
import './App.css';
import BlenderSplitter from './BlenderSplitter';

function App() {
	return (
		<div className="App">
			<header className="App-header">
				<BlenderSplitter orientation="column">
					<div className="blah" percent="40"><p>Click me!</p></div>
					<div className="blah" percent="60"><p>Click me again!</p></div>
				</BlenderSplitter>
			</header>
		</div>
	);
}

export default App;
