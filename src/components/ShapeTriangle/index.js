/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from 'react';

const ShapeTriangle = ({ width = '70%', height = '70%', fill, styles }) => (
    <svg
        width={width}
        height={height}
        viewBox="0 0 204 243"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ ...styles }}
    >
        <path
            d="M15.6811 149.331C-4.67581 136.361 -4.67583 106.639 15.6811 93.669L153.018 6.16625C174.986 -7.83051 203.75 7.94909 203.75 33.9973L203.75 209.003C203.75 235.051 174.986 250.831 153.018 236.834L15.6811 149.331Z"
            fill={fill}
        />
    </svg>
);

export default ShapeTriangle;
