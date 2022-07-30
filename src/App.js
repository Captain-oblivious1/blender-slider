import logo from './logo.svg';
import './App.css';
import BlenderSplitter from './BlenderSplitter';

function App() {

	const clickMe = (e) => {
		// This is to make sure the event stuff I do in the splitter doesn't suppress these events
		console.log("Clicked Me! id="+e.currentTarget.id);
	}

	return (
		<div className="App">
				<p>blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah</p>
			<header className="App-header">
				<BlenderSplitter orientation="column">
					<div id="top" className="blah" percent="40" onClick={clickMe}>
						<p>Click me1!</p>
						<p>This is some text</p>
						<p>to make area larger</p>
					</div>
					<div id="middle" className="blah" percent="25" onClick={clickMe}>
						<p>Click me again!</p>
						<p>This is some text</p>
						<p>to make area larger</p>
					</div>
					<div id="bottom" className="blah" percent="35" onClick={clickMe}>
						<p>Short text!</p>
					</div>
				</BlenderSplitter>
			</header>
		</div>
	);

	return (
		<div className="App">
			<p>blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah</p>
			<button className="ass">My Button</button>
		</div>
	);
}

export default App;
