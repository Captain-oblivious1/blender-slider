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
	//                        max                   max

	if( isOrientationRow ) {
		resizeCursor = "col-resize";

		calculateMouseInfo = e => {
			const rect = e.currentTarget.getBoundingClientRect();

			return {
				minSplit : rect.left,
				maxSplit : rect.right,
				minEdge : rect.top,
				maxEdge : rect.bottom,
				pressedMouseLocation : pressSnapshot ? {
					split: pressSnapshot.mouseLocation.x,
					edge: pressSnapshot.mouseLocation.y } : null,
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
				pressedMouseLocation : pressSnapshot ? {
					split: pressSnapshot.mouseLocation.y,
					edge: pressSnapshot.mouseLocation.x } : null,
				currentMouseLocation : {
					split: e.clientY,
					edge: e.clientX }
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
			//console.log(`mouse down location=(${e.clientX},${e.clientY})`);
		}
	}

	const mouseUp = (e) => {
		pressSnapshot = null;
	}

	const nChildren = children.length;

	const State = {
		ToCopyEdge: 1,
		ToCopySplit: 2,
		ToResizeSplit: 3,
		CopyingEdge: 4,
		CopyingSplit: 5,
		ResizingSplit: 6,
		None: 4
	}

	const mouseMoved = (e) => {
		// Convert mouse info to split/edge coordinate system
		const mouseInfo = calculateMouseInfo(e);

		// Test to see if cursor is near any splits (used all over the place below)
		const nearSplit = testNearAnySplit( mouseInfo );

		const currentMouseLocationInEdge = mouseInfo.currentMouseLocation.edge;

		// Set state based on location and ctrl key
		var state;
		if( e.ctrlKey ) {
			if(
					testWithinMargin( mouseInfo.minEdge, currentMouseLocationInEdge ) ||
					testWithinMargin( mouseInfo.maxEdge, currentMouseLocationInEdge ) ) {
				cursorToUse = "copy";
				state = pressSnapshot===null ? State.ToCopyEdge : State.CopyingEdge;
			} else if( nearSplit != null ){
				cursorToUse = "copy";
				state = pressSnapshot===null ? State.ToCopySplit : State.CopyingSplit;
			} else {
				state = State.None;
			}
		} else if( nearSplit!=null && nearSplit!=0 && nearSplit!=nChildren ) {
			cursorToUse = resizeCursor;
			state = pressSnapshot===null ? State.ToResizeSplit : State.ResizeSplit;
		} else {
			state = State.None;
		}
		e.currentTarget.style.cursor = cursorToUse;

		switch(state) {
			case State.CopyEdge:
			case State.CopySplit:
				break;
			case State.ResizeSplit:
				resizeSplit();
				break;
			default:
				break;
		}
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
