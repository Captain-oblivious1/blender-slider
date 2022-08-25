import {useState} from 'react';

const BlenderSplitter = ( {children, layout} ) => {

	// useState for the layout.  This represents how sub-panes are divided and
	// whatnot
	const [layoutState, setLayoutState] = useState(layout);

	// Used to lookup child by name
	const childMap = {};
	children.forEach( e => childMap[ e.props.id ] = e );

	// Each state has a StateEnum called "stateEnum" along with whatever
	// data is needed for that state.  The following are the possible values
	// for the enum.
	const StateEnum = {
		None: "None",
		ElgibleToMove: "ElgibleToMove", // The cursor is over a split which is eligible to move
		AboutToMove: "AboutToMove",     // User pressed mouse button and is about to drag
		Moving: "Moving",               // User is dragging with mouse pressed
		ElgibleToCopy: "ElgibleToCopy", // Cursor is over a split and ctrl is pressed
		AboutToCopy: "AboutToCopy",     // User has pressed mouse button with ctrl and is about to drag
	}

	// useState for storing state information
	const [state, setState] = useState( { //Initial state set to "none"
		stateEnum: StateEnum.None,
	} );

	// Function for converting from pixels to percent (within this container).
	// Everything within this component is in a percent coordinate system
	const eventToPercentVector = e => {
		const rect = e.currentTarget.getBoundingClientRect();
		return {
			x: (e.clientX-rect.left)/(rect.right-rect.left) * 100,
			y: (e.clientY-rect.top)/(rect.bottom-rect.top) * 100 };
	}

	// The margin that is close enough to a split to be considered "on" the split.
	// This is within percent (not pixels).
	const reshapeMargin = 1;

	// Function that finds the nearest split(s) to a given vector (mouse pointer location).  This 
	// method returns an array of arrays.  The outer array is the number of "matches" and each sub-array
	// represents a "match".  So for example, if the pointer is not near any split, then this will return
	// an empty array.  If it matches 3 splits (like the pointer is near a T-junction), then the outer array
	// will contain 3 sub-arrays.  Each sub-array represents a matching split.  So for example, the
	// following example layout code:
	//
	// const layout = {
	//   areTopLevelSplittersVertical: false,

	//   content: [
	//     "one",
	//     20,
	//     [ "two", 40, "three" ],
	//     70,
	//     "four"
	//   ]
	// };
	//
	// Would produce this layout of components (the 40, 20, and 70 represent what percent the splits are.
	// They would not be displayed):
	//
	//        40
	//     ┌─────────┐
	//     │   one   │
	//     │         │
	//   20├───┬─────┤
	//     │   │     │
	//     │two│three│
	//     │   │     │
	//   70├───┴─────┤
	//     │  four   │
	//     │         │
	//     └─────────┘
	//
	// The array identifier for the horizontal 20% split would be [1].  As it is element 1 of the content array.
	// The 70% split would be [3].  Since the vertical 40% split is nested within element 2, it's identifier
	// would be [2,1].  Though the outer edges are not specified in the array, they are still identified by this
	// function.  So for example, the horizontal line above "one" would be [-1].  The horizontal line below
	// "four" would be [5], the short vertical line to the left of two would be [2,-1], and the short vertical
	// line to the right of three would be [2,3].
	//
	// The "shallow" parameter tells this function how "deep" to look.  The meat of this function is recursive.
	// If shallow was true, then this method would return a split as soon as it finds one.  It would not
	// recursively call itself on the bordering subcomponents.  If shallow were true, it would.  So for example,
	// imagine the mouse were on the split right above the "r" in "four".  If shallow were true, then this
	// function would return [[3]] (a single match of split [3]).  This is invoked when moving splits as one
	// would only needs to move split [3].  If shallow were false, then it would return: [[2,2,1],[3]].  This
	// is invoked when copying splits.  If the user were to select that point and copy up, it would copy split
	// [2,2,1].  If they were to copy down, it would copy split [3].
	const findNearestSplit = (percentVector,shallow) => {
		return findNearestSplitRecursive(percentVector,layoutState.content,{x:reshapeMargin,y:reshapeMargin},layoutState.areTopLevelSplittersVertical,shallow);
	}

	// This is the recursive method that does the work for the method above.
	const findNearestSplitRecursive = (percentVector,content,margin,isCurrentSplitterVertical,shallow) => {
		var valToTest;
		var marginToTest;
		if( isCurrentSplitterVertical ) {
			valToTest = percentVector.x;
			marginToTest = margin.x;
		} else {
			valToTest = percentVector.y;
			marginToTest = margin.y;
		}

		const isArray = Array.isArray(content);
		const length = isArray ? content.length : null;

		var foundIndex;
		var childCandidateIndices;
		if( testWithinMargin( valToTest, 0, marginToTest ) ) { // is at min edge
			foundIndex = -1;
			childCandidateIndices = isArray ? [ 0 ] : null;
		} else if( testWithinMargin( valToTest, 100, marginToTest ) ) { // is at max edge
			if( isArray ) {
				foundIndex = length;
				childCandidateIndices = [ length-1 ];
			} else {
				foundIndex = 1;
				childCandidateIndices = null;
			}
		} else { // is somewhere between
			if( isArray ) {
				const searchResult = binarySearch(content,valToTest,marginToTest);
				if( searchResult%2==0 ) {
					// If it was a component and not a split
					foundIndex = null;
					childCandidateIndices = [ searchResult ];
				} else {
					// If it was a split
					foundIndex = searchResult;
					childCandidateIndices = [ foundIndex-1, foundIndex+1 ];
				}
			} else {
				foundIndex = null;
				childCandidateIndices = null;
			}
		}

		var returnMe = [];
		if( shallow && foundIndex!=null ) {
			returnMe.push([foundIndex]);
		} else {
			if( isArray ) {
				childCandidateIndices.forEach( childIndex => {
					const minValue = childIndex===0 ? 0 : content[childIndex-1];
					const maxValue = childIndex===length-1 ? length-1 : content[childIndex+1];

					var subPercentVector = convertVector(minValue,maxValue,isCurrentSplitterVertical,percentVector);
					var subMargin = convertMargin(minValue,maxValue,isCurrentSplitterVertical,margin);

					var recurseArray = findNearestSplitRecursive(subPercentVector,content[childIndex],subMargin,!isCurrentSplitterVertical,shallow);
					if( recurseArray.length>0 ) {
						recurseArray.forEach( subArray => {
							var myArray = [childIndex];
							myArray = myArray.concat(subArray);
							returnMe.push(myArray);
						});
					} else {
						if( foundIndex!==null ) {
							returnMe.push([foundIndex]);
						}
					}
				});
			} else {
				if( foundIndex!==null ) {
					returnMe.push([foundIndex]);
				}
			}
		}

		return returnMe;
	}

	// Simply tests is a value is within a given margin
	const testWithinMargin = (one, two, margin) => Math.abs(one - two) <= margin;

	// Performs a binary search within a context array.  For a point to be only
	// a split, it must be within the reshapeMargin (either wide).  Otherwise,
	// this function returns the index of the component that the point resides
	// within. This function is not recursive nor knows anything about nested
	// arrays.  It only knows about whatever array it is passed.  This call would
	// be invoked again on a sub-array if necessary.  It is not passed a point
	// (x,y), but just a single value (x or y).
	const binarySearch = (content,testForMe,margin) => {

		var minIndex = -1;
		var maxIndex = content.length;
		var foundIndex = null;
		var currentIndex;

		while(minIndex+2<maxIndex) {
			currentIndex = (minIndex+maxIndex)/2;
			if( currentIndex%2===0 ) {
				currentIndex--;
			}
			const currentValue = content[currentIndex];
			if( testWithinMargin( currentValue, testForMe, margin ) ) {
				foundIndex = currentIndex;
				break;
			} else if( testForMe > currentValue ) {
				minIndex = currentIndex;
			} else {
				maxIndex = currentIndex;
			}
		}

		if (foundIndex===null) {
			foundIndex = minIndex+1;
		}

		return foundIndex;
	}

	// At the top container level, 0% is the top/left corner and 100%
	// is on the bottom/right corner.  When recursively calculating for
	// nested components, the vector is converted to a percentage
	// coordinate that corresponds to child components.  For example,
	// in the layout below:
	//     ┌─────────┐
	//     │   one   │
	//     ├───┬─────┤
	//     │   │+    │
	//     │two│three│
	//     │   │     │
	//     └───┴─────┘
	// The point marked by "+" may about (50%,50%) in relation to
	// the outer most container, but only at (10%,20%) in relation to
	// child component "three".
	const convertVector = (minValue,maxValue,isVertical,vector) => {
		const convFunction = val => 100*(val-minValue)/(maxValue-minValue);
		var subVector;
		if( isVertical ) {
			subVector = {
				x: convFunction(vector.x),
				y: vector.y
			};
		} else {
			subVector = {
				x: vector.x,
				y: convFunction(vector.y)
			};
		}
		return subVector;
	}

	// Similarly, margins change for child components too.  If 1% corresponds
	// to 10 pixels overall. Yet 10 pixels may be 1.3% for component three below.
	//     ┌─────────┐
	//     │   one   │
	//     ├───┬─────┤
	//     │   │     │
	//     │two│three│
	//     │   │     │
	//     └───┴─────┘
	// We don't want the margins getting smaller as people hover over nested
	// components and splits.
	const convertMargin = (minValue,maxValue,isVertical,margin) => {
		const marginFunction = val => val*100/(maxValue-minValue);
		var subMargin;
		if( isVertical ) {
			subMargin = {
				x: marginFunction(margin.x),
				y: margin.y
			};
		} else {
			subMargin = {
				x: margin.x,
				y: marginFunction(margin.y)
			};
		}
		return subMargin;
	}

	// Just for debug printing.
	const arrayToStringRecursive = (a,str) => {
		if( Array.isArray(a) ) {
			str = str.concat("[");
			var first = true;
			a.forEach( e => {
				if( first ) {
					first = false;
				} else {
					str = str.concat(",");
				}
				str = arrayToStringRecursive(e,str);
			});
			str = str.concat("]");
		} else {
			str = str.concat(a);
		}
		//console.log("about to return str="+str);
		return str;
	}

	// Just for debug printing.
	const arrayToString = (a) => {
		return arrayToStringRecursive(a,"");
	}

	// Just for debug printing.
	const printArray = (label,a) => {
		console.log(`${label}=${arrayToString(a)}`);
	}

	// Just for debug printing.
	const pointToString = (p) => `(${p.x},${p.y})`;

	// Convenience function for determining if state is one of the copy states.
	const isCopyState = stateEnum =>
		stateEnum===StateEnum.ElgibleToCopy
		|| stateEnum===StateEnum.AboutToCopy

	// Convenience function for setting state to None
	const setToNoneState = () => {
		setState( {
			stateEnum: StateEnum.None
		} );
	}

	// Convenience function for setting state to EligibleToMove.
	const setToElgibleToMoveState = (split) => {
		setState( {
			stateEnum: StateEnum.ElgibleToMove,
			split: split
		} );
	}

	// Convenience function for setting state to AboutToMove
	const setToAboutToMoveState = (split,pressSplitLocation,pressMouseLocation) => {
		setState( {
			stateEnum: StateEnum.AboutToMove,
			split: split,
			pressSplitLocation: pressSplitLocation,
			pressMouseLocation: pressMouseLocation
		} );
	}

	// Convenience function for setting state to Moving
	const setToMovingState = (split,pressSplitLocation,pressMouseLocation,currentMouseLocation) => {
		setState( {
			stateEnum: StateEnum.Moving,
			split: split,
			pressSplitLocation: pressSplitLocation,
			pressMouseLocation: pressMouseLocation,
			currentMouseLocation: currentMouseLocation
		} );
	}

	// Convenience function for setting state to EligibleToCopy
	const setToElgibleToCopyState = (split) => {
		setState( {
			stateEnum: StateEnum.ElgibleToCopy,
			split: split
		} );
	}

	// Convenience function for setting state to AboutToCopy
	const setToAboutToCopyState = (splits,pressLocation) => {
		setState( {
			stateEnum: StateEnum.AboutToCopy,
			splits: splits,
			pressLocation: pressLocation
		} );
	}

	// Function that evaluates the state of the mouse cursor, ctrl button, and mouse
	// button to determine what state this should be in.
	const determineState = (e) => {
		const stateEnum = state.stateEnum;
		const percent = eventToPercentVector(e);
		const nearSplit = findNearestSplit(percent,!isCopyState(stateEnum));
		const length = nearSplit.length;

		const isPressedNow = e.buttons &= 1;
		if( isPressedNow ) {
			if( stateEnum===StateEnum.None
					|| stateEnum===StateEnum.ElgibleToCopy
					|| stateEnum===StateEnum.ElgibleToMove ) {
				if(e.ctrlKey) {
					if( length>0 && length<3 ) {
						const nearSplits = findNearestSplit(percent,false);
						setToAboutToCopyState(nearSplits,percent);
					}
				} else {
					if( length>0 ) {
						setToAboutToMoveState(nearSplit,getSplitLocation(nearSplit[0]),percent);
					}
				}
			} else if( stateEnum===StateEnum.AboutToCopy ) {
				const nearSplits = findNearestSplit(percent,false);
				if( JSON.stringify(nearSplits) !== JSON.stringify(state.splits) ) {
					const isVertical = state.splits[0].length%2 === 1 ? layoutState.areTopLevelSplittersVertical : !layoutState.areTopLevelSplittersVertical;
					var chosenIndex;
					var loc;
					if( isVertical ) {
						chosenIndex = percent.x < state.pressLocation.x ? 0 : 1;
						loc = percent.x;
					} else {
						chosenIndex = percent.y < state.pressLocation.y ? 0 : 1;
						loc = percent.y;
					}
					var chosenSplit;
					if(state.splits.length===1) {
						// Left most split will only have 1 element but we want to treat it as the right/bottom most.
						chosenSplit = state.splits[0];
					} else {
						chosenSplit = state.splits[chosenIndex];
					}
					insertSplit( chosenSplit, loc, chosenIndex===1 );
					if(chosenIndex===1) {
						chosenSplit[ chosenSplit.length-1 ]+=2;
					}
					setToMovingState(chosenSplit,loc,percent,percent);
				}

			} else if( stateEnum===StateEnum.AboutToMove ) {
				if( JSON.stringify(nearSplit) !== JSON.stringify(state.nearSplit) ) {
					setToMovingState(state.split[0],state.pressSplitLocation,state.pressMouseLocation,percent);
				}
			} else if( stateEnum===StateEnum.Moving ) {
				setToMovingState(state.split,state.pressSplitLocation,state.pressMouseLocation,percent);
			}
		} else if(e.ctrlKey) {
			if( length>0 && length<3 ) {
				setToElgibleToCopyState(nearSplit);
			} else {
				setToNoneState();
			}
		} else if( length===0 ) {
			setToNoneState();
		} else {
			setToElgibleToMoveState(nearSplit);
		}
	}

	// Draws cursor based on current state
	const updateCursor = e => {
		const target = e.currentTarget;
		var cursorToUse;
		if( state.stateEnum===StateEnum.ElgibleToMove ) {
			var isVertical;

			if( layoutState.areTopLevelSplittersVertical ) {
				isVertical = true;
			} else {
				isVertical = false;
			}

			if( state.split[0].length%2 === 0 ) {
				isVertical = !isVertical;
			}

			if( isVertical ) {
				cursorToUse = "col-resize";
			} else {
				cursorToUse = "row-resize";
			}
		} else if( state.stateEnum===StateEnum.ElgibleToCopy ) {
			cursorToUse = "copy";
		} else {
			cursorToUse = "default";
		}
		target.style.cursor = cursorToUse;
	}

	// Generic function for deep copying the content array.  Used when
	// changing the content.
	const deepContentCopy = (content) => {
		if(Array.isArray(content)) {
			var ret=[];
			content.forEach( element => { ret.push( deepContentCopy(element) ); } );
			return ret;
		} else {
			return content;
		}
	}

	// Method for getting split location percentage.  The split parameter is
	// an array identifier (like [1,2,3]) and it's location percentage is returned.
	const getSplitLocation = split => {
		var current = layoutState.content;
		split.forEach( element => {
			current = current[element];
		} );
		return current;
	}

	// Method for setting split location percentage.  The split parameter is
	// an array identifier (like [1,2,3]) and the loc is a percentage (0-100)
	const setSplitLocation = (split,loc) => {
		var copy = deepContentCopy(layoutState.content);
		var copyLayoutState = {
			areTopLevelSplittersVertical: layoutState.areTopLevelSplittersVertical,
			content: copy
		};

		var parent = copy;
		for( var i=0;i<split.length-1;i++) {
			parent = parent[ split[i] ];
		}
		const last = split[ split.length-1 ];
		parent[ last ] = loc
		setLayoutState(copyLayoutState);
	}

	// This returns the location of splits on either side of a given
	// index.  This is best shown with an example:
	//
	// percentage: 0%   25%   50%   75%   100%
	//             ┌─────┬─────┬─────┬─────┐
	//             │ one │ two │three│four │
	//             └─────┴─────┴─────┴─────┘
	//     index: -1  0  1  2  3  4  5  6  7
	//
	// The min/max of distance 1 from index 2 would be 25% and 50%.
	// The min/max of distance 2 from index 3 would be 25% and 75%.
	//
	// It basically returns the value of the splits on each side of
	// from a given index, but is smart in that it returns 0% and
	// 100% rather than try to access an array out of bounds.
	const calcMinMax = (parent,index,distance) => {
		var minValue;
		var maxValue;

		if( index-distance<0 ) {
			minValue = 0;
		} else {
			minValue = parent[ index - distance ];
		}

		if( index+distance>=parent.length) {
			maxValue = 100;
		} else {
			maxValue = parent[ index + distance ];
		}

		return {
			minValue: minValue,
			maxValue: maxValue
		}
	}

	// Performs the move state action.
	const moveSplit = (movingState) => {
		var isVertical = layoutState.areTopLevelSplittersVertical;
		var currentMouseLocation = movingState.currentMouseLocation;

		// This gets the parent of the split in question.
		const split = movingState.split;
		var parent = layoutState.content;
		for( var i=0;i<split.length-1;i++) {
			const component = split[i];

			const {minValue,maxValue} = calcMinMax(parent,component,1);

			currentMouseLocation = convertVector(minValue,maxValue,isVertical,currentMouseLocation);
			isVertical = !isVertical;
			parent = parent[ component ];
		}

		var loc = isVertical ? currentMouseLocation.x : currentMouseLocation.y;

		const splitIndex = split.length-1;
		const {minValue,maxValue} = calcMinMax(parent,split[splitIndex],2);
		if( loc+reshapeMargin>=maxValue ) {
			// The user moved the split beyond the edge of the next spit.  Delete it (and the component it contained).
			parent.splice( split[splitIndex], 2 );
			setToNoneState();
		} else if ( loc-reshapeMargin<=minValue ) {
			// The user moved the split beyond the edge of the previous spit.  Delete it (and the component it contained).
			parent.splice( split[splitIndex]-1, 2 );
			setToNoneState();
		} else {
			// Set new split location.
			setSplitLocation(split,loc);
		}
	}

	// Inserts a split before or after the provided split at given location.
	const insertSplit = (split, loc, isAfter) => {
		var copy = deepContentCopy(layoutState.content);
		if( !Array.isArray(copy) ) {
			copy = [copy];
		}
		var copyLayoutState = {
			areTopLevelSplittersVertical: layoutState.areTopLevelSplittersVertical,
			content: copy
		};

		var parent = copy;
		for( var i=0;i<split.length-1;i++) {
			var child = parent[ split[i] ];
			if( !Array.isArray(child) ) {
				child = [child];
				parent[ split[i] ] = child;
			}
			parent = child;
		}
		const last = split[ split.length-1 ];
		if(isAfter) {
			parent.splice( last+1, 0, loc );
			parent.splice( last+1, 0, "chooser" );
		} else {
			parent.splice( last, 0, "chooser" );
			parent.splice( last, 0, loc );
		}
		setLayoutState(copyLayoutState);
	}

	// Handler for the mouse move event
	const mouseMoved = (e) => {
		determineState(e);
		updateCursor(e);

		if( state.stateEnum===StateEnum.Moving ) {
			moveSplit(state);
		}
	}

	// Handler for the mouse down event
	const mouseDown = (e) => {
		determineState(e);
		updateCursor(e);
	}

	// Handler for the mouse up event
	const mouseUp = (e) => {
		determineState(e);
		updateCursor(e);
	}

	// Generates DOM for browser to display.
	const generateDOM = layoutState => {
		return (
		<div style={{ width: "100%", height: "100%" }}
				tabIndex={0}
				onMouseMove={mouseMoved}
				onMouseDown={mouseDown}
				onMouseUp={mouseUp}>
			{generateContent(layoutState.content,layoutState.areTopLevelSplittersVertical)}
		</div>);
	}

	// Recursive function called by generateDOM.
	const generateContent = (layoutState,isCurrentSplitterVertical) => {

		var styleGenerator;
		if( isCurrentSplitterVertical ) {
			styleGenerator = percent => { return { height: "100%", width: percent+"%", overflow: "auto" } };
		} else {
			styleGenerator = percent => { return { height: percent+"%", width: "100%", overflow: "auto" } };
		}

		var content;
		if( Array.isArray(layoutState) ) {
			if( layoutState.length>0 ) {
				var lastPercent=0;
				var elements=[{
					child: generateContent(layoutState[0],!isCurrentSplitterVertical)
				}];
				for(var i=1;i<layoutState.length;i++) {
					var element = layoutState[i];
					const elementPercent = element-lastPercent;
					elements[elements.length-1].percent = elementPercent;
					lastPercent += elementPercent;
					i++;
					if(i>=layoutState.length) {
						throw "Expect content array to have odd number of elements.  Children name strings with splitter percentages between i="+i+" length="+layoutState.length+".";
					}
					elements.push( {
						child: generateContent(layoutState[i],!isCurrentSplitterVertical)
					});
				}

				elements[elements.length-1].percent = 100-lastPercent;

				content =
					<div style={{display:"flex",
							flexDirection:isCurrentSplitterVertical ? "row" : "column",
							width: "100%",
							height: "100%",
					}}>
						{elements.map( (element,index) => (
						<div key={index} style={styleGenerator(element.percent)}>
							{element.child}
						</div> ))}
					</div>
			} else {
				content = <p>no child!</p>;
			}
		} else {
			content = childMap[layoutState];
		}

		return content;
	}

	return generateDOM(layoutState);
}

export default BlenderSplitter;
