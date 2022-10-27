/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from 'react';

const ShapeCircle = ({ width = '70%', height = '70%', fill }) => (
    <svg
        width={width}
        height={height}
        viewBox="0 0 172 172"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle
            cx="86"
            cy="86"
            r="86"
            transform="rotate(-90 86 86)"
            fill={fill}
        />
    </svg>
);

export default ShapeCircle;
