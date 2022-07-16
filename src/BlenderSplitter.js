import { useState } from "react";

const BlenderSplitter = ( {children} ) => {

	//console.log("number of children=" + children.length)
	

	return (

		<div style={{display:"flex", flexDirection: "column", width: "400", height: "200px", border: "1px solid black"}}>
			<div style={{background: "aqua", height: "60%", width: "100%"}}>
				<p>DIV #1</p>
			</div>
			<div style={{height: "5px"}}>
			</div>
			<div style={{background: "red", height: "40%", width: "100%"}}>
				<p>DIV #2</p>
			</div>
		</div>
	);
}

export default BlenderSplitter;
