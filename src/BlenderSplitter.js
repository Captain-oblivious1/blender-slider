import { useState } from "react";

const BlenderSplitter = ( {children, orientation} ) => {

	return (
		<div style={{display:"flex", flexDirection: "column", width: "100%", height: "100%"}}>
			{children.map( (child,index) => (
			<div key={index} style={{ height: child.props.percent+"%", width: "100%", overflow: "auto" }}>
				{child}
			</div>
			))}
		</div>
	);
}

export default BlenderSplitter;
