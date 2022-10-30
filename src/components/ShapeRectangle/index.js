/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from 'react';

const ShapeRectangle = ({ width = '70%', height = '70%', fill, styles }) => (
    <svg
        width={width}
        height={height}
        viewBox="0 0 165 242"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ ...styles }}
    >
        <rect
            y="242"
            width="242"
            height="165"
            rx="30"
            transform="rotate(-90 0 242)"
            fill={fill}
        />
    </svg>
);

export default ShapeRectangle;
