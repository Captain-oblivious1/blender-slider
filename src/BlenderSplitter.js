import { useState } from "react";

const BlenderSplitter = ( {children, orientation} ) => {

	return (
		<div style={{display:"flex", flexDirection: "column", width: "400px", height: "200px", border: "1px solid black"}}>
			{children.map( (child,index) => (
			<div key={index} style={{ height: child.props.percent+"%", width: "100%", border: "1px solid black", overflow: "auto" }}>
				{child}
			</div>
			))}
		</div>
	);
}

export default BlenderSplitter;
