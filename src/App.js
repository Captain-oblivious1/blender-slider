import logo from './logo.svg';
import './App.css';
import BlenderSplitter from './BlenderSplitter';

function App() {

	const clickMe = (e) => {
		// This is to make sure the event stuff I do in the splitter doesn't suppress these events
		console.log("Clicked Me! id="+e.currentTarget.id);
	}

	//        40
	//     ┌─────────┐
	//     │   one   │
	//     │         │
	//   30├───┬─────┤
	//     │   │     │
	//     │two│three│
	//     │   │     │
	//   70├───┴─────┤
	//     │  four   │
	//     │         │
	//     └─────────┘


	const layout1 = {
		areTopLevelSplittersVertical: false,

		content: "one"
	};

	const layout3 = {
		areTopLevelSplittersVertical: true,

		content: [
			"one",
			20,
			"two",
			70,
			"three"
		]
	};

	const layout4 = {
		areTopLevelSplittersVertical: false,

		content: [
			[
				"one",
				50,
				"three"
			],
			20,
			"two"
		]
	};

	const layout = {
		areTopLevelSplittersVertical: false,

		content: [
			"one",
			20,
			[
				"four",
				20,
				[
					"three",
					30,
					"one"
				],
				40,
				[
					"one",
					30,
					"three"
				],
				70,
				"two",
			],
			80,
			"four"
		]
	};

	return (
		<div className="App">
				<p>blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah</p>
			<header className="App-header">
				<BlenderSplitter layout={layout}>
					<div id="one" className="blah" onClick={clickMe}>
						<p>Click me1!</p>
						<p>One</p>
						<p>to make area really large</p>
					</div>
					<div id="two" className="blah" onClick={clickMe}>
						<p>Click me again!</p>
						<p>Two</p>
						<p>to make area larger</p>
					</div>
					<div id="three" className="blah" onClick={clickMe}>
						<p>Click me again!</p>
						<p>Three</p>
						<p>to make area larger</p>
					</div>
					<div id="four" className="blah" onClick={clickMe}>
						<p>Four</p>
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
