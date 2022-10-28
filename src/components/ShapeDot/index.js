/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from 'react';

import styles from './styles.module.scss';

const ShapeDot = ({ fill = '#000000' }) => (
    <div className={styles.dot} style={{ background: fill }} />
);

export default ShapeDot;
