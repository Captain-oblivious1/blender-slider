import {useLayoutEffect, useRef, useState} from 'react';

const BlenderSplitter = ( {children, layout} ) => {

	const ref = useRef(null);
	const [width, setWidth] = useState(0);
	const [height, setHeight] = useState(0);

	useLayoutEffect(() => {
		setWidth(ref.current.offsetWidth);
		setHeight(ref.current.offsetHeight);
		console.log(`qwidth=${width} height=${height}`);
	}, []);

	const [layoutState, setLayoutState] = useState(layout);

	const childMap = {};
	children.forEach( e => childMap[ e.props.id ] = e );

	const StateEnum = {
		None: "None",
		ElgibleToMove: "ElgibleToMove",
		AboutToMove: "AboutToMove",
		Moving: "Moving",
		ElgibleToCopy: "ElgibleToCopy",
		AboutToCopy: "AboutToCopy",
		Copying: "Copying"
	}

	const [state, setState] = useState( {
		stateEnum: StateEnum.None,
	} );

	const eventToPercentVector = e => {
		const rect = e.currentTarget.getBoundingClientRect();
		return {
			x: (e.clientX-rect.left)/(rect.right-rect.left) * 100,
			y: (e.clientY-rect.top)/(rect.bottom-rect.top) * 100 };
	}

	const reshapeMargin = 1;

	const testNearSplit = (percentVector,forMove) => {
		return testNearSplitRecursive(percentVector,layoutState.content,{x:reshapeMargin,y:reshapeMargin},layoutState.areTopLevelSplittersVertical,forMove);
	}

	const testWithinMargin = (one, two, margin) => Math.abs(one - two) <= margin;

	const binarySearch = (content,testForMe,margin) => {

		var minIndex = -1;
		var maxIndex = content.length;
		var foundSplitIndex = null;
		var currentIndex;

		while(minIndex+2<maxIndex) {
			currentIndex = (minIndex+maxIndex)/2;
			if( currentIndex%2===0 ) {
				currentIndex--;
			}
			const currentValue = content[currentIndex];
			if( testWithinMargin( currentValue, testForMe, margin ) ) {
				foundSplitIndex = currentIndex;
				break;
			} else if( testForMe > currentValue ) {
				minIndex = currentIndex;
			} else {
				maxIndex = currentIndex;
			}
		}

		var foundComponentIndex;
		if (foundSplitIndex===null) {
			foundComponentIndex = minIndex+1;
		} else {
			foundComponentIndex = null;
		}

		return {
			foundSplitIndex: foundSplitIndex,
			foundComponentIndex: foundComponentIndex
		}
	}

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

	const testNearSplitRecursive = (percentVector,content,margin,isCurrentSplitterVertical,returnFirst) => {
		//console.log(`testNearSplitRecursive((${percentVector.x},${percentVector.y}),${arrayToString(content)},returnFirst=${returnFirst})`);
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
				const {foundSplitIndex,foundComponentIndex} = binarySearch(content,valToTest,marginToTest);
				foundIndex = foundSplitIndex;
				if( foundIndex===null ) {
					childCandidateIndices = [ foundComponentIndex ];
				} else {
					childCandidateIndices = [ foundSplitIndex-1, foundSplitIndex+1 ];
				}
			} else {
				foundIndex = null;
				childCandidateIndices = null;
			}
		}

		//console.log("foundIndex="+foundIndex);
		var returnMe = [];
		if( returnFirst && foundIndex!=null ) {
			returnMe.push([foundIndex]);
		} else {
			if( isArray ) {
				childCandidateIndices.forEach( childIndex => {
					const minValue = childIndex===0 ? 0 : content[childIndex-1];
					const maxValue = childIndex===length-1 ? length-1 : content[childIndex+1];

					var subPercentVector = convertVector(minValue,maxValue,isCurrentSplitterVertical,percentVector);
					var subMargin = convertMargin(minValue,maxValue,isCurrentSplitterVertical,margin);

					var recurseArray = testNearSplitRecursive(subPercentVector,content[childIndex],subMargin,!isCurrentSplitterVertical,returnFirst);
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

		//printArray("returnMe",returnMe);
		return returnMe;
	}

	// Just for printing.
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

	// Just for printing.
	const arrayToString = (a) => {
		return arrayToStringRecursive(a,"");
	}

	// Just for printing.
	const printArray = (label,a) => {
		console.log(`${label}=${arrayToString(a)}`);
	}

	const pointToString = (p) => `(${p.x},${p.y})`;

	//const isMoveState = stateEnum =>
	//	stateEnum===StateEnum.ElgibleToMoveforMove
	//	|| stateEnum===StateEnum.AboutToMove
	//	|| stateEnum===StateEnum.Moving

	const isCopyState = stateEnum =>
		stateEnum===StateEnum.ElgibleToCopy
		|| stateEnum===StateEnum.AboutToCopy
		|| stateEnum===StateEnum.Copying

	const setToNoneState = () => {
		setState( {
			stateEnum: StateEnum.None
		} );
	}

	const setToElgibleToMoveState = (split) => {
		setState( {
			stateEnum: StateEnum.ElgibleToMove,
			split: split
		} );
	}

	const setToAboutToMoveState = (split,pressSplitLocation,pressMouseLocation) => {
		setState( {
			stateEnum: StateEnum.AboutToMove,
			split: split,
			pressSplitLocation: pressSplitLocation,
			pressMouseLocation: pressMouseLocation
		} );
	}

	const setToMovingState = (split,pressSplitLocation,pressMouseLocation,currentMouseLocation) => {
		setState( {
			stateEnum: StateEnum.Moving,
			split: split,
			pressSplitLocation: pressSplitLocation,
			pressMouseLocation: pressMouseLocation,
			currentMouseLocation: currentMouseLocation
		} );
	}

	const setToElgibleToCopyState = (split) => {
		setState( {
			stateEnum: StateEnum.ElgibleToCopy,
			split: split
		} );
	}

	const setToAboutToCopyState = (split,pressLocation) => {
		setState( {
			stateEnum: StateEnum.AboutToCopy,
			split: split,
			pressLocation: pressLocation
		} );
	}

	const setToCopyingState = () => {
		setState( {
			stateEnum: StateEnum.Copying,
			split: null,
		} );
	}

	const determineState = (e) => {
		const stateEnum = state.stateEnum;
		const percent = eventToPercentVector(e);
		const nearSplit = testNearSplit(percent,!isCopyState(stateEnum));
		const length = nearSplit.length;
		//printArray("nearSplit",nearSplit);

		const isPressedNow = e.buttons &= 1;
		if( isPressedNow ) {
			const currentLocation = eventToPercentVector(e);
			if( stateEnum===StateEnum.None
					|| stateEnum===StateEnum.ElgibleToCopy
					|| stateEnum===StateEnum.ElgibleToMove ) {
				if(e.ctrlKey) {
					if( length>0 && length<3 ) {
						setToAboutToCopyState(nearSplit,currentLocation);
					}
				} else {
					//if( length>1 && length<3 ) {
					if( length>0 ) {
						setToAboutToMoveState(nearSplit,getSplitLocation(nearSplit[0]),currentLocation);
					}
				}
			} else if( stateEnum===StateEnum.AboutToCopy ) {
				if( JSON.stringify(nearSplit) !== JSON.stringify(state.nearSplit) ) {
					setToCopyingState();
				}

			} else if( stateEnum===StateEnum.AboutToMove ) {
				console.log(`nearSplit=${nearSplit} state.nearSplit=${state.nearSplit}`);
				if( JSON.stringify(nearSplit) !== JSON.stringify(state.nearSplit) ) {
					//var minSplit= state.nearSplit[0].length < state.nearSplit[1].length ? state.nearSplit[0] : state.nearSplit[1];
					//printArray("minSplit",minSplit);
					setToMovingState(state.split[0],state.pressSplitLocation,state.pressMouseLocation,percent);
					//console.log("Moving split="+nextState.split+"!!");
				}
			} else if( stateEnum===StateEnum.Copying ) {
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

	const deepContentCopy = (content) => {
		if(Array.isArray(content)) {
			var ret=[];
			content.forEach( element => { ret.push( deepContentCopy(element) ); } );
			return ret;
		} else {
			return content;
		}
	}

	const getSplitLocation = split => {
		var current = layoutState.content;
		split.forEach( element => {
			current = current[element];
		} );
		return current;
	}

	const setSplitLocation = (split,loc) => {
		var copy = deepContentCopy(layoutState.content);
		var copyLayoutState = {
			areTopLevelSplittersVertical: layoutState.areTopLevelSplittersVertical,
			content: copy
		};

		var contentElement = copy;
		var parent = copy;
		for( var i=0;i<split.length-1;i++) {
			parent = parent[ split[i] ];
		}
		const last = split[ split.length-1 ];
		parent[ last ] = loc
		setLayoutState(copyLayoutState);
	}

	const moveSplit = (movingState) => {
		var isVertical = layoutState.areTopLevelSplittersVertical;
		//if( split.length%2===0 )
		//	isVertical = !isVertical;

		var copy = deepContentCopy(layoutState.content);
		var copyLayoutState = {
			areTopLevelSplittersVertical: layoutState.areTopLevelSplittersVertical,
			content: copy
		};

		const pressSplitLocation = movingState.pressSplitLocation;
		const pressMouseLocation = movingState.pressMouseLocation;
		var currentMouseLocation = movingState.currentMouseLocation;

		//console.log(`pressMouseLocation=${JSON.stringify(pressMouseLocation)} currentMouseLocation=${JSON.stringify(currentMouseLocation)}`);
		//var percentOffsetVector = {
		//	x: currentMouseLocation.x-pressMouseLocation.x,
		//	y: currentMouseLocation.y-pressMouseLocation.y
		//};

		//console.log(`percentOffsetVector=${pointToString(percentOffsetVector)}`);

		//var splitLength = currentState.currentMouseInfo.maxSplit - currentState.currentMouseInfo.minSplit;
		//var percentOffset = pixelOffset*100/splitLength;
		//var newPercentages = [...currentState.splitPercentagesOnPress]

		const split = movingState.split;
		var parent = layoutState.content;
		//printArray("split",split);
		for( var i=0;i<split.length-1;i++) {
			const component = split[i];
			var minValue;
			var maxValue;
			if(parent.length==1) {
				minValue = 0;
				maxValue = 100;
			} else {
				minValue = parseFloat( parent[ component - 1 ] );
				maxValue = parseFloat( parent[ component + 1 ] );
			}
			//console.log(`minValue=${minValue} maxValue=${maxValue}`);
			currentMouseLocation = convertVector(minValue,maxValue,isVertical,currentMouseLocation);
			//console.log(`currentMouseLocation=${pointToString(currentMouseLocation)}`);
			isVertical = !isVertical;
			parent = parent[ component ];
		}
		const last = split[ split.length-1 ];

//		const componentOffset = isVertical ? percentOffsetVector.x : percentOffsetVector.y;
//		parent[ last ] = parent[ last ] + componentOffset;
//		//console.log(`contentElement=${contentElement}`);
//		printArray("aboutToSet",copyLayoutState.content);
//		setLayoutState(copyLayoutState);
		//var loc=movingState.pressSplitLocation;
		//console.log("loc before="+loc);
		var loc = isVertical ? currentMouseLocation.x : currentMouseLocation.y;
		//console.log("loc="+loc);
		setSplitLocation(movingState.split,loc);
	}

	const mouseMoved = (e) => {
		determineState(e);
		updateCursor(e);

		if( state.stateEnum===StateEnum.Moving ) {
			//printArray("before move",layoutState.content);
			//printArray("split",state.split);
			moveSplit(state);
			//printArray("after move",layoutState.content);
		}
	}

	const mouseDown = (e) => {
		determineState(e);
		updateCursor(e);
	}

	const mouseUp = (e) => {
		determineState(e);
		updateCursor(e);
	}

	const keyDown = (e) => {
		console.log("keyDown! '"+e.key+"'");
	}

	const generateDOM = layoutState => {
		//printArray("aboutToGenerateDom",layoutState.content);
		return (
		<div ref={ref} style={{ width: "100%", height: "100%" }}
				tabIndex={0}
				onKeyDown={keyDown}
				onMouseMove={mouseMoved}
				onMouseDown={mouseDown}
				onMouseUp={mouseUp}>
			{generateContent(layoutState.content,layoutState.areTopLevelSplittersVertical)}
		</div>);
	}

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
				//printArray("aboutToGenerate",layoutState);
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

				const varDimension="height";
				const constDimension="width";

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
	//return (
	//	<div
	//			style={{display:"flex",
	//					flexDirection: "column",
	//					width: "100%",
	//					height: "100%"}}>
	//		{children.map( (child,index) => (
	//		<div key={index} style={{ height: percentages[index]+"%", width: "100%", overflow: "auto", pointerEvents: "none" }}>
	//			{child}
	//		</div>
	//		))}
	//	</div>
	//);

//	var isOrientationRow;
//
//	// Make sure orientation property is legit
//	if( orientation === "row" ) {
//		isOrientationRow = true;
//	} else if( orientation === "column" ) {
//		isOrientationRow = false;
//	} else {
//		throw "Expect orientation to be either 'row' or 'column'";
//	}
//
//	const nChildren = children.length;
//
//	const [percentages, setPercentages] = useState( children.map( child => parseFloat(child.props.percent) ) );
//
//	const [currentState, setCurrentState] = useState( {
//		currentMouseInfo: null,
//		pressedMouseInfo: null,
//		splitPercentagesOnPress: null,
//		nearEdge: null,
//		nearSplit: null,
//		isCopying : false
//	} );
//
//	// I don't want 2 copies of the code for horizontal and vertical implementations.
//	// They would be the same except left=top, right=bottom, x=y, etc.  So using terms
//	// like "minSplit" instead of left or top, and "maxSplit" instead of right or bottom.
//	//
//	// orientation:   column                 row
//	//
//	//            min<─edge─>          min<─split─>
//	//            Λ  ┌──────┐          Λ  ┌─┬─┬─┬─┐
//	//            │  ├──────┤          │  │ │ │ │ │
//	//          split├──────┤         edge│ │ │ │ │
//	//            │  ├──────┤          │  │ │ │ │ │
//	//            V  └──────┘          V  └─┴─┴─┴─┘
//	//                       max                   max
//
//	var resizeCursor;
//	var calculateMouseInfo;
//	if( isOrientationRow ) {
//		resizeCursor = "col-resize";
//
//		calculateMouseInfo = e => {
//			const rect = e.currentTarget.getBoundingClientRect();
//
//			return {
//				minSplit : rect.left,
//				maxSplit : rect.right,
//				minEdge : rect.top,
//				maxEdge : rect.bottom,
//				mouseLocation : {
//					split: e.clientX,
//					edge: e.clientY }
//			}
//		}
//	} else {
//		resizeCursor = "row-resize";
//
//		calculateMouseInfo = e => {
//			const rect = e.currentTarget.getBoundingClientRect();
//
//			return {
//				minSplit : rect.top,
//				maxSplit : rect.bottom,
//				minEdge : rect.left,
//				maxEdge : rect.right,
//				mouseLocation : {
//					split: e.clientY,
//					edge: e.clientX }
//			}
//		}
//	}
//
//	const reshapeMargin = 10;
//
//	const testWithinMargin = (one, two) => Math.abs(one - two) <= reshapeMargin;
//
//	const testNearSplit = mouseInfo => {
//		var locationOfSplitUnderConsideration = mouseInfo.minSplit;
//		var locationOfCurrentMouse = mouseInfo.mouseLocation.split;
//		if( testWithinMargin(locationOfCurrentMouse,locationOfSplitUnderConsideration) ) {
//			return 0;
//		} else {
//			const splitLength = mouseInfo.maxSplit-mouseInfo.minSplit;
//			for(var i=0;i<percentages.length;i++) {
//				locationOfSplitUnderConsideration +=  splitLength * percentages[i]*.01;
//				if( testWithinMargin(locationOfCurrentMouse,locationOfSplitUnderConsideration) ) {
//					return i+1;
//				}
//			};
//		}
//
//		return null;
//	}
//
//	const testNearEdge = mouseInfo => {
//		const mouseLocationInEdgeCoordinates = mouseInfo.mouseLocation.edge;
//		if( testWithinMargin( mouseInfo.minEdge, mouseLocationInEdgeCoordinates ) )
//			return 0;
//		else if( testWithinMargin( mouseInfo.maxEdge, mouseLocationInEdgeCoordinates ) )
//			return 1;
//		else
//			return null;
//	}
//
//	const mouseDown = (e) => {
//		determineState(e);
//	}
//
//	const mouseUp = (e) => {
//		determineState(e);
//	}
//
//	const mouseMoved = (e) => {
//		determineState(e);
//
//		if( currentState.isCopying ) {
//		} else {
//			if( currentState.pressedMouseInfo!==null ) {
//				if( currentState.nearEdge!==null ) {
//				} else if( currentState.nearSplit!==null &&
//						currentState.nearSplit!==0 &&
//						currentState.nearSplit!==nChildren ) {
//					var pixelOffset = currentState.currentMouseInfo.mouseLocation.split - currentState.pressedMouseInfo.mouseLocation.split;
//					var splitLength = currentState.currentMouseInfo.maxSplit - currentState.currentMouseInfo.minSplit;
//					var percentOffset = pixelOffset*100/splitLength;
//					var newPercentages = [...currentState.splitPercentagesOnPress]
//					newPercentages[currentState.nearSplit-1] += parseFloat(percentOffset);
//					newPercentages[currentState.nearSplit] -= parseFloat(percentOffset);
//					setPercentages(newPercentages);
//				}
//			}
//		}
//	}
//
//	const determineState = (e) => {
//		const currentMouseInfo = calculateMouseInfo(e);
//		const nearEdge = testNearEdge( currentMouseInfo );
//		const nearSplit = testNearSplit( currentMouseInfo );
//		
//		var pressedMouseInfo;
//		var splitPercentagesOnPress;
//
//		const wasPressedBefore = currentState.pressedMouseInfo!=null;
//		const isPressedNow = e.buttons &= 1;
//		if( isPressedNow ) {
//			if( wasPressedBefore ) {
//				pressedMouseInfo = currentState.pressedMouseInfo; // Keep original info
//				splitPercentagesOnPress = currentState.splitPercentagesOnPress;
//			} else {
//				if( nearSplit!=null ) {
//					pressedMouseInfo = currentMouseInfo; // Copy current mode info to pressed
//					splitPercentagesOnPress = [...percentages];
//				} else {
//					pressedMouseInfo = null;
//					splitPercentagesOnPress = null;
//				}
//			}
//		} else {
//			pressedMouseInfo = null; // clear out
//			splitPercentagesOnPress = null;
//		}
//
//		const isCopying = e.ctrlKey;
//
//		setCurrentState( {
//			currentMouseInfo: currentMouseInfo,
//			pressedMouseInfo: pressedMouseInfo,
//			splitPercentagesOnPress: splitPercentagesOnPress,
//			nearEdge: nearEdge,
//			nearSplit: nearSplit,
//			isCopying: isCopying
//		} );
//		
//		drawCursor(currentState,e.currentTarget);
//
//		return currentState;
//	}
//
//	const drawCursor = (state,target) => {
//		var cursorToUse;
//		if( state.nearSplit!=null && state.nearSplit!=0 && state.nearSplit!=nChildren ) {
//			cursorToUse = resizeCursor;
//		} else if( state.isCopying ) {
//			if( state.nearEdge!=null ||  state.nearSplit != null ) {
//				cursorToUse = "copy";
//			} else {
//				cursorToUse = "default";
//			}
//		} else {
//			cursorToUse = "default";
//		}
//		target.style.cursor = cursorToUse;
//	}
//
//	return (
//		<div
//				onMouseUp={mouseUp}
//				onMouseDown={mouseDown}
//				onMouseMove={mouseMoved}
//				style={{display:"flex",
//						flexDirection: "column",
//						width: "100%",
//						height: "100%"}}>
//			{children.map( (child,index) => (
//			<div key={index} style={{ height: percentages[index]+"%", width: "100%", overflow: "auto", pointerEvents: "none" }}>
//				{child}
//			</div>
//			))}
//		</div>
//	);
//}

export default BlenderSplitter;
