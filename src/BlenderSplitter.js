import { useState } from "react";

const BlenderSplitter = ( {children, orientation} ) => {

	var isOrientationRow;

	// Make sure orientation property is legit
	if( orientation === "row" ) {
		isOrientationRow = true;
	} else if( orientation === "column" ) {
		isOrientationRow = false;
	} else {
		throw "Expect orientation to be either 'row' or 'column'";
	}

	const nChildren = children.length;

	const [percentages, setPercentages] = useState( children.map( child => parseFloat(child.props.percent) ) );

	const [currentState, setCurrentState] = useState( {
		currentMouseInfo: null,
		pressedMouseInfo: null,
		splitPercentagesOnPress: null,
		nearEdge: null,
		nearSplit: null,
		isCopying : false
	} );

	// I don't want 2 copies of the code for horizontal and vertical implementations.
	// They would be the same except left=top, right=bottom, x=y, etc.  So using terms
	// like "minSplit" instead of left or top, and "maxSplit" instead of right or bottom.
	//
	// orientation:   column                 row
	//
	//            min<─edge─>          min<─split─>
	//            Λ  ┌──────┐          Λ  ┌─┬─┬─┬─┐
	//            │  ├──────┤          │  │ │ │ │ │
	//          split├──────┤         edge│ │ │ │ │
	//            │  ├──────┤          │  │ │ │ │ │
	//            V  └──────┘          V  └─┴─┴─┴─┘
	//                       max                   max

	var resizeCursor;
	var calculateMouseInfo;
	if( isOrientationRow ) {
		resizeCursor = "col-resize";

		calculateMouseInfo = e => {
			const rect = e.currentTarget.getBoundingClientRect();

			return {
				minSplit : rect.left,
				maxSplit : rect.right,
				minEdge : rect.top,
				maxEdge : rect.bottom,
				mouseLocation : {
					split: e.clientX,
					edge: e.clientY }
			}
		}
	} else {
		resizeCursor = "row-resize";

		calculateMouseInfo = e => {
			const rect = e.currentTarget.getBoundingClientRect();

			return {
				minSplit : rect.top,
				maxSplit : rect.bottom,
				minEdge : rect.left,
				maxEdge : rect.right,
				mouseLocation : {
					split: e.clientY,
					edge: e.clientX }
			}
		}
	}

	const reshapeMargin = 10;

	const testWithinMargin = (one, two) => Math.abs(one - two) <= reshapeMargin;

	const testNearSplit = mouseInfo => {
		var locationOfSplitUnderConsideration = mouseInfo.minSplit;
		var locationOfCurrentMouse = mouseInfo.mouseLocation.split;
		if( testWithinMargin(locationOfCurrentMouse,locationOfSplitUnderConsideration) ) {
			return 0;
		} else {
			const splitLength = mouseInfo.maxSplit-mouseInfo.minSplit;
			for(var i=0;i<percentages.length;i++) {
				locationOfSplitUnderConsideration +=  splitLength * percentages[i]*.01;
				if( testWithinMargin(locationOfCurrentMouse,locationOfSplitUnderConsideration) ) {
					return i+1;
				}
			};
		}

		return null;
	}

	const testNearEdge = mouseInfo => {
		const mouseLocationInEdgeCoordinates = mouseInfo.mouseLocation.edge;
		if( testWithinMargin( mouseInfo.minEdge, mouseLocationInEdgeCoordinates ) )
			return 0;
		else if( testWithinMargin( mouseInfo.maxEdge, mouseLocationInEdgeCoordinates ) )
			return 1;
		else
			return null;
	}

	const mouseDown = (e) => {
		determineState(e);
	}

	const mouseUp = (e) => {
		determineState(e);
	}

	const mouseMoved = (e) => {
		determineState(e);

		if( currentState.isCopying ) {
		} else {
			if( currentState.pressedMouseInfo!==null ) {
				if( currentState.nearEdge!==null ) {
				} else if( currentState.nearSplit!==null &&
						currentState.nearSplit!==0 &&
						currentState.nearSplit!==nChildren ) {
					var pixelOffset = currentState.currentMouseInfo.mouseLocation.split - currentState.pressedMouseInfo.mouseLocation.split;
					var splitLength = currentState.currentMouseInfo.maxSplit - currentState.currentMouseInfo.minSplit;
					var percentOffset = pixelOffset*100/splitLength;
					var newPercentages = [...currentState.splitPercentagesOnPress]
					newPercentages[currentState.nearSplit-1] += parseFloat(percentOffset);
					newPercentages[currentState.nearSplit] -= parseFloat(percentOffset);
					setPercentages(newPercentages);
				}
			}
		}
	}

	const determineState = (e) => {
		const currentMouseInfo = calculateMouseInfo(e);
		const nearEdge = testNearEdge( currentMouseInfo );
		const nearSplit = testNearSplit( currentMouseInfo );
		
		var pressedMouseInfo;
		var splitPercentagesOnPress;

		const wasPressedBefore = currentState.pressedMouseInfo!=null;
		const isPressedNow = e.buttons &= 1;
		if( isPressedNow ) {
			if( wasPressedBefore ) {
				pressedMouseInfo = currentState.pressedMouseInfo; // Keep original info
				splitPercentagesOnPress = currentState.splitPercentagesOnPress;
			} else {
				if( nearSplit!=null ) {
					pressedMouseInfo = currentMouseInfo; // Copy current mode info to pressed
					splitPercentagesOnPress = [...percentages];
				} else {
					pressedMouseInfo = null;
					splitPercentagesOnPress = null;
				}
			}
		} else {
			pressedMouseInfo = null; // clear out
			splitPercentagesOnPress = null;
		}

		const isCopying = e.ctrlKey;

		setCurrentState( {
			currentMouseInfo: currentMouseInfo,
			pressedMouseInfo: pressedMouseInfo,
			splitPercentagesOnPress: splitPercentagesOnPress,
			nearEdge: nearEdge,
			nearSplit: nearSplit,
			isCopying: isCopying
		} );
		
		drawCursor(currentState,e.currentTarget);

		return currentState;
	}

	const drawCursor = (state,target) => {
		var cursorToUse;
		if( state.nearSplit!=null && state.nearSplit!=0 && state.nearSplit!=nChildren ) {
			cursorToUse = resizeCursor;
		} else if( state.isCopying ) {
			if( state.nearEdge!=null ||  state.nearSplit != null ) {
				cursorToUse = "copy";
			} else {
				cursorToUse = "default";
			}
		} else {
			cursorToUse = "default";
		}
		target.style.cursor = cursorToUse;
	}

	return (
		<div
				onMouseUp={mouseUp}
				onMouseDown={mouseDown}
				onMouseMove={mouseMoved}
				style={{display:"flex",
						flexDirection: "column",
						width: "100%",
						height: "100%"}}>
			{children.map( (child,index) => (
			<div key={index} style={{ height: percentages[index]+"%", width: "100%", overflow: "auto" }}>
				{child}
			</div>
			))}
		</div>
	);
}

export default BlenderSplitter;
