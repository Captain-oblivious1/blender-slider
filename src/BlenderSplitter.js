import { useState } from "react";
import Vector from "./Vector"

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

	var resizeCursor;
	var calculateMouseInfo;

	var pressSnapshot = null;

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

	if( isOrientationRow ) {
		resizeCursor = "col-resize";

		calculateMouseInfo = e => {
			const rect = e.currentTarget.getBoundingClientRect();

			return {
				minSplit : rect.left,
				maxSplit : rect.right,
				minEdge : rect.top,
				maxEdge : rect.bottom,
				//pressedMouseLocation : pressSnapshot ? {
				//	split: pressSnapshot.mouseLocation.x,
				//	edge: pressSnapshot.mouseLocation.y } : null,
				//currentMouseLocation : {  
				//	split: e.clientX,
				//	edge: e.clientY }
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
				//pressedMouseLocation : pressSnapshot ? {
				//	split: pressSnapshot.mouseLocation.y,
				//	edge: pressSnapshot.mouseLocation.x } : null,
				//currentMouseLocation : {
				//	split: e.clientY,
				//	edge: e.clientX }
			}
		}
	}

	const reshapeMargin = 2;

	const testWithinMargin = (one, two) => Math.abs(one - two) <= reshapeMargin;

	const testNearAnySplit = mouseInfo => {
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

	const mouseDown = (e) => {
		if( pressSnapshot === null ) {
			pressSnapshot = {
				ctrlDown : e.ctrlKey,
				mouseLocation : new Vector( e.clientX, e.clientY ),
				splitPercentages : children.map( child => child.percent )
			};
		}
	}

	const mouseUp = (e) => {
		pressSnapshot = null;
	}

	const nChildren = children.length;

	//const MouseProximityEnum = {
	//	NearEdge: 1,
	//	NearSplit: 2,
	//	None: 3
	//}

	class StateInfo {
		constructor(
				//mouseProximity,
				nearEdge,
				nearSplit,
				pressedMouseInfo,
				currentMouseInfo,
				isCopying,
				) {
			//this.mouseState = mouseState;
			this.nearEdge = nearEdge;
			this.nearSplit = nearSplit;
			this.pressedMouseInfo = pressedMouseInfo;
			this.currentMouseInfo = currentMouseInfo;
			this.isCopying = isCopying;
		}
	}

	const mouseMoved = (e) => {
		// Convert mouse info to split/edge coordinate system
		const mouseInfo = calculateMouseInfo(e);

		var state = calculateState(e,mouseInfo);

		drawCursor(state,e.currentTarget);

		//switch(state) {
		//	case State.CopyEdge:
		//	case State.CopySplit:
		//		break;
		//	case State.ResizeSplit:
		//		resizeSplit();
		//		break;
		//	default:
		//		break;
		//}
	}


	const drawCursor = (state,target) => {

		var cursorToUse;
		if( state.isCopying ) {
			if( state.nearEdge!=null ||  state.nearSplit != null ) {
				cursorToUse = "copy";
			} else {
				cursorToUse = "default";
			}
		} else if( state.nearSplit!=null && state.nearSplit!=0 && state.nearSplit!=nChildren ) {
			cursorToUse = resizeCursor;
		} else {
			cursorToUse = "default";
		}
		target.style.cursor = cursorToUse;
	}

	const calculateState = (e,mouseInfo) => {
		const currentMouseLocationInEdge = mouseInfo.currentMouseLocation.edge;
		// Set state based on location and ctrl key

		// Test to see if cursor is near any splits (used all over the place below)
		const nearSplit = testNearAnySplit( mouseInfo );
	
		var cursorToUse;
		if( e.ctrlKey ) {
			if(
					testWithinMargin( mouseInfo.minEdge, currentMouseLocationInEdge ) ||
					testWithinMargin( mouseInfo.maxEdge, currentMouseLocationInEdge ) ) {
				cursorToUse = "copy";
				//state = pressSnapshot===null ? State.ToCopyEdge : State.CopyingEdge;
			} else if( nearSplit != null ){
				cursorToUse = "copy";
				//state = pressSnapshot===null ? State.ToCopySplit : State.CopyingSplit;
			} else {
				//state = State.None;
				cursorToUse = "default";
			}
		} else if( nearSplit!=null && nearSplit!=0 && nearSplit!=nChildren ) {
			cursorToUse = resizeCursor;
			//state = pressSnapshot===null ? State.ToResizeSplit : State.ResizeSplit;
		} else {
			//state = State.None;
			cursorToUse = "default";
		}
		e.currentTarget.style.cursor = cursorToUse;
	}

	const resizeSplit = mouseInfo => {
		

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
