/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from 'react';

const ShapeSquare = ({ width = '70%', height = '70%', fill }) => (
    <svg
        width={width}
        height={height}
        viewBox="0 0 203 203"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect
            y="203"
            width="203"
            height="203"
            rx="30"
            transform="rotate(-90 0 203)"
            fill={fill}
        />
    </svg>
);

export default ShapeSquare;
