//import { useState } from "react";
//import Vector from "./Vector"

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

	class StateInfo {
		constructor(
				currentMouseInfo,
				pressedMouseInfo,
				nearEdge,
				nearSplit,
				isCopying,
				) {
			this.currentMouseInfo = currentMouseInfo;
			this.pressedMouseInfo = pressedMouseInfo;
			this.nearEdge = nearEdge;
			this.nearSplit = nearSplit;
			this.isCopying = isCopying;
		}
	}

	const nChildren = children.length;

	var currentState = new StateInfo(
				null,
				null,
				null,
				null,
				false);

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
				currentMouseLocation : {
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
				currentMouseLocation : {
					split: e.clientY,
					edge: e.clientX }
			}
		}
	}

	const reshapeMargin = 2;

	const testWithinMargin = (one, two) => Math.abs(one - two) <= reshapeMargin;

	const testNearSplit = mouseInfo => {
		var locationOfSplitUnderConsideration = mouseInfo.minSplit;
		var locationOfCurrentMouse = mouseInfo.currentMouseLocation.split;
		var which = null;
		if( testWithinMargin(locationOfCurrentMouse,locationOfSplitUnderConsideration) ) {
			which = 0;
		} else {
			children.every( (child,index) => {
				locationOfSplitUnderConsideration += (mouseInfo.maxSplit-mouseInfo.minSplit) * child.props.percent*.01;
				if( testWithinMargin(locationOfCurrentMouse,locationOfSplitUnderConsideration) ) {
					which = index + 1;
					return false;
				}
				return true;
			} );
		}

		return which;
	}

	const testNearEdge = mouseInfo => {
		const currentMouseLocationInEdgeCoordinates = mouseInfo.currentMouseLocation.edge;
		if( testWithinMargin( mouseInfo.minEdge, currentMouseLocationInEdgeCoordinates ) )
			return 0;
		else if( testWithinMargin( mouseInfo.maxEdge, currentMouseLocationInEdgeCoordinates ) )
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
	}

	const determineState = (e) => {
		const currentMouseInfo = calculateMouseInfo(e);
		
		var pressedMouseInfo;
		const wasPressedBefore = currentState.pressedMouseInfo!=null;
		const isPressedNow = e.button == 0;
		if( isPressedNow ) {
			if( wasPressedBefore ) {
				pressedMouseInfo = currentState.pressedMouseInfo; // Keep original info
			} else {
				pressedMouseInfo = currentMouseInfo;
			}
		} else {
			pressedMouseInfo = null; // clear out
		}

		const nearEdge = testNearEdge( currentMouseInfo );
		const nearSplit = testNearSplit( currentMouseInfo );
		const isCopying = e.ctrlKey;

		currentState = new StateInfo(
				currentMouseInfo,
				pressedMouseInfo,
				nearEdge,
				nearSplit,
				isCopying);
		
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
			<div key={index} style={{ height: child.props.percent+"%", width: "100%", overflow: "auto" }}>
				{child}
			</div>
			))}
		</div>
	);
}

export default BlenderSplitter;
